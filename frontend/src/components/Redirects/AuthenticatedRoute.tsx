import { useAuth } from '@/contexts/AuthUserContext';
import { Navigate } from 'react-router-dom';
import { AppRoutePaths } from '../../types/types';

type Props = {
	children: React.ReactNode;
};

export default function AuthenticatedRoute({ children }: Props) {
	const isAuth = useAuth();
	if (isAuth.auth.isLoading) return null;

	return isAuth.auth.user?.id ? (
		children
	) : (
		<Navigate to={AppRoutePaths.loginPage()} />
	);
}
