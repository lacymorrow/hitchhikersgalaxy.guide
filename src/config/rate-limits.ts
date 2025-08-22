export const rateLimits = {
	importPayments: {
		requests: 5,
		duration: 60 * 30,
	},
	createPayment: {
		requests: 10,
		duration: 60 * 5,
	},
	getPayments: {
		requests: 20,
		duration: 60 * 5,
	},
	getAllPayments: {
		requests: 10,
		duration: 60 * 10,
	},
};