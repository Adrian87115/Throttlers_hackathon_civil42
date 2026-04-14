import { useAuth } from '@/contexts/AuthUserContext';
import { getMyProfile } from '@/services/auth';
import { useEffect, useState } from 'react';
import { useAuthenticatedApi } from './useAuthenticatedApi';

/**
 * Viewer access tiers used across employee / volunteer listings.
 *
 * - `isAuthenticated`    — user is logged in (any role).
 * - `isVerifiedUser`     — any logged-in user whose account is NOT an unverified
 *                          organization. Private users are always verified, gov
 *                          orgs must be admin-approved. Unverified orgs (private
 *                          or public) are treated like guests for data access.
 * - `isVerifiedGovOrg`   — verified government organization — unlocks phone
 *                          numbers and other direct-contact data.
 */
export function useViewerAccess() {
	const { auth } = useAuth();
	const { callWithToken } = useAuthenticatedApi();
	const isAuthenticated = auth.user !== null;

	const [isVerifiedUser, setIsVerifiedUser] = useState(false);
	const [isVerifiedGovOrg, setIsVerifiedGovOrg] = useState(false);

	useEffect(() => {
		if (!isAuthenticated || auth.isLoading) {
			setIsVerifiedUser(false);
			setIsVerifiedGovOrg(false);
			return;
		}

		// Regular users (non-employer) are always verified viewers.
		if (auth.user?.accountType !== 'employer') {
			setIsVerifiedUser(true);
			setIsVerifiedGovOrg(false);
			return;
		}

		let cancelled = false;
		callWithToken(getMyProfile)
			.then((profile: any) => {
				if (cancelled) return;
				const isVerified =
					profile?.is_verified === true ||
					profile?.verification_status === 'verified';
				const isGovOrg =
					profile?.account_type === 'employer' &&
					(profile?.is_government_service === true ||
						profile?.institution_type === 'government');
				setIsVerifiedUser(isVerified);
				setIsVerifiedGovOrg(isGovOrg && isVerified);
			})
			.catch(() => {
				if (cancelled) return;
				setIsVerifiedUser(false);
				setIsVerifiedGovOrg(false);
			});

		return () => {
			cancelled = true;
		};
	}, [isAuthenticated, auth.isLoading, auth.user?.accountType]);

	return { isAuthenticated, isVerifiedUser, isVerifiedGovOrg };
}
