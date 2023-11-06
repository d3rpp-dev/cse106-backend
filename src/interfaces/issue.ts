export interface IIssue {
	/**
	 * ULID
	 */
	id: string;
	/**
	 * At the top
	 */
	subject: string;
	/**
	 * Description of issue
	 */
	description: string;
	/**
	 * resolution status
	 */
	is_resolved: boolean;
	/**
	 * Open date UTC timestamp
	 */
	opened_ts: number;
	/**
	 * Closed date UTC timestamp optional
	 *
	 * if this is `0`, this means the issue is not closed
	 */
	closed_ts: number;
}
