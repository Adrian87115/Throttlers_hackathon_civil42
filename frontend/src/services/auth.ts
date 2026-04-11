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

export interface SafeUserMeResponse {
	id: number;
	username: string;
	email: string;
	role: string;
	account_type?: string | null;
	isAuthenticated: boolean;
	isOwner: boolean;
}

export interface PendingVerificationRequest {
	user_id: number;
	username: string;
	email: string;
	target: 'employer' | 'gov_service';
	verification_status: string;
}

interface VerificationActionResponse {
	detail: string;
	user_id: number;
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

export async function getUserMe(token: AccessToken): Promise<SafeUserMeResponse> {
	const config: RequestConfig = { token };
	return (await apiClient.get(AppApiPaths.getUserMe(), config)) as SafeUserMeResponse;
}

export async function getOwnerPendingVerifications(
	token: AccessToken,
	target: 'all' | 'employer' | 'gov_service' = 'all'
): Promise<PendingVerificationRequest[]> {
	const config: RequestConfig = { token };
	return (await apiClient.get(
		AppApiPaths.getOwnerPendingVerifications(target),
		config
	)) as PendingVerificationRequest[];
}

export async function approveOwnerVerification(
	token: AccessToken,
	userId: number,
	target: 'employer' | 'gov_service'
): Promise<VerificationActionResponse> {
	const config: RequestConfig = { token };
	return (await apiClient.patch(
		AppApiPaths.patchOwnerApproveVerification(userId),
		{ target },
		config
	)) as VerificationActionResponse;
}

export async function rejectOwnerVerification(
	token: AccessToken,
	userId: number,
	target: 'employer' | 'gov_service'
): Promise<VerificationActionResponse> {
	const config: RequestConfig = { token };
	return (await apiClient.patch(
		AppApiPaths.patchOwnerRejectVerification(userId),
		{ target },
		config
	)) as VerificationActionResponse;
}
