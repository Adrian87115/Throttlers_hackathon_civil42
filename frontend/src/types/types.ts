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
	employeeProfilePage: (id?: string) =>
		id ? `/profile/${id}` : '/profile/:id',
	userSettings: () => `/settings`,
	employees: () => `/employees`,
	volunteers: () => `/volunteers`,
	volunteerSignup: () => `/volunteers/signup`
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

	// alerts
	postOpenHandsAlert: () => `alerts/open-hands`
};

export const SEARCH_DEBOUNCE_MS = 500;

export interface SuccessOnlyResponse {
	success: boolean;
}
