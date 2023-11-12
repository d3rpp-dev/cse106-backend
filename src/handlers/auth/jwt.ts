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

const arrayBufferToBase64 = ( buffer: ArrayBuffer ) => {
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return btoa( binary );
}

const hash_jwt = async (header: string, payload: string, key: string): Promise<[string, string, string]> => {
	const header_and_payload = new TextEncoder().encode(`${header}.${payload}${key}`);

	const hash_array_buffer = await crypto.subtle.digest({ name: 'SHA-256' }, header_and_payload);
	const hash = arrayBufferToBase64(hash_array_buffer);

	return [header, payload, hash];
};

export const generate_jwt = async <Header = JWTHeader, Payload = JWTPayload>(
	header: Header,
	payload: Payload,
	key: string,
): Promise<string> => {
	const [header_b64, payload_b64, hash] = await hash_jwt(btoa(JSON.stringify(header)), btoa(JSON.stringify(payload)), key);

	return `${header_b64}.${payload_b64}.${hash}`;
};

export const decode_and_verify_jwt = async <Header = JWTHeader, Payload = JWTPayload>(
	jwt: string,
	key: string,
): Promise<{status: false} | {status: true, header: Header, payload: Payload}> => {
	const split = jwt.split('.');
	if (split.length !== 3) return {status: false};

	const [header, payload, claimed_hash] = split;

	const [_header, _payload, actual_hash] = await hash_jwt(header, payload, key);

	if (actual_hash === claimed_hash) {
		return {status: true, header: JSON.parse(atob(header)), payload: JSON.parse(atob(payload))};
	} else {
		return {status: false};
	}
};
