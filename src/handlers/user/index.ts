import { IRequest, Router, error, json } from 'itty-router';
import { check_admin } from '../auth/admin_check';
import { IUser } from '../../interfaces/user';
import { HTTP_STATUS_CODES } from '../../interfaces/http';
import { number } from 'zod';

const user_router = Router<IRequest, [Env, ExecutionContext]>({ base: '/api/users' });

// get own
user_router.get('/profile', async (req: IRequest, env: Env, _ctx: ExecutionContext) => {
	const query_result = await env.D1.prepare(
		`SELECT users.*, COUNT(vaccinations.id) AS vaccine_count, COUNT(tests.id) AS test_count, COUNT(issues.id) AS issue_count FROM users LEFT JOIN vaccinations ON users.id = vaccinations.user_id LEFT JOIN issues ON users.id = issues.user_id LEFT JOIN tests ON users.id = tests.user_id WHERE users.id = ?1`,
	)
		.bind(req.user)
		.first();

	if (query_result === null) {
		return error(HTTP_STATUS_CODES.your_fault.blind_ass, { message: 'User not found' });
	}

	return json({
		id: query_result.id as string,
		email: query_result.email as string,
		given_name: query_result.given_name as string,
		family_name: query_result.family_name as string,
		national_health_index: query_result.nhi as string,
		dob_ts: query_result.dob_ts as number,
		qrcode_status: (query_result.qrcode_status as number) ?? 0,
		vaccine_status: query_result.vaccine_count as number,
		test_count: query_result.test_count as number,
		issue_count: query_result.issue_count as number,
	} satisfies IUser);
});

// get user as admin
user_router.get('/profile/:id', async (req: IRequest, env: Env, _ctx: ExecutionContext) => {
	const admin_check = check_admin(req);
	if (admin_check !== null) return admin_check;

	const query_result = await env.D1.prepare(
		`SELECT users.*, COUNT(vaccinations.id) AS vaccine_count, COUNT(tests.id) AS test_count, COUNT(issues.id) AS issue_count FROM users LEFT JOIN vaccinations ON users.id = vaccinations.user_id LEFT JOIN issues ON users.id = issues.user_id LEFT JOIN tests ON users.id = tests.user_id WHERE users.id = ?1`,
	)
		.bind(req.params.id)
		.first();

	if (query_result === null) {
		return error(HTTP_STATUS_CODES.your_fault.blind_ass, { message: 'User not found' });
	}

	return json({
		id: query_result.id as string,
		email: query_result.email as string,
		given_name: query_result.given_name as string,
		family_name: query_result.family_name as string,
		national_health_index: query_result.nhi as string,
		dob_ts: query_result.dob_ts as number,
		qrcode_status: (query_result.qrcode_status as number) ?? 0,
		vaccine_status: query_result.vaccine_count as number,
		test_count: query_result.test_count as number,
		issue_count: query_result.issue_count as number,
	} satisfies IUser);
});

user_router.get('/list', async (req: IRequest, env: Env, _ctx: ExecutionContext) => {
	let { search, limit, from } = req.query;

	let query_params = {
		limit_actual: 10,
		from_actual: 0,
	};

	let l = number().gt(0).lte(100).safeParse(limit);
	if (l.success) {
		query_params.limit_actual = l.data;
	}

	let f = number().gt(0).lte(new Date().getTime() / 1000).safeParse(from);
	if (f.success) {
		query_params.from_actual = f.data;
	}

	let query_result = await env.D1.prepare(
		'SELECT * FROM `users` WHERE dob_ts >= ?1 AND given_name LIKE ?2 OR family_name LIKE ?2 ORDER BY dob_ts ASC LIMIT ?3',
	)
		.bind(query_params.from_actual, `%${search ?? ''}%`, query_params.limit_actual)
		.run();

	if (!query_result.success) {
		return error(HTTP_STATUS_CODES.my_fault.broken, { message: query_result.error });
	}

	return json({
		count: query_result.results.length,
		results: query_result.results,
	});
});

export const user_middleware = (req: IRequest, env: Env, ctx: ExecutionContext) => user_router.handle(req, env, ctx);
