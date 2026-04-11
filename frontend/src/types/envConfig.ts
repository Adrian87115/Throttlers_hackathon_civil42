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
	websocket: {
		friends: required(
			'VITE_WS_FRIENDS_URL',
			`${import.meta.env.VITE_WS_FRIENDS_URL}`
		)
	}
};

export default envConfig;
