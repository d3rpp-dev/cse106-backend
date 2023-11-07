export enum QRCodeStatus {
	NotEligible = 0,
	NotRequested = 1,
	Requested = 2,
	Approved = 3,
}

export interface IQRCode {
	/**
	 * URL to an image that will be displayed as the QR Code
	 */
	image_link: string;
	/**
	 * Expiry date, this will be also in the QR Code itself
	 */
	expiry_ts: number;
}
