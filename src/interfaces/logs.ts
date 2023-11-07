export interface ILog {
	/**
	 * ULID
	 */
	id: string;
	/**
	 * event type, this will be a formatted string for admins
	 */
	event: string;
	/**
	 * details on the event to be shown to the admin
	 */
	detail: string;
}
