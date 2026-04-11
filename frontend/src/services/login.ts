import { AccessToken } from '@/types/ids';
import { LoginResponseData } from '@/types/login';
import { AppApiPaths } from '@/types/types';
import apiClient, { RequestConfig } from './apiClient';

export async function handleUserLogin(
	token: AccessToken,
	payload: {
		email: string;
		password: string;
	}
) {
	const config: RequestConfig = {
		token
	};

	const res = (await apiClient.post(
		AppApiPaths.postUserLogin(),
		payload,
		config
	)) as LoginResponseData;

	return res;
}
