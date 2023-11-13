import { IRequest, Router } from 'itty-router';

const vaccination_router = Router<IRequest, [Env, ExecutionContext]>({ base: '/api/vaccinations' });

export const vaccination_middleware = (req: IRequest, env: Env, ctx: ExecutionContext) => vaccination_router.handle(req, env, ctx);
