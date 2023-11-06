import { IRequest, Router, json } from 'itty-router';
import { HTTP_STATUS_CODES } from '../interfaces/http';

const auth_router = Router<IRequest, [Env, ExecutionContext]>({ base: '/auth' });

auth_router.post('/login', async (_req: IRequest, _env: Env, _ctx: ExecutionContext) => {
	return json({ status: 'login' }, { status: HTTP_STATUS_CODES.done.ok });
});

auth_router.post('/sign-up', async (_req: IRequest, _env: Env, _ctx: ExecutionContext) => {
	return json({ status: 'login' }, { status: HTTP_STATUS_CODES.done.ok });
});

export const auth_middleware = (req: IRequest, env: Env, ctx: ExecutionContext) => auth_router.handle(req, env, ctx);
