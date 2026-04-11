import { postRefreshToken } from '@/services/auth';
import type { AccessToken, RefreshToken } from '@/types/ids';
import { AccessTokenPayload, AppUser } from '@/types/user';
import { WSGlobalResponse, WSSharedEventName } from '@/types/websocket';
import { Helpers } from '@/utils/helpers';
import { jwtDecode } from 'jwt-decode';
import {
	createContext,
	useContext,
	useEffect,
	useState,
	type Dispatch,
	type SetStateAction
} from 'react';
import { Socket } from 'socket.io-client';

export interface AuthState {
	accessToken: AccessToken | null;
	refreshToken: RefreshToken | null;
	expiresIn: number | null;
	user: AppUser | null;
	isLoading: boolean;
	hasExpired: boolean;
}

const initialAuthState: AuthState = {
	accessToken: null,
	refreshToken: null,
	expiresIn: null,
	user: null,
	isLoading: true,
	hasExpired: false
};

export interface AuthContextValue {
	auth: AuthState;
	setAuth: Dispatch<SetStateAction<AuthState>>;
	resetAuth: () => void;
	setAuthTokens: (accessToken: AccessToken, refreshToken: RefreshToken) => void;
	getAccessToken: () => Promise<AccessToken>;
	getUser: () => AppUser | null;
	issueNewTokens: () => Promise<void>;
}

/** in seconds */
const REFRESH_TOKEN_TIME_BUFFER = 120;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type Props = {
	children: React.ReactNode;
};

function decodeUserFromToken(token?: AccessToken): {
	user: AppUser;
	exp: number;
} | null {
	if (!token) return null;

	const decoded: AccessTokenPayload = jwtDecode(token);

	return {
		user: {
			id: decoded.sub,
			email: decoded.email,
			nickname: decoded.nickname
		},
		exp: decoded.exp
	};
}

export default function AuthUserContext({ children }: Props) {
	const [auth, setAuth] = useState<AuthState>(initialAuthState);

	async function refreshAccessToken(): Promise<{
		refreshToken: RefreshToken;
		accessToken: AccessToken;
	}> {
		if (!auth.refreshToken) {
			throw new Error('refresh token not found');
		}

		const res = await postRefreshToken(auth.refreshToken);

		return res;
	}

	// also handles ws token update
	async function getAccessToken(): Promise<AccessToken> {
		if (!auth.accessToken || !auth.refreshToken) {
			throw new Error('Access token not found');
		}

		try {
			if (isAccessTokenExpiring()) {
				console.log('issuing refresh');
				const { accessToken, refreshToken } = await refreshAccessToken();

				await refreshSocketToken(accessToken);
				await setAuthTokens(accessToken, refreshToken);

				console.log('new tokens received');
				return accessToken;
			} else {
				return auth.accessToken;
			}
		} catch (err: any) {
			setAuth({
				...auth,
				hasExpired: true
			});

			throw new Error('failed to refresh access token:', err);
		}
	}

	function isAccessTokenExpiring(): boolean {
		if (!auth.expiresIn) return true;

		return (
			auth.expiresIn <=
			Helpers.getCurrentTimeInSeconds() + REFRESH_TOKEN_TIME_BUFFER
		);
	}

	function resetAuth() {
		setAuth({ ...initialAuthState, isLoading: false });

		localStorage.removeItem('refreshToken');
		localStorage.removeItem('accessToken');
	}

	function getUser() {
		return auth.user;
	}

	async function setAuthTokens(
		accessToken: AccessToken,
		refreshToken: RefreshToken
	) {
		const userTokenData = decodeUserFromToken(accessToken);
		if (!userTokenData?.user)
			throw new Error('unable to set auth, invalid access token');

		// it needs to be here to properly initialize WS clients
		setWebsocketToken(accessToken);

		setAuth({
			user: userTokenData.user,
			accessToken: accessToken,
			refreshToken: refreshToken,
			expiresIn: userTokenData.exp,
			isLoading: false,
			hasExpired: false
		});

		localStorage.setItem('refreshToken', refreshToken);
		localStorage.setItem('accessToken', accessToken);
	}

	function setAllWebsocketAuthTokens(clients: Socket[], newToken: string) {
		for (const client of clients) {
			client.auth = {
				...client.auth,
				token: newToken
			};
		}
	}

	function setWebsocketToken(newToken: string) {
		//! IMPORTANT: make sure all WS clients are included here
		setAllWebsocketAuthTokens([], newToken);
	}

	async function refreshWebsocketToken(
		WSClient: Socket,
		newToken: string
	): Promise<void> {
		// we do not care about the user refresh as it will be done automatically
		// on connect, thus if here is not connected we do nothing
		if (!WSClient.connected) {
			console.log('Websocket not connected, skipping token refresh');
			return;
		}

		return await new Promise((resolve, reject) => {
			WSClient.emit(
				WSSharedEventName.update_token,
				newToken,
				(data: WSGlobalResponse<{ code: number }>) => {
					if (data.data?.code !== 200) {
						reject(new Error('Websocket token update failed: Unauthorized'));
						return;
					}
					console.log('refreshed WS token successfully');
					resolve();
				}
			);
		});
	}

	async function refreshAllSockets(clients: Socket[], newToken: string) {
		for (const client of clients) {
			await refreshWebsocketToken(client, newToken);
		}
	}

	async function refreshSocketToken(newToken: string) {
		//! IMPORTANT: make sure all WS clients are included here
		setWebsocketToken(newToken);
		await refreshAllSockets([], newToken);
	}

	async function issueNewTokens() {
		const { accessToken, refreshToken } = await refreshAccessToken();
		await refreshSocketToken(accessToken);

		setAuthTokens(accessToken, refreshToken);
	}

	useEffect(() => {
		const accessToken = localStorage.getItem('accessToken') as AccessToken;
		const refreshToken = localStorage.getItem('refreshToken') as RefreshToken;
		const tokenData = decodeUserFromToken(accessToken);

		setAuth({
			accessToken,
			refreshToken,
			user: tokenData?.user ?? null,
			expiresIn: tokenData?.exp ?? null,
			isLoading: false,
			hasExpired: false
		});
	}, []);

	useEffect(() => {
		if (
			auth.refreshToken !== initialAuthState.refreshToken &&
			auth.refreshToken !== null
		) {
			localStorage.setItem('refreshToken', auth.refreshToken);
		}
	}, [auth.refreshToken]);

	useEffect(() => {
		if (
			auth.accessToken !== initialAuthState.accessToken &&
			auth.accessToken !== null
		) {
			localStorage.setItem('accessToken', auth.accessToken);
		}
	}, [auth.accessToken]);

	return (
		<AuthContext.Provider
			value={{
				auth,
				setAuth,
				setAuthTokens,
				resetAuth,
				getAccessToken,
				getUser,
				issueNewTokens
			}}>
			{children}
		</AuthContext.Provider>
	);
}

export const useAuth = (): AuthContextValue => {
	const context = useContext(AuthContext);
	if (!context) throw new Error('useAuth must be used within an AuthProvider');

	return context;
};
