export const AppRoutePaths = {
	// auth
	loginPage: () => '/login',
	registerPage: () => '/register',
	mainDashboard: () => '/',
	userProfile: () => `/me/profile`,
	userSettings: () => `/settings`
};

export const AppApiPaths = {
	// auth
	// auth
	deleteUser: () => `auth/me`,
	postAppRefreshToken: () => `auth/refresh-token`,

	googleOAuthLogin: () => `auth/google`
};

export const SEARCH_DEBOUNCE_MS = 500;

export interface SuccessOnlyResponse {
	success: boolean;
}
