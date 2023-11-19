import { IRequest, error } from 'itty-router';
import { HTTP_STATUS_CODES } from '../../interfaces/http';
import { decode_and_verify_jwt } from '../auth/jwt';
import { IQRCode, QRCodeStatus } from '../../interfaces/qrcode';

export const get_qrcode_image = async (req: IRequest, env: Env, _ctx: ExecutionContext) => {
	const decoded_jwt_maybe = await decode_and_verify_jwt<{}, { qrcode_id: string; exp: number }>(
		decodeURIComponent(req.params.token),
		env.PRIVATE_KEY,
	);

	console.log({
		decoded: decoded_jwt_maybe,
		token: decodeURIComponent(req.params.token),
	});

	if (decoded_jwt_maybe.status == false) {
		return error(HTTP_STATUS_CODES.your_fault.unpriveliged, { message: 'Invalid Token' });
	} else {
		const { payload } = decoded_jwt_maybe;

		if (payload.exp <= new Date().getTime()) {
			// we can interpolate since we have verified trusted input
			const user_id = await env.D1.prepare(`SELECT user_id FROM \`qr_codes\` WHERE image_id = ?1`)
				.bind(payload.qrcode_id)
				.run<IQRCode>();
			await env.R2.delete(payload.qrcode_id);
			await env.D1.prepare(`DELETE FROM \`qr_codes\` WHERE image_id = ?1`).bind(payload.qrcode_id).run();
			await env.D1.prepare(`UPDATE \`users\` SET qrcode_status = ?1 WHERE id = ?2`)
				.bind(QRCodeStatus.NotRequested, user_id.results[0].user_id)
				.run();

			return error(HTTP_STATUS_CODES.your_fault.dumbass, {
				message: 'QR Code is Expired',
			});
		}

		const object = await env.R2.get(payload.qrcode_id);

		if (object === null) {
			return error(HTTP_STATUS_CODES.my_fault.broken, {
				message: 'Could not find QR_Code',
			});
		}

		const headers = new Headers();
		object.writeHttpMetadata(headers);
		headers.set('etag', object.httpEtag);
		headers.set('Content-Type', 'image/png');

		return new Response(object.body, {
			headers,
		});
	}
};
