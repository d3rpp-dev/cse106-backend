import { IRequest, Router, error, json } from 'itty-router';
import { number, string } from 'zod';

import { HTTP_STATUS_CODES } from '../../interfaces/http';
import { CreateIssueRequest, createIssueSchema } from './schemas';
import { generate_ulid } from '../../utils/ulid';
import { check_admin } from '../auth/admin_check';
import { log_event } from '../../utils/log';

const issues_router = Router<IRequest, [Env, ExecutionContext]>({ base: '/api/issues/' });

//#region Create
issues_router.post('/create', async (req: IRequest, env: Env, _ctx: ExecutionContext) => {
	let body_parsed = createIssueSchema.safeParse(await req.json());

	if (!body_parsed.success) {
		return error(HTTP_STATUS_CODES.your_fault.dumbass, {
			message: body_parsed.error.issues,
		});
	} else {
		let body: CreateIssueRequest = body_parsed.data;

		let issue_id = generate_ulid();

		let query = await env.D1.prepare(
			'INSERT INTO `issues` (id, user_id, subject, description, opened_ts, closed_ts) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
		)
			.bind(issue_id, req.user, body.subject, body.description, new Date().getTime() / 1000, 0)
			.run();

		await log_event(env.D1, "issue_created", `User #${req.user} has created an Issue with ID ${issue_id} and Subject ${body.subject}`);

		if (!query.success) {
			return error(HTTP_STATUS_CODES.my_fault.broken, {
				message: query.error,
			});
		} else {
			return json(
				{
					issue_id,
				},
				{ status: HTTP_STATUS_CODES.done.ok },
			);
		}
	}
});
//#endregion

//#region Read
issues_router.get('/', async (req: IRequest, env: Env, _cts: ExecutionContext) => {
	let { limit, from } = req.query;

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

	let query;

	if (req.user === 'admin') {
		query = env.D1.prepare('SELECT * FROM `issues` WHERE opened_ts >= ?1 ORDER BY opened_ts ASC LIMIT ?2').bind(
			query_params.from_actual,
			query_params.limit_actual,
		);
	} else {
		query = env.D1.prepare('SELECT * FROM `issues` WHERE opened_ts >= ?1 AND user_id = ?2 ORDER BY opened_ts ASC LIMIT ?3').bind(
			query_params.from_actual,
			req.user,
			query_params.limit_actual,
		);
	}

	let query_result = await query.run();

	if (!query_result.success) {
		return error(HTTP_STATUS_CODES.my_fault.broken, { message: query_result.error });
	}

	return json({
		count: query_result.results.length,
		results: query_result.results,
	});
});

issues_router.get('/:id', async (req: IRequest, env: Env, _ctx: ExecutionContext) => {
	let ulid = string().safeParse(req.params.id);

	if (!ulid.success) {
		return error(HTTP_STATUS_CODES.your_fault.dumbass, { message: 'given id is invalid' });
	} else {
		let query = await env.D1.prepare('SELECT * FROM `issues` WHERE id = ?1').bind(ulid.data).run();

		if (!query.success) {
			return error(HTTP_STATUS_CODES.my_fault.broken, { message: query.error });
		} else {
			if (query.results.length === 0) {
				return error(HTTP_STATUS_CODES.your_fault.blind_ass, { message: `Issue with ID ${ulid.data} does not exist` });
			} else {
				return json(query.results[0]);
			}
		}
	}
});
//#endregion

//#region Update
issues_router.put('/:id/close', async (req: IRequest, env: Env, _ctx: ExecutionContext) => {
	let admin_check = check_admin(req);
	if (admin_check) return admin_check;

	let id_parsed = string().safeParse(req.params.id);

	if (!id_parsed.success) {
		return error(HTTP_STATUS_CODES.your_fault.dumbass, { message: 'provided id is invalid' });
	} else {
		let query = await env.D1.prepare('UPDATE `issues` SET closed_ts = ?1 WHERE id = ?2')
			.bind(new Date().getTime() / 1000, id_parsed.data)
			.run();
		if (!query.success) {
			return error(HTTP_STATUS_CODES.my_fault.broken, { message: query.error });
		} else {
			if (query.meta.changes === 0) {
				return error(HTTP_STATUS_CODES.your_fault.blind_ass, { message: `issue with id ${id_parsed.data} does not exist` });
			} else {
				return new Response(null, { status: HTTP_STATUS_CODES.done.empty });
			}
		}
	}
});
//#endregion

//#region Delete
issues_router.delete('/:id', async (req: IRequest, env: Env, _ctx: ExecutionContext) => {
	let admin_check = check_admin(req);
	if (admin_check) return admin_check;

	let id_parsed = string().safeParse(req.params.id);

	if (!id_parsed.success) {
		return error(HTTP_STATUS_CODES.your_fault.dumbass, { message: 'provided id is invalid' });
	} else {
		let query = await env.D1.prepare('DELETE FROM `issues` WHERE id = ?1').bind(id_parsed.data).run();
		if (!query.success) {
			return error(HTTP_STATUS_CODES.my_fault.broken, { message: query.error });
		} else {
			if (query.meta.changes === 0) {
				return error(HTTP_STATUS_CODES.your_fault.blind_ass, { message: `issue with id ${id_parsed.data} does not exist` });
			} else {
				return new Response(null, { status: HTTP_STATUS_CODES.done.empty });
			}
		}
	}
});
//#endregion

export const issues_middleware = (req: IRequest, env: Env, ctx: ExecutionContext) => issues_router.handle(req, env, ctx);
