import { Router } from 'itty-router';
import { createCors, withParams } from './itty-patches';
import { auth_middleware } from './handlers/auth';

const { corsify, preflight } = createCors();
const router = Router();

router
	// Security / CORS
	.all('*', preflight, withParams)
	// Auth Router Middleware
	.all('/auth/*', auth_middleware)
	// redirect to my homepage from the base url
	.all(
		'/',
		() =>
			new Response(null, {
				status: 303,
				headers: {
					Location: 'https://d3rpp.dev',
				},
			}),
	)
	// Catch-all with a 404
	.all('*', () => new Response('Not Found.', { status: 404 }));

export { router, corsify };
