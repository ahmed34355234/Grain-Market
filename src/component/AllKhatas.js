import React, { useContext, useState, useEffect } from 'react'
import { ProductContext } from './ProductContext'
import { Link, useNavigate } from 'react-router-dom'
import { AddKhatas } from '../service'

const AllKhatas = () => {
	const navigate = useNavigate()
	const context = useContext(ProductContext)
	const khatas = context?.khatas || []
	const setKhatas = context?.setKhatas
	const [searchTerm, setSearchTerm] = useState('')
	const [isLoggedIn, setIsLoggedIn] = useState(false)

	// Login check & clear data when user changes
	useEffect(() => {
		const user = localStorage.getItem('currentUser')
		if (!user) {
			setIsLoggedIn(false)
			setKhatas([]) // important
			return
		}

		const currentUser = JSON.parse(user)
		setIsLoggedIn(true)
		fetchKhatasFromAPI(currentUser.id) // har baar call hoga jab page load hoga
	}, []) // yeh [] hi rakhna hai agar login ke baad /all-khatas pe redirect karte ho

	// Fetch khatas from API and update context
	const fetchKhatasFromAPI = async (userId) => {
		try {
			console.log('Fetching khatas for userId:', userId)
			const response = await AddKhatas.getAllKhata(userId)

			// YE SABSE BADI GALTI LOG YAHAN KARTE HAIN
			// Axios by default response.data deta hai!
			const khatasData =
				response?.data?.khatas ||
				response?.data ||
				response?.khatas ||
				[]

			console.log('API se aaya data:', khatasData)

			if (Array.isArray(khatasData)) {
				setKhatas(khatasData) // new array → React re-render karega
			} else {
				console.error('Data array nahi hai!')
				setKhatas([])
			}
		} catch (err) {
			console.error('API Error:', err.response?.data || err.message)
			setKhatas([])
		}
	}

	// If not logged in → show message
	if (!isLoggedIn) {
		return (
			<div className='container my-5 text-center'>
				<div className='alert alert-warning'>
					Please login to view Khata Summary.
				</div>
			</div>
		)
	}

	// Filter khatas for the current user
	const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
	// SAFE: Only filter if currentUser.id exists
	const userKhatas = currentUser.id
		? khatas.filter((k) => k?.userId === currentUser.id)
		: []

	// Use balance from khata
	const khataSummary = userKhatas.reduce((acc, khata) => {
		acc[khata.khataNumber] = {
			khataNumber: khata.khataNumber,
			name: khata.name || 'Unknown',
			total: parseFloat(khata.balance) || 0,
		}
		return acc
	}, {})

	let summaryArray = Object.values(khataSummary)

	// Search filter
	if (searchTerm.trim() !== '') {
		const query = searchTerm.toLowerCase()
		summaryArray = summaryArray.filter(
			(item) =>
				item.khataNumber?.toString().toLowerCase().includes(query) ||
				item.name?.toLowerCase().includes(query)
		)
	}

	const formatBalance = (total) => {
		if (total >= 0) {
			return `PKR ${total} (Us sy lenay hain)`
		} else {
			return `PKR ${Math.abs(total)} (Usko denay hain)`
		}
	}

	// DELETE HANDLER
	const handleDelete = async (khataNumber) => {
		const confirmDelete = window.confirm(
			`Are you sure you want to delete Khata #${khataNumber}? This cannot be undone.`
		)
		if (confirmDelete) {
			try {
				await AddKhatas.deleteKhata({
					khataNumber,
					userId: currentUser.id,
				})
				setKhatas((prev) =>
					prev.filter((k) => k.khataNumber !== khataNumber)
				)
			} catch (err) {
				console.error('Delete Error:', err)
			}
		}
	}

	return (
		<div className='container my-5'>
			<h3
				className='my-lg-2'
				style={{ marginTop: '5rem' }}>
				All Khata Summary - {currentUser.name}
			</h3>

			<div className='mb-3'>
				<input
					type='text'
					className='form-control'
					placeholder='Search by Khata Number or Name...'
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
				/>
			</div>
			{summaryArray.length > 0 ? (
				<div className='table-responsive'>
					<table className='table table-striped table-hover'>
						<thead className='table-light'>
							<tr>
								<th>Khata Number</th>
								<th>Name</th>
								<th>Balance</th>
								<th>Action</th>
							</tr>
						</thead>
						<tbody>
							{summaryArray.map((item, index) => (
								<tr key={index}>
									<td>
										<Link
											to={`/khata-history/${item.khataNumber}`}
											className='text-primary text-decoration-none'>
											{item.khataNumber}
										</Link>
									</td>
									<td>{item.name}</td>
									<td>{formatBalance(item.total)}</td>
									<td>
										<button
											onClick={() =>
												handleDelete(item.khataNumber)
											}
											className='btn btn-danger btn-sm'
											title='Delete Khata'>
											Delete
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			) : (
				<div className='alert alert-info text-center'>
					No khatas found for you.
				</div>
			)}
		</div>
	)
}

export default AllKhatas
