export enum QRCodeStatus {
	NotEligible = 0,
	NotRequested = 1,
	Requested = 2,
	Approved = 3,
}

export interface IQRCode {
	id: string;
	user_id: string;
	expiry: number;
	image_id: string;
	token: string;
}
