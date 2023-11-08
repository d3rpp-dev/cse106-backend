import { IRequest, Router, error, json } from 'itty-router';
import { HTTP_STATUS_CODES } from '../../interfaces/http';

import * as Schema from './schemas';

import * as JWT from './jwt';
import { generate_ulid } from '../../utils/ulid';

import { DBUser, IUser } from '../../interfaces/user';
import { QRCodeStatus } from '../../interfaces/qrcode';
import { hash_pass } from '../../utils/hash';

const auth_router = Router<IRequest, [Env, ExecutionContext]>({ base: '/auth' });

auth_router.post('/login', async (req: IRequest, env: Env, _ctx: ExecutionContext) => {
	let body_parsed_possibility = Schema.LoginSchema.safeParse(await req.json());

	if (!body_parsed_possibility.success) {
		let e = body_parsed_possibility.error;

		return error(HTTP_STATUS_CODES.your_fault.dumbass, { message: e.message });
	} else {
		let body: Schema.LoginRequest = body_parsed_possibility.data;

		let user = await env.D1.prepare('SELECT (*) FROM `users` WHERE email = ?1').bind(body.email).first<DBUser>();

		if (user === null || user.id === null) {
			return error(HTTP_STATUS_CODES.your_fault.liar, { message: 'Invalid Username or Password' });
		} else {
			let saved_password = await env.D1.prepare('SELECT (hash) FROM `passwords` WHERE user_id = ?1')
				.bind(user.id)
				.first<{ hash: string }>();

			if (saved_password?.hash) {
				if (
					(await hash_pass(body.password, env.PRIVATE_KEY)) === saved_password.hash
				) {
					// valid password

					const current_date = new Date().getTime();
					const ONE_WEEK = 1000 * 60 * 60 * 24 * 7; // 1000 millis * 60 secs * 60 mins * 24 hrs * 7 days

					const token = await JWT.generate_jwt(
						{},
						{
							iss: current_date,
							user_id: user.id,
							exp: current_date + ONE_WEEK,
						},
						env.PRIVATE_KEY,
					);

					const details_query = await env.D1.batch<{ 'count(*)': number }>([
						env.D1.prepare('SELECT count(*) FROM `issues` WHERE user_id = ?1').bind(user.id),
						env.D1.prepare('SELECT count(*) FROM `tests` WHERE user_id = ?1').bind(user.id),
						env.D1.prepare('SELECT count(*) FROM `vaccinations` WHERE user_id = ?1').bind(user.id),
					]);

					return json(
						{
							token,

							id: user.id,

							email: user.email,
							family_name: user.family_name,
							given_name: user.given_name,

							national_health_index: user.national_health_index,
							dob_ts: user.dob_ts,

							qrcode_status: user.qrcode_status,

							issue_count: +details_query[0].results[0]['count(*)'],
							test_count: +details_query[1].results[0]['count(*)'],
							vaccine_status: +details_query[1].results[0]['count(*)'],
						} satisfies IUser & { token: string },
						{ status: HTTP_STATUS_CODES.done.ok },
					);
				} else {
					return error(HTTP_STATUS_CODES.your_fault.liar, { message: 'Invalid Username or Password' });
				}
			} else {
				return error(HTTP_STATUS_CODES.my_fault.broken, { message: 'Password Lookup Error' });
			}
		}
	}
});

auth_router.post('/sign-up', async (req: IRequest, env: Env, _ctx: ExecutionContext) => {
	let body_parsed_possibility = Schema.SignUpSchema.safeParse(await req.json());

	if (!body_parsed_possibility.success) {
		return error(HTTP_STATUS_CODES.your_fault.dumbass, { message: 'Invalid Request Data' }); // 401
	} else {
		let body: Schema.SignUpRequest = body_parsed_possibility.data;

		let email_check = await env.D1.prepare('SELECT (id) FROM `users` WHERE email = ?1')
			.bind(body.email.toLowerCase())
			.first<{ id: string }>();

		if (email_check !== null) {
			return error(HTTP_STATUS_CODES.your_fault.dumbass, { message: 'Email already taken' });
		} else {
			// the user does not yet exist, create them
			let user_id = generate_ulid();

			let hashed_password = await hash_pass(body.password, env.PRIVATE_KEY)

			let statement = await env.D1.batch([
				env.D1.prepare(
					'INSERT INTO `users` (id, email, given_name, family_name, dob_ts, nhi) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
				).bind(user_id, body.email, body.given_name, body.family_name, body.dob_ts, body.nhi_number),

				env.D1.prepare('INSERT INTO `passwords` (user_id, hash) VALUES (?1, ?2)').bind(user_id, hashed_password),
			]);

			if (statement[0].success && statement[1].success) {
				const current_date = new Date().getTime();
				const ONE_WEEK = 1000 * 60 * 60 * 24 * 7; // 1000 millis * 60 secs * 60 mins * 24 hrs * 7 days

				const token = await JWT.generate_jwt({}, { user_id, iss: current_date, exp: current_date + ONE_WEEK }, env.PRIVATE_KEY);

				return json(
					{
						token,

						id: user_id,

						email: body.email,
						family_name: body.family_name,
						given_name: body.given_name,

						national_health_index: body.nhi_number,
						dob_ts: body.dob_ts,

						qrcode_status: QRCodeStatus.NotEligible,

						issue_count: 0,
						test_count: 0,
						vaccine_status: 0,
					} satisfies IUser & { token: string },
					{ status: HTTP_STATUS_CODES.done.ok },
				);
			}
		}
	}
});

export const auth_middleware = (req: IRequest, env: Env, ctx: ExecutionContext) => auth_router.handle(req, env, ctx);

const auth_check = Router<IRequest, [Env, ExecutionContext]>();

auth_check.all('*', async (req: IRequest, env: Env, ctx: ExecutionContext) => {
	if (!req.headers.has('Authorization')) {
		return error(HTTP_STATUS_CODES.your_fault.liar, { message: 'A Token is Required' }); // 401
	}

	const decoded_jwt = await JWT.decode_and_verify_jwt(req.headers.get('Authorization')!, env.PRIVATE_KEY);

	if (typeof decoded_jwt === 'boolean' && decoded_jwt === false) {
		return error(HTTP_STATUS_CODES.your_fault.liar, { message: 'Invalid Token' }); // 401
	}

	const [_header, payload] = decoded_jwt as [JWT.JWTHeader, JWT.JWTPayload];

	if (payload.exp >= new Date().getTime()) {
		// Token has Expired
		return error(HTTP_STATUS_CODES.your_fault.liar, { message: 'This Token has Expired' }); // 401
	}

	req.user = payload;

	// do not return anything so we can continue with the request handling, this is middleware
});

export const auth_check_middleware = (req: IRequest, env: Env, ctx: ExecutionContext) => auth_check.handle(req, env, ctx);
