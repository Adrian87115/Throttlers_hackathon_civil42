import type { AccessToken, RefreshToken } from '@/types/ids';
import { AppApiPaths, SuccessOnlyResponse } from '@/types/types';
import apiClient, { type RequestConfig } from './apiClient';

interface PostRefreshTokenResponse {
	accessToken: AccessToken;
	refreshToken: RefreshToken;
}

export async function postRefreshToken(refreshToken: RefreshToken): Promise<{
	accessToken: AccessToken;
	refreshToken: RefreshToken;
}> {
	const res = (await apiClient.post(AppApiPaths.postAppRefreshToken(), {
		refreshToken
	})) as PostRefreshTokenResponse;

	return res;
}

export async function deleteMyAccount(token: AccessToken) {
	const config: RequestConfig = {
		token
	};

	const res = (await apiClient.delete(
		AppApiPaths.deleteUser(),
		config
	)) as SuccessOnlyResponse;

	return res;
}
