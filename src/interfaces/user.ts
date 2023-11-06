export enum AccountType {
	End,
	Admin
}

export interface IUser {
	id: string
	account_type: AccountType,
}

export interface IEndUser extends IUser {
	given_name: string,
	family_name: string
}
