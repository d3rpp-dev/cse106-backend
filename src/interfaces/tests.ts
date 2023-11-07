export interface ITest {
	/**
	 * ULID
	 */
	id: string;
	/**
	 * date of test report, set by user
	 */
	ts: number;
	/**
	 * test result
	 *
	 * - `true` = Positive
	 * - `false` = Negative
	 */
	result: boolean;
	/**
	 * Type of test, e.g. RAT, PCR
	 */
	type: string;
}
