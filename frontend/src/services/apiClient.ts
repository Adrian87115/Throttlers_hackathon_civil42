import type { AccessToken } from '@/types/ids';
import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';

export interface RequestConfig extends AxiosRequestConfig {
	token?: AccessToken;
}

const apiClient = axios.create({
	baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/',
	headers: {
		'Content-Type': 'application/json'
	}
});

apiClient.interceptors.request.use(
	(config) => {
		const requestConfig = config as RequestConfig;
		if (requestConfig.token) {
			config.headers.Authorization = `Bearer ${requestConfig.token}`;
			delete requestConfig.token;
		}
		return config;
	},
	(error) => {
		console.error(error);
		return Promise.reject(error.response?.data);
	}
);

apiClient.interceptors.response.use(
	(response: AxiosResponse) => response.data,
	(error) => {
		console.error(error);
		return Promise.reject(error.response?.data);
	}
);

export default apiClient;
