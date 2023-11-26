import { IRequest, Router, error, json } from "itty-router";
import { check_admin } from "../auth/admin_check";
import { HTTP_STATUS_CODES } from "../../interfaces/http";

const logs_router = Router<IRequest, [Env, ExecutionContext]>({ base: "/api/logs" });

logs_router.get("/", async (req: IRequest, env: Env, _ctx: ExecutionContext) => {
	const admin_check = check_admin(req);
	if (admin_check !== null) return admin_check;

	const response = await env.D1.prepare("SELECT * FROM logs LIMIT 100").all();

	if (response.error) {
		return error(HTTP_STATUS_CODES.my_fault.broken, {
			message: response.error
		});
	}
	else {
		return json({
			count: response.results.length,
			results: response.results
		});
	}
});

export const logs_middleware = (req: IRequest, env: Env, ctx: ExecutionContext) => logs_router.handle(req, env, ctx);
