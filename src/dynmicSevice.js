import axios from 'axios'

const api = axios.create({
	baseURL: 'https://azearn.com/api',
	headers: {
		'Content-Type': 'application/json',
	},
})

// GET request (fetch all data)
export const getData = async (endpoint) => {
	try {
		const response = await api.get(endpoint)
		return response.data
	} catch (error) {
		console.error('Error fetching data:', error)
		throw error
	}
}

// POST request (create new data)
export const postData = async (endpoint, data) => {
	try {
		console.log(endpoint, data)

		const response = await api.post(endpoint, data)
		return response.data
	} catch (error) {
		console.error('Error posting data:', error)
		throw error
	}
}

// PUT request (update existing data)
export const updateData = async (endpoint, data) => {
	try {
		const response = await api.put(endpoint, data)
		return response.data
	} catch (error) {
		console.error('Error updating data:', error)
		throw error
	}
}

// DELETE request (remove data)
export const deleteData = async (endpoint) => {
	try {
		const response = await api.delete(endpoint)
		return response.data
	} catch (error) {
		console.error('Error deleting data:', error)
		throw error
	}
}
