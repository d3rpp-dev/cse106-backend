import { IRequest, error, withParams } from 'itty-router';
import { auth_middleware } from './handlers/auth';
import { auth_check } from './handlers/auth/auth_check';
import { HTTP_STATUS_CODES } from './interfaces/http';
import { issues_middleware } from './handlers/issues';
import { qrcode_middleware } from './handlers/qr-code';
import { decode_and_verify_jwt } from './handlers/auth/jwt';
import { router } from './router';

router
	// Security / CORS
	.all('*', preflight, withParams)
	// Auth Router Middleware
	.all('/auth/*', auth_middleware)
	// They can't add auth in the request to get the image, so we will put it in the URL
	.get('/api/qrcodes/:qr_token', async (req: IRequest, env: Env, _ctx) => {
		const decoded_jwt_maybe = await decode_and_verify_jwt<{}, { qrcode_id: string }>(req.params.qr_token, env.PRIVATE_KEY);

		if (typeof decode_and_verify_jwt === 'boolean' && decode_and_verify_jwt === false) {
			return error(HTTP_STATUS_CODES.your_fault.unpriveliged, { message: 'Invalid Token' });
		} else {
			// @ts-ignore
			const [_header, payload] = decoded_jwt_maybe as [{}, { qrcode_id: string }];

			const object = await env.R2.get(payload.qrcode_id);

			if (object === null) {
				return error(HTTP_STATUS_CODES.your_fault.dumbass, {
					message: 'Invalid Token',
				});
			}

			const headers = new Headers();
			object.writeHttpMetadata(headers);
			headers.set('etag', object.httpEtag);

			return new Response(object.body, {
				headers,
			});
		}
	})
	// Coffee
	.all(
		'/coffee',
		() =>
			new Response(null, {
				status: HTTP_STATUS_CODES.your_fault.im_a_teapot,
			}),
	)
	// auth checker, before it can get to the apis it needs to be authenticated
	//
	// these are checked in order, and any request that are caught before this handler will be public
	// any after will require authorisation
	.all('/api/*', auth_check)
	.all('/api/issues/*', issues_middleware)
	.all('/api/qrcodes/*', qrcode_middleware)
	// Catch-all with a 404
	.all('*', () => error(HTTP_STATUS_CODES.your_fault.blind_ass));
