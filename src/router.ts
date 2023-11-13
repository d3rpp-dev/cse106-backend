import { IRequest, Router, createCors, error, withParams } from 'itty-router';

import { auth_check } from './handlers/auth/auth_check';

import { HTTP_STATUS_CODES } from './interfaces/http';

import { issues_middleware } from './handlers/issues';
import { qrcode_middleware } from './handlers/qr-code';
import { get_qrcode_image } from './handlers/qr-code/get_image';
import { user_middleware } from './handlers/user';
import { auth_middleware } from './handlers/auth';
import { vaccination_middleware } from './handlers/vaccinations';
import { test_middleware } from './handlers/tests';

const { corsify, preflight } = createCors({
	methods: ["GET", "POST", "PUT", "DELETE"],
});

const router = Router<IRequest, [Env, ExecutionContext]>();

router
	// Security / CORS
	.all('*', preflight, withParams)
	// Auth Router Middleware
	.all('/auth/*', auth_middleware)
	// They can't add auth in the request to get the image, so we will put it in the URL
	.get('/api/qrcodes/get_image/:token', get_qrcode_image)
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
	.all('/api/user/*', user_middleware)
	.all('/api/vaccinations/*', vaccination_middleware)
	.all('/api/tests/*', test_middleware)
	// Catch-all with a 404
	.all('*', () => error(HTTP_STATUS_CODES.your_fault.blind_ass, { message: 'Catch-all 404 Reached' }));

export { router, corsify };
