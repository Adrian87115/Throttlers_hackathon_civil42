import apiClient, { type RequestConfig } from './apiClient';
import type { AccessToken } from '@/types/ids';
import { AppApiPaths } from '@/types/types';

export interface WorkerProfile {
	user_id: number;
	username: string;
	bio?: string;
	experience_summary?: string;
	wants_paid: boolean;
	wants_volunteer: boolean;
	city?: string;
	region?: string;
	public_latitude?: number;
	public_longitude?: number;
	exact_latitude?: number;
	exact_longitude?: number;
	contact_visibility?: string;
	is_available?: boolean;
	skills: Array<{ id: number; name: string }>;
}

export interface SearchWorkersParams {
	skill_ids?: number[];
	wants_paid?: boolean;
	wants_volunteer?: boolean;
	city?: string;
	region?: string;
	min_lat?: number;
	max_lat?: number;
	min_lng?: number;
	max_lng?: number;
}

export async function searchWorkers(
	params: SearchWorkersParams,
	token?: AccessToken
): Promise<WorkerProfile[]> {
	const queryParams = new URLSearchParams();

	if (params.skill_ids?.length) {
		params.skill_ids.forEach(id => queryParams.append('skill_ids', id.toString()));
	}
	if (params.wants_paid !== undefined) {
		queryParams.append('wants_paid', params.wants_paid.toString());
	}
	if (params.wants_volunteer !== undefined) {
		queryParams.append('wants_volunteer', params.wants_volunteer.toString());
	}
	if (params.city) {
		queryParams.append('city', params.city);
	}
	if (params.region) {
		queryParams.append('region', params.region);
	}
	if (params.min_lat !== undefined) {
		queryParams.append('min_lat', params.min_lat.toString());
	}
	if (params.max_lat !== undefined) {
		queryParams.append('max_lat', params.max_lat.toString());
	}
	if (params.min_lng !== undefined) {
		queryParams.append('min_lng', params.min_lng.toString());
	}
	if (params.max_lng !== undefined) {
		queryParams.append('max_lng', params.max_lng.toString());
	}

	const url = `marketplace/workers/search?${queryParams.toString()}`;
	const config: RequestConfig = {};

	if (token) {
		config.token = token;
	}

	return (await apiClient.get(url, config)) as WorkerProfile[];
}

export async function searchVolunteers(
	token?: AccessToken
): Promise<WorkerProfile[]> {
	return searchWorkers({ wants_volunteer: true }, token);
}
