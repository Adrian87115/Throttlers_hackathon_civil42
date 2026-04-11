export const AppRoutePaths = {
	// auth
	loginPage: () => '/login',
	registerPage: () => '/register',
	mainDashboard: () => '/',
	categoryPage: (category?: string) =>
		category ? `/category/${category}` : '/category/:category',
	mapPage: () => '/map',
	searchPage: (query?: string) =>
		`/search${query ? `?q=${encodeURIComponent(query)}` : ''}`,
	userProfile: () => `/me/profile`,
	orgProfile: () => `/me/organization`,
	ownerVerifications: () => `/owner/verifications`,
	employeeProfilePage: (id?: string) =>
		id ? `/profile/${id}` : '/profile/:id',
	userSettings: () => `/settings`,
	employees: () => `/employees`,
	volunteers: () => `/volunteers`,
	volunteerSignup: () => `/volunteers/signup`,

	crisis: () => `/crisis`
};

export const AppApiPaths = {
	// auth
	// auth
	deleteUser: () => `auth/me`,
	postAppRefreshToken: () => `auth/refresh-token`,
	postUserLogin: () => `auth/login`,
	postUserRegister: () => `auth/register-user`,
	postCompanyRegister: () => `auth/register-company`,

	googleOAuthLogin: () => `auth/google`,

	// profile
	getMyProfile: () => `auth/me/profile`,
	patchMyProfile: () => `auth/me/profile`,
	getUserMe: () => `users/me`,
	getOwnerPendingVerifications: (
		target: 'all' | 'employer' | 'gov_service' = 'all'
	) => `users/owner/verifications/pending?target=${target}`,
	patchOwnerApproveVerification: (userId: number) =>
		`users/owner/verifications/${userId}/approve`,
	patchOwnerRejectVerification: (userId: number) =>
		`users/owner/verifications/${userId}/reject`,

	// crisis
	getActiveCrisis: () => `crisis/active`,
	postStartCrisis: () => `crisis/start`,
	postEndCrisis: (crisisId: number) => `crisis/${crisisId}/end`,
	postCrisisRequest: (crisisId: number) => `crisis/${crisisId}/requests`,
	getCrisisResponders: (crisisId: number) => `crisis/${crisisId}/responders`,
	postCrisisNotify: (crisisId: number) => `crisis/${crisisId}/notify`,

	// alerts
	postOpenHandsAlert: () => `alerts/open-hands`
};

export const SEARCH_DEBOUNCE_MS = 500;

export interface SuccessOnlyResponse {
	success: boolean;
}
