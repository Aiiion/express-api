export const latLonValidationSchema = {
	lat: {
		notEmpty: true,
		errorMessage: 'Lat is required',
	},
	lon: {
		notEmpty: true,
		errorMessage: 'Lon is required',
	},
};