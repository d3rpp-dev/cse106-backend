import { QRCodeStatus } from './qrcode';

/**
 * Vaccination Status
 *
 * Do not store, do a lookup
 */
export enum VaccinatonStatus {
	None = 0,
	Partial = 1,
	Full = 2,
}

export interface DBUser {
	/**
	 * these will be randomly generated ULIDs
	 *
	 * if this is instead the string "admin-${ULID}" then it is an admin user
	 */
	id: string;

	/**
	 * Email Address
	 */
	email: string;

	given_name: string;
	family_name: string;
	/**
	 * its a number, but we need to be ready if that changes
	 */
	national_health_index: string;
	/**
	 * stored at UTC timestamp
	 */
	dob_ts: number;
	/**
	 * QR Code Status
	 */
	qrcode_status: QRCodeStatus;
}

/**
 * Base Interface for a User
 */
export interface IUser extends DBUser {
	/**
	 * Do not store this next to user, do a lookup
	 */
	vaccine_status: VaccinatonStatus;
	/**
	 * Do not store this next to user, do a lookup
	 */
	test_count: number;
	/**
	 * Do not store this next to user, do a lookup
	 */
	issue_count: number;
}
