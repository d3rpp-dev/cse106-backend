import { json, error } from 'itty-router';
import { router, corsify } from './router';

export default {
	// The fetch handler is invoked when this worker receives a HTTP(S) request
	// and should return a Response (optionally wrapped in a Promise)
	fetch: (request: Request, env: Env, ctx: ExecutionContext) => router.handle(request, env, ctx).then(json).catch(error).then(corsify),
};
