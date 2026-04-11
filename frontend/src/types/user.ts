export type AppUser = {
	id: string;
	email: string;
	nickname: string; // other fields here
};

export interface AccessTokenPayload {
	sub: string;
	email: string;
	nickname: string;
	exp: number; // and other fields
}
