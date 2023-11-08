import { IRequest, Router, createCors, error, withParams } from 'itty-router';
import { auth_check_middleware, auth_middleware } from './handlers/auth';
import { HTTP_STATUS_CODES } from './interfaces/http';
import { issues_middleware } from './handlers/issues';

const { corsify, preflight } = createCors();

const router = Router<IRequest, [Env, ExecutionContext]>();

router
	// Security / CORS
	.all('*', preflight, withParams)
	// Auth Router Middleware
	.all('/auth/*', auth_middleware)
	.all(
		'/coffee',
		() =>
			new Response(null, {
				status: HTTP_STATUS_CODES.your_fault.im_a_teapot,
			}),
	)
	// auth checker, before it can get to the apis it needs to be authenticated
	.all('/api/*', auth_check_middleware)
	.all('/api/issues', issues_middleware)
	// Catch-all with a 404
	.all('*', () => error(HTTP_STATUS_CODES.your_fault.blind_ass));

export { router, corsify };
