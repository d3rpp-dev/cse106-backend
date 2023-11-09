import { encode } from 'base64-arraybuffer';

export const hash_pass = async (pass: string, key: string): Promise<string> => {
	const te = new TextEncoder().encode(`${pass}${key}`);

	const hash = await crypto.subtle.digest('SHA-256', te);

	return encode(hash);
};
