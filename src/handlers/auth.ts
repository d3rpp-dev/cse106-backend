import { IRequest, Router } from 'itty-router';
import { json } from '../itty-patches';
import { HTTP_STATUS_CODES } from '../interfaces/http';

const auth_router = Router({ base: '/auth' });

auth_router.post('/login', async (_req: IRequest, env: Env, _ctx: ExecutionContext) => {
	return json({ status: 'login' }, { status: HTTP_STATUS_CODES.done.ok });
});

auth_router.post('/sign-up', async (_req: IRequest, env: Env, _ctx: ExecutionContext) => {
	return json({ status: 'login' }, { status: HTTP_STATUS_CODES.done.ok });
});

export const auth_middleware = (req: IRequest, ...rest: any) => auth_router.handle(req, ...rest);
