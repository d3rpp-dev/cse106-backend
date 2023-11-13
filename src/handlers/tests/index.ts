import { IRequest, Router } from 'itty-router';

const test_router = Router<IRequest, [Env, ExecutionContext]>({ base: '/api/tests' });

export const test_middleware = (req: IRequest, env: Env, ctx: ExecutionContext) => test_router.handle(req, env, ctx);
