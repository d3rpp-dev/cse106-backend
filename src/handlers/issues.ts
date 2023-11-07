import { IRequest, Router } from 'itty-router';

const issues_router = Router<IRequest, [Env, ExecutionContext]>({ base: '/api/issues' });

export const issues_middleware = (req: IRequest, env: Env, ctx: ExecutionContext) => issues_router.handle(req, env, ctx);
