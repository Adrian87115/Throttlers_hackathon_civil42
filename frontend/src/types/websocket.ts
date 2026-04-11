export enum WSSharedEventName {
	ws_auth_error = 'ws_auth_error',
	update_token = 'update_token'
}

export interface WSGlobalResponse<T = any> {
	message: string;
	data?: T;
}

export class WSGlobalSingleTargetEmit<T = any> {
	emittingUserId: string;
	receivingUserId: string;
	data?: any;

	constructor(emitterId: string, receiverId: string, data?: T) {
		this.emittingUserId = emitterId;
		this.receivingUserId = receiverId;
		this.data = data;
	}
}
