import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi';
import { getUserMe } from '@/services/auth';
import { AppRoutePaths } from '@/types/types';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

type Props = {
	children: React.ReactNode;
};

export default function OwnerRoute({ children }: Props) {
	const { callWithToken } = useAuthenticatedApi();
	const [isLoading, setIsLoading] = useState(true);
	const [isOwner, setIsOwner] = useState(false);

	useEffect(() => {
		let isCancelled = false;

		async function checkOwner() {
			try {
				const me = await callWithToken(getUserMe);
				if (!isCancelled) {
					setIsOwner(me.role === 'owner' || me.isOwner === true);
				}
			} catch {
				if (!isCancelled) {
					setIsOwner(false);
				}
			} finally {
				if (!isCancelled) {
					setIsLoading(false);
				}
			}
		}

		checkOwner();

		return () => {
			isCancelled = true;
		};
	}, [callWithToken]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-24">
				<Loader2 size={28} className="animate-spin text-primary-blue" />
			</div>
		);
	}

	if (!isOwner) {
		return <Navigate to={AppRoutePaths.mainDashboard()} replace />;
	}

	return children;
}
