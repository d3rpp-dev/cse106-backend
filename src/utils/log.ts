import { type D1Database } from"@cloudflare/workers-types"
import { generate_ulid } from "./ulid";

export const log_event = async (db: D1Database, event: string, detail: string): Promise<string> => {
	const id = generate_ulid();

	await db
		.prepare("INSERT INTO logs (id, event, detail) VALUES (?1, ?2, ?3)")
		.bind(id, event, detail)
		.run();

	return id;
};
