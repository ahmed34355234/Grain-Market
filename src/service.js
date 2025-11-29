// src/service.js
import axios from 'axios'

const api = axios.create({
	baseURL: 'https://azearn.com/api',
	headers: {
		'Content-Type': 'application/json',
	},
})

const Addtransactions = {
	addItem: async (transactionId, itemName) => {
		try {
			const response = await api.post('/additem', {
				transactionId,
				itemName,
			})
			return response.data
		} catch (error) {
			throw new Error(
				error.response?.data?.message || 'Failed to add item'
			)
		}
	},

	addTransaction: async (data) => {
		try {
			const response = await api.post('/transaction/create', data)
			return response.data
		} catch (error) {
			throw new Error(
				error.response?.data?.message || 'Failed to add transaction'
			)
		}
	},

	// Fixed: Return empty array only if no data, else throw
	getTransactions: async (userId) => {
		try {
			const response = await api.get(`transaction/my?userId=${userId}`)
			return response.data.transactions || []
		} catch (error) {
			console.error('getTransactions Error:', error)
			throw new Error(
				error.response?.data?.message || 'Failed to fetch transactions'
			)
		}
	},

	getTransactionItems: async (userId) => {
		try {
			const response = await api.get(`/item/my?userId=${userId}`)
			return response.data
		} catch (error) {
			throw new Error(
				error.response?.data?.message ||
					'Failed to fetch transaction items'
			)
		}
	},

	getOpeningBalance: async (userId) => {
		try {
			const response = await api.get(`/balance?userId=${userId}`)
			return response.data
		} catch (error) {
			throw new Error(
				error.response?.data?.msg || 'Failed to fetch balance'
			)
		}
	},

	updateOpeningBalance: async (amount) => {
		try {
			const response = await api.post('/add/balance', { amount })
			return response.data
		} catch (error) {
			throw new Error(
				error.response?.data?.msg || 'Failed to update balance'
			)
		}
	},

	addOpeningBalance: async (amount, tempBalance, status = '', userId) => {
		try {
			const response = await api.post('/add/balance', {
				openingBalance: amount,
				userId,
				newBalance: tempBalance,
				status,
			})
			return response.data
		} catch (error) {
			throw new Error(
				error.response?.data?.msg || 'Failed to add balance'
			)
		}
	},
}

const AddKhatas = {
	addKhata: async (data) => {
		try {
			const response = await api.post('/khata/create', data)
			return response.data
		} catch (error) {
			throw new Error(
				error.response?.data?.message || 'Failed to add khata'
			)
		}
	},

	updateKhata: async (data) => {
		try {
			const response = await api.post('/khata/update', data)
			return response.data
		} catch (error) {
			throw new Error(
				error.response?.data?.message || 'Failed to update khata'
			)
		}
	},

	getAllKhata: async (userId) => {
		try {
			const response = await api.get(`/khata/my?userId=${userId}`)
			return response.data
		} catch (error) {
			throw new Error(
				error.response?.data?.message || 'Failed to fetch khatas'
			)
		}
	},

	// Fixed: Make it async + try/catch
	getKhataHistory: async (data) => {
		try {
			const response = await api.get('/khata/history', {
				params: data,
			})
			return response.data
		} catch (error) {
			console.error('getKhataHistory Error:', error)
			throw new Error(
				error.response?.data?.message || 'Failed to fetch khata history'
			)
		}
	},

	// Optional: Add delete if needed
	deleteKhata: async (data) => {
		try {
			const response = await api.delete('/khata/delete', { data })
			return response.data
		} catch (error) {
			throw new Error(
				error.response?.data?.message || 'Failed to delete khata'
			)
		}
	},
}

export { Addtransactions, AddKhatas }
