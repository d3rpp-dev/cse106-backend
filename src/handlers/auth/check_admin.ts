import { IRequest, error } from 'itty-router';
import { HTTP_STATUS_CODES } from '../../interfaces/http';

export const check_admin = (req: IRequest): Response | null => {
	return req.user === 'admin' ? null : error(HTTP_STATUS_CODES.your_fault.unpriveliged, { message: 'This is an admin-only resource' });
};
