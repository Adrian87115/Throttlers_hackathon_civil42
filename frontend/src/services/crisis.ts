import type { AccessToken } from '@/types/ids';
import { AppApiPaths } from '@/types/types';
import apiClient, { type RequestConfig } from './apiClient';

export interface CrisisData {
	id: number;
	title: string;
	description: string;
	severity: 'high' | 'critical';
	started_at: string;
	affected_districts: string[];
	status: 'active' | 'ended';
	created_by: string;
}

export interface CrisisRequest {
	id: number;
	crisis_id: number;
	district_id: string;
	title: string;
	description: string;
	needed_categories: string[];
	priority: 'low' | 'medium' | 'high' | 'critical';
	created_at: string;
}

export interface CrisisResponder {
	id: number;
	user_id: number;
	name: string;
	role: string;
	category: string;
	district: string;
	available: boolean;
	responded_positively: boolean;
}

export async function getActiveCrisis(token: AccessToken): Promise<CrisisData | null> {
	const config: RequestConfig = { token };
	return (await apiClient.get(AppApiPaths.getActiveCrisis(), config)) as CrisisData | null;
}

export async function postStartCrisis(
	token: AccessToken,
	payload: { title: string; description: string; severity: 'high' | 'critical'; affected_districts: string[] }
): Promise<CrisisData> {
	const config: RequestConfig = { token };
	return (await apiClient.post(AppApiPaths.postStartCrisis(), payload, config)) as CrisisData;
}

export async function postEndCrisis(token: AccessToken, crisisId: number): Promise<void> {
	const config: RequestConfig = { token };
	await apiClient.post(AppApiPaths.postEndCrisis(crisisId), {}, config);
}

export async function postCrisisRequest(
	token: AccessToken,
	crisisId: number,
	payload: { district_id: string; title: string; description: string; needed_categories: string[]; priority: 'low' | 'medium' | 'high' | 'critical' }
): Promise<CrisisRequest> {
	const config: RequestConfig = { token };
	return (await apiClient.post(AppApiPaths.postCrisisRequest(crisisId), payload, config)) as CrisisRequest;
}

export async function getCrisisResponders(
	token: AccessToken,
	crisisId: number
): Promise<CrisisResponder[]> {
	const config: RequestConfig = { token };
	return (await apiClient.get(AppApiPaths.getCrisisResponders(crisisId), config)) as CrisisResponder[];
}

export async function postCrisisNotify(token: AccessToken, crisisId: number): Promise<void> {
	const config: RequestConfig = { token };
	await apiClient.post(AppApiPaths.postCrisisNotify(crisisId), {}, config);
}
