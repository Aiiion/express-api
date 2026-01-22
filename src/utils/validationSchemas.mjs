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