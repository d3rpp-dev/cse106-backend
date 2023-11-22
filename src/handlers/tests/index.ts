import { IRequest, Router, error, json } from 'itty-router';
import { check_admin } from '../auth/admin_check';
import { HTTP_STATUS_CODES } from '../../interfaces/http';
import { AddTestRequest, AddTestSchema } from './schemas';
import { generate_ulid } from '../../utils/ulid';
import { log_event } from '../../utils/log';

const test_router = Router<IRequest, [Env, ExecutionContext]>({ base: '/api/tests' });

test_router.post('/add', async (req: IRequest, env: Env, _ctx: ExecutionContext) => {
	const body_parse_result = AddTestSchema.safeParse(await req.json());

	if (body_parse_result.success) {
		const body_parsed: AddTestRequest = body_parse_result.data;

		const test_id = generate_ulid();

		const query_result = await env.D1.prepare('INSERT INTO tests (id, user_id, ts, result, type) VALUES (?1, ?2, ?3, ?4, ?5)')
			.bind(test_id, req.user, new Date().getTime(), body_parsed.result, body_parsed.type)
			.run();

		await log_event(env.D1, "test_uploaded", `User #${req.user} has uploaded a ${body_parsed.type} Test, with a result of ${body_parsed.result === 0 ? "Negative" : "Positive"}`);

		if (query_result.success) {
			return json({
				id: test_id,
			});
		} else {
			return error(HTTP_STATUS_CODES.my_fault.broken, {
				message: query_result.error,
			});
		}
	} else {
		return error(HTTP_STATUS_CODES.your_fault.dumbass, { message: body_parse_result.error.toString() });
	}
});

test_router.get('/', async (req: IRequest, env: Env, _ctx: ExecutionContext) => {
	const query_result = await env.D1.prepare('SELECT * FROM tests WHERE user_id = ?1').bind(req.user).run();

	if (query_result.success) {
		return json(query_result.results);
	} else {
		return error(HTTP_STATUS_CODES.my_fault.broken, {
			message: query_result.error,
		});
	}
});

test_router.get('/:id', async (req: IRequest, env: Env, _ctx: ExecutionContext) => {
	const admin_check = check_admin(req);
	if (admin_check !== null) return admin_check;

	const query_result = await env.D1.prepare('SELECT * FROM tests WHERE user_id = ?1').bind(req.params.id).run();

	if (query_result.success) {
		return json(query_result.results);
	} else {
		return error(HTTP_STATUS_CODES.my_fault.broken, {
			message: query_result.error,
		});
	}
});

export const test_middleware = (req: IRequest, env: Env, ctx: ExecutionContext) => test_router.handle(req, env, ctx);
