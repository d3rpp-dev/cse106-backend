import { IRequest, Router } from 'itty-router';
import { check_admin } from '../auth/admin_check';

const user_router = Router<IRequest, [Env, ExecutionContext]>({ base: '/api/user' });

// get own
user_router.get("/profile", (req: IRequest, env: Env, _ctx: ExecutionContext) => {
	req.user;
});

// get user as admin
user_router.get("/profile/:id", (req: IRequest, env: Env, _ctx: ExecutionContext) => {
	const admin_check = check_admin(req);
	if (admin_check !== null) return admin_check;
});

export const user_middleware = (req: IRequest, env: Env, ctx: ExecutionContext) => user_router.handle(req, env, ctx);
