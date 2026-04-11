const required = (key: string, variable: string | undefined) => {
	if (!variable) {
		throw new Error(`Environment variable ${key} is required`);
	}
	return variable;
};

const envConfig = {
	api: {
		/** e.g. http://localhost:3000/api/ */
		url: required('VITE_API_URL', `${import.meta.env.VITE_API_URL}`)
	},
	googlemaps: {
		token: required(
			'VITE_GOOGLE_MAPS_API_KEY',
			`${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
		)
	}
};

export default envConfig;
