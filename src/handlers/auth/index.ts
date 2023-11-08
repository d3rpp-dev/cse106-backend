import { IRequest, Router } from 'itty-router';
import { HTTP_STATUS_CODES } from '../../interfaces/http';

import * as JWT from "./jwt";

const auth_router = Router<IRequest, [Env, ExecutionContext]>({ base: '/auth' });

auth_router.post('/login', async (_req: IRequest, _env: Env, _ctx: ExecutionContext) => {

});

auth_router.post('/sign-up', async (req: IRequest, env: Env, _ctx: ExecutionContext) => {
	return await JWT.generate_jwt({}, { user_id: "BRUH", exp: 123213, iss: 213132 }, env.PRIVATE_KEY);
});

export const auth_middleware = (req: IRequest, env: Env, ctx: ExecutionContext) => auth_router.handle(req, env, ctx);

const auth_check = Router<IRequest, [Env, ExecutionContext]>();

auth_check.all("*", async (req: IRequest, env: Env, ctx: ExecutionContext) => {
	if (!req.headers.has("Authorization")) {
		return new Response(null, { status: HTTP_STATUS_CODES.your_fault.dumbass }); // 400
	}

	const decoded_jwt = await JWT.decode_and_verify_jwt(req.headers.get("Authorization")!, env.PRIVATE_KEY);

	if (typeof decoded_jwt === "boolean" && decoded_jwt === false) {
		return new Response(null, { status: HTTP_STATUS_CODES.your_fault.liar }); // 401
	}

	const [_header, payload] = decoded_jwt as [JWT.JWTHeader, JWT.JWTPayload];

	const id_check = await env.D1.prepare("SELECT count(*) FROM `users` WHERE id = ?1").bind(payload.user_id).run();

	console.log(id_check.results[0]);

	if (id_check.results[0]['count(*)'] === 0) {
		// user not found

		return new Response("User Not Found", { status: HTTP_STATUS_CODES.your_fault.blind_ass });
	}

	req.user = payload;
});

export const auth_check_middleware = (req: IRequest, env: Env, ctx: ExecutionContext) => auth_check.handle(req, env, ctx);
