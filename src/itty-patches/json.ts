import { createResponse } from './create_response';

export const json = createResponse('application/json; charset=utf-8', JSON.stringify);
