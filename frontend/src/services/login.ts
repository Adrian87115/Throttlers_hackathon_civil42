import { LoginResponseData } from '@/types/login';
import { AppApiPaths } from '@/types/types';
import apiClient from './apiClient';

export async function handleUserLogin(
    payload: {
        email: string;
        password: string;
    }
) {
    const res = (await apiClient.post(
        AppApiPaths.postUserLogin(),
        payload
    )) as LoginResponseData;

    return res;
}