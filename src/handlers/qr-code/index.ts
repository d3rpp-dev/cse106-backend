import { IRequest, Router, error, json } from 'itty-router';
import { check_admin } from '../auth/admin_check';
import { HTTP_STATUS_CODES } from '../../interfaces/http';
import { IQRCode, QRCodeStatus } from '../../interfaces/qrcode';
import { generate_jwt } from '../auth/jwt';
import { generate_ulid } from '../../utils/ulid';
import { number } from 'zod';

const qrcode_router = Router<IRequest, [Env, ExecutionContext]>({ base: '/api/qrcodes' });

qrcode_router.post('/request', async (req: IRequest, env: Env, _ctx: ExecutionContext) => {
	if (check_admin(req) === null) {
		return error(HTTP_STATUS_CODES.your_fault.dumbass, { message: 'Administrators cannot have QR Codes' });
	}

	const qrcode_status = await env.D1.prepare(`SELECT qrcode_status FROM \`users\` where id = ?1`).bind(req.user).run();

	if (!qrcode_status.success) {
		return error(HTTP_STATUS_CODES.my_fault.broken, {
			message: qrcode_status.error,
		});
	} else {
		if (qrcode_status.results.length !== 0) {
			switch (qrcode_status.results[0].qrcode_status) {
				case QRCodeStatus.NotEligible:
				case QRCodeStatus.Requested:
					return error(HTTP_STATUS_CODES.your_fault.dumbass, {
						message: 'User is ineligible for a QRCode or has already got an active request',
					});
			}
		}

		// user does not have active request
		// user is eligible for a QR Code

		const request_status = await env.D1.prepare(`UPDATE \`users\` SET qrcode_status = ?1 WHERE id = ?2`)
			.bind(QRCodeStatus.Requested, req.user)
			.run();

		if (!request_status.success) {
			return error(HTTP_STATUS_CODES.my_fault.broken, {
				message: request_status.error,
			});
		}

		return new Response(null, { status: HTTP_STATUS_CODES.done.empty });
	}
});

qrcode_router.get('/', async (req: IRequest, env: Env, _ctx: ExecutionContext) => {
	// get the QR Code details, ordered by which one will expire last, as this will get the latest one
	const qrcode_select = await env.D1.prepare(`SELECT * FROM \`qr_codes\` WHERE user_id = ?1 ORDER BY expiry DESC LIMIT 1`)
		.bind(req.user)
		.run();

	if (!qrcode_select.success) {
		return error(HTTP_STATUS_CODES.my_fault.broken, {
			message: qrcode_select.error,
		});
	} else {
		if (qrcode_select.results.length === 0) {
			return error(HTTP_STATUS_CODES.your_fault.blind_ass, {
				message: 'User does not have a QR Code',
			});
		}

		const qrcode_details = qrcode_select.results[0] as unknown as IQRCode;
		const token = await generate_jwt<{}, { qrcode_id: string; exp: number }>(
			{},
			{
				qrcode_id: qrcode_details.image_id,
				exp: qrcode_details.expiry,
			},
			env.PRIVATE_KEY,
		)

		return json({
			token: `https://cse106-backend.d3rpp.dev/api/qrcodes/get_image/${encodeURIComponent(token)}`,
			exp: qrcode_details.expiry,
		});
	}
});

qrcode_router.get("/requests", async (req: IRequest, env: Env, _ctx: ExecutionContext) => {
	const admin_check = check_admin(req);
	if (admin_check !== null) return admin_check;

	let { limit, from } = req.query;

	let query_params = {
		limit_actual: 10,
		from_actual: 0,
	};

	let l = number().gt(0).lte(100).safeParse(limit);
	if (l.success) {
		query_params.limit_actual = l.data;
	}

	let f = number().gt(0).lte(new Date().getTime()).safeParse(from);
	if (f.success) {
		query_params.from_actual = f.data;
	}

	const requests = await env.D1.prepare(`SELECT users.*, COUNT(vaccinations.id) AS vaccine_count FROM users LEFT JOIN vaccinations ON users.id = vaccinations.user_id WHERE users.qrcode_status = ?1 and users.dob_ts >= ?2 GROUP BY users.id ORDER BY users.dob_ts DESC LIMIT ?3`)
		.bind(QRCodeStatus.Requested, query_params.from_actual, query_params.limit_actual).run();

	if (!requests.success) {
		return error(HTTP_STATUS_CODES.my_fault.broken, {
			message: requests.error
		});
	} else {
		return json({
			count: requests.results.length,
			results: requests.results
		});
	}
})

// getting the image asset is implemented in ./get_image.ts and handles auth itself with its own token,
// you must generate your own token from the above function

qrcode_router.put('/approve/:user_id', async (req: IRequest, env: Env, _ctx: ExecutionContext) => {
	const admin_check = check_admin(req);
	if (admin_check !== null) return admin_check;

	const ONE_YEAR = 1000 * 60 * 60 * 24 * 365; // 1000 millis * 60 secs * 60 mins * 24 hrs * 365 days
	const exp = new Date().getTime() + ONE_YEAR;

	const vaccination_status = await env.D1.prepare(`SELECT count(*) FROM \`vaccinations\` WHERE user_id = ?1`).bind(req.params.user_id).first<{ 'count(*)': number }>();

	// generate and store QRCode
	const qrcode_token = await generate_jwt<{ type: string }, { user_id: string, exp: number, vaccination_status: number }>({ type: "QR" }, {
		user_id: req.params.user_id,
		exp,
		vaccination_status: vaccination_status?.['count(*)'] ?? 0
	}, env.PRIVATE_KEY);

	const qrcode_id = generate_ulid();

	try {
		const image_response = await fetch(`https://quickchart.io/qr?text=${encodeURIComponent(qrcode_token)}&format=png&size=800`)

		const image = await env.R2.put(qrcode_id, await image_response.arrayBuffer());

		if (image === null) {
			return error(HTTP_STATUS_CODES.my_fault.broken, {
				message: "Failed to generate QR Code"
			});
		}

		await env.D1
			.prepare(`INSERT INTO \`qr_codes\` (id, user_id, expiry, image_id, token) VALUES (?1, ?2, ?3, ?4, ?5)`)
			.bind(generate_ulid(), req.params.user_id, exp, qrcode_id, qrcode_token)
			.run();

		return new Response(null, { status: HTTP_STATUS_CODES.done.empty });
	} catch (_e) {
		return error(HTTP_STATUS_CODES.my_fault.broken, {
			message: "Failed to generate QR Code"
		});
	}
});

export const qrcode_middleware = (req: IRequest, env: Env, ctx: ExecutionContext) => qrcode_router.handle(req, env, ctx);
