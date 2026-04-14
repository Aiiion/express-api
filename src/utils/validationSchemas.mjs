export const latLonValidationSchema = {
	lat: {
		in: ['query'],
		exists: {
			errorMessage: 'Lat is required',
		},
		isFloat: {
			options: { min: -90, max: 90 },
			errorMessage: 'Lat must be a number between -90 and 90',
		},
		toFloat: true,
	},
	lon: {
		in: ['query'],
		exists: {
			errorMessage: 'Lon is required',
		},
		isFloat: {
			options: { min: -180, max: 180 },
			errorMessage: 'Lon must be a number between -180 and 180',
		},
		toFloat: true,
	},
};

export const bearerTokenValidationSchema = {
	authorization: {
		in: ['headers'],
		exists: {
			errorMessage: 'Authorization header is required',
		},
		custom: {
			options: (value) => {
				if (!value || !value.startsWith('Bearer ')) {
					throw new Error('Authorization header must be in format: Bearer <token>');
				}
				const token = value.split(' ')[1];
				if (!token || token.trim() === '') {
					throw new Error('Token is required');
				}
				return true;
			},
		},
	},
};

export const verifyCodeValidationSchema = {
	sessionToken: {
		in: ['body'],
		exists: {
			errorMessage: 'Session token is required',
		},
		isString: {
			errorMessage: 'Session token must be a string',
		},
		notEmpty: {
			errorMessage: 'Session token cannot be empty',
		},
	},
	code: {
		in: ['body'],
		exists: {
			errorMessage: 'Code is required',
		},
		isString: {
			errorMessage: 'Code must be a string',
		},
		notEmpty: {
			errorMessage: 'Code cannot be empty',
		},
	},
};

export const loginValidationSchema = {
	password: {
		in: ['body'],
		exists: {
			errorMessage: 'Password is required',
		},
		isString: {
			errorMessage: 'Password must be a string',
		},
		notEmpty: {
			errorMessage: 'Password cannot be empty',
		}
	},
};