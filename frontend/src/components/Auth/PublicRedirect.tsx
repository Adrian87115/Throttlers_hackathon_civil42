import { useAuth } from '@/contexts/AuthUserContext';
import type { AccessToken, RefreshToken } from '@/types/ids';
import { AppRoutePaths } from '@/types/types';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type Props = {};

export default function PublicRedirect({}: Props) {
	const { setAuthTokens } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const accessToken = params.get('accessToken') as AccessToken | null;
		const refreshToken = params.get('refreshToken') as RefreshToken | null;

		if (!accessToken || !refreshToken) {
			return;
		}

		setAuthTokens(accessToken, refreshToken);

		navigate(AppRoutePaths.mainDashboard());
	}, []);

	return null;
}
