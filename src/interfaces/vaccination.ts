export interface IVaccination {
	/**
	 * ULID for the primary key
	 */
	id: string,
	/**
	 * the user who was given the vaccination
	 */
	user_id: string,
	/**
	 * Timestamp of vaccination status
	 */
	ts: string,
	/**
	 * Brand of vaccination (e.g. Pfizer)
	 */
	brand: string,
	/**
	 * Vaccination Center Location
	 */
	location: string
}
