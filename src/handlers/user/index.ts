import { IRequest, Router } from 'itty-router';

const user_router = Router<IRequest, [Env, ExecutionContext]>({ base: '/api/user' });

export const user_middleware = (req: IRequest, env: Env, ctx: ExecutionContext) => user_router.handle(req, env, ctx);
