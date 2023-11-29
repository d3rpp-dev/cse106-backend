import { IRequest, Router, error, json } from 'itty-router';
import { type AddVaccineRequest, AddVaccineSchema } from './schemas';
import { HTTP_STATUS_CODES } from '../../interfaces/http';
import { generate_ulid } from '../../utils/ulid';
import { check_admin } from '../auth/admin_check';

const vaccination_router = Router<IRequest, [Env, ExecutionContext]>({ base: '/api/vaccinations' });

vaccination_router.post('/add', async (req: IRequest, env: Env, _ctx: ExecutionContext) => {
	const admin_check = check_admin(req);
	if (admin_check !== null) return admin_check;

	const body_parse_result = AddVaccineSchema.safeParse(await req.json());

	if (body_parse_result.success) {
		const body_parsed: AddVaccineRequest = body_parse_result.data;

		const vaccine_id = generate_ulid();

		const query_result = await env.D1.prepare('INSERT INTO vaccinations (id, user_id, ts, brand, location) VALUES (?1, ?2, ?3, ?4, ?5)')
			.bind(vaccine_id, body_parsed.user, new Date().getTime() / 1000, body_parsed.brand, body_parsed.location)
			.run();

		if (query_result.success) {
			return json({
				id: vaccine_id,
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

vaccination_router.get('/', async (req: IRequest, env: Env, _ctx: ExecutionContext) => {
	const query_result = await env.D1.prepare('SELECT * FROM vaccinations WHERE user_id = ?1').bind(req.user).run();

	if (query_result.success) {
		return json(query_result.results);
	} else {
		return error(HTTP_STATUS_CODES.my_fault.broken, {
			message: query_result.error,
		});
	}
});

vaccination_router.get('/:id', async (req: IRequest, env: Env, _ctx: ExecutionContext) => {
	const admin_check = check_admin(req);
	if (admin_check !== null) return admin_check;

	const query_result = await env.D1.prepare('SELECT * FROM vaccinations WHERE user_id = ?1').bind(req.params.id).run();

	if (query_result.success) {
		return json(query_result.results);
	} else {
		return error(HTTP_STATUS_CODES.my_fault.broken, {
			message: query_result.error,
		});
	}
});

export const vaccination_middleware = (req: IRequest, env: Env, ctx: ExecutionContext) => vaccination_router.handle(req, env, ctx);
