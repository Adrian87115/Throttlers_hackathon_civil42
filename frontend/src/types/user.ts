export type AccountType = 'worker' | 'employer';

export type AppUser = {
	id: string;
	email: string;
	nickname: string;
	accountType?: AccountType;
};

export interface AccessTokenPayload {
	sub: string;
	email: string;
	nickname: string;
	account_type?: AccountType;
	exp: number;
}
