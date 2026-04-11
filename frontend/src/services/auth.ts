import type { AccessToken, RefreshToken } from '@/types/ids';
import { AppApiPaths, SuccessOnlyResponse } from '@/types/types';
import apiClient, { type RequestConfig } from './apiClient';

export async function getMyProfile(token: AccessToken): Promise<unknown> {
	const config: RequestConfig = { token };
	return await apiClient.get(AppApiPaths.getMyProfile(), config);
}

export async function postOpenHandsAlert(
	token: AccessToken,
	payload: {
		districts: string[];
		message: string;
		severity: 'high' | 'critical';
	}
): Promise<void> {
	const config: RequestConfig = { token };
	await apiClient.post(AppApiPaths.postOpenHandsAlert(), payload, config);
}

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
