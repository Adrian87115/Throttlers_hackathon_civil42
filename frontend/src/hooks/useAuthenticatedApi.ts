import { useAuth } from '@/contexts/AuthUserContext';
import type { AccessToken } from '@/types/ids';
import { WSGlobalSingleTargetEmit } from '@/types/websocket';
import { useCallback } from 'react';
import { Socket } from 'socket.io-client';

export const useAuthenticatedApi = () => {
	const { getAccessToken } = useAuth();

	const callWithToken = useCallback(
		async <T extends any[], R>(
			apiFunction: (token: AccessToken, ...args: T) => Promise<R>,
			...args: T
		): Promise<R> => {
			const token = await getAccessToken();
			return apiFunction(token, ...args);
		},
		[getAccessToken]
	);

	const emitWithToken = useCallback(
		async (
			WSClient: Socket,
			event: string,
			payload: WSGlobalSingleTargetEmit
		) => {
			await getAccessToken(); // to ensure we have a valid token set

			WSClient.emit(event, payload);
		},
		[getAccessToken]
	);

	const websocketConnectWithToken = useCallback(
		async (WSClient: Socket) => {
			console.log('Connecting websocket with token...');
			await getAccessToken(); // to ensure we have a valid token set

			console.log('Websocket token set, connecting...');
			WSClient.connect();
		},
		[getAccessToken]
	);

	return { callWithToken, emitWithToken, websocketConnectWithToken };
};
