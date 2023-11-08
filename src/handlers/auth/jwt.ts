export interface JWTHeader {}

export interface JWTPayload {
	user_id: string;
	/**
	 * issued date
	 */
	iss: number;
	/**
	 * expiry date
	 */
	exp: number;
}

const hash_jwt = async (header: string, payload: string, key: string): Promise<[string, string, string]> => {
	const header_and_payload = new TextEncoder().encode(`${header}.${payload}${key}`);

	const hash_array_buffer = await crypto.subtle.digest({ name: 'SHA-256' }, header_and_payload);
	const hash = btoa(hash_array_buffer.toString());

	return [header, payload, hash];
};

export const generate_jwt = async (header: JWTHeader, payload: JWTPayload, key: string): Promise<string> => {
	const [header_b64, payload_b64, hash] = await hash_jwt(btoa(JSON.stringify(header)), btoa(JSON.stringify(payload)), key);

	return `${header_b64}.${payload_b64}.${hash}`;
};

export const decode_and_verify_jwt = async (jwt: string, key: string): Promise<boolean | [JWTHeader, JWTPayload]> => {
	const split = jwt.split('.');
	if (split.length !== 3) return false;

	const [header, payload, claimed_hash] = split;

	const [_header, _payload, actual_hash] = await hash_jwt(header, payload, key);

	if (actual_hash === claimed_hash) {
		return [JSON.parse(atob(header)), JSON.parse(atob(payload))];
	} else {
		return false;
	}
};
