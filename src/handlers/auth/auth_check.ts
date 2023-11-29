import { IRequest, error } from 'itty-router';
import { HTTP_STATUS_CODES } from '../../interfaces/http';

import * as JWT from './jwt';

export const auth_check = async (req: IRequest, env: Env, ctx: ExecutionContext) => {
	if (!req.headers.has('Authorization')) {
		return error(HTTP_STATUS_CODES.your_fault.dumbass, { message: 'A Token is Required' }); // 400
	}

	let token = req.headers.get('Authorization')!;

	if (token.startsWith('Bearer')) {
		token = token.split(' ')[1];
	}

	const decoded_jwt = await JWT.decode_and_verify_jwt(token, env.PRIVATE_KEY);

	if (decoded_jwt.status === false) {
		return error(HTTP_STATUS_CODES.your_fault.liar, { message: 'Invalid Token' }); // 401
	}

	const { payload } = decoded_jwt;

	if (payload.exp <= new Date().getTime() / 1000) {
		// Token has Expired
		return error(HTTP_STATUS_CODES.your_fault.liar, { message: 'This Token has Expired' }); // 401
	}

	req.user = payload.user_id;
	req.token = req.headers.get('Authorization')!;

	// do not return anything so we can continue with the request handling, this is middleware
};
