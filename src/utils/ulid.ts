import { factory } from "ulid";

const ULID = factory(() => {
	const buffer = new Uint32Array(1);
	crypto.getRandomValues(buffer);
	return buffer[0];
});

export const generate_ulid = () => {
	return ULID()
}
