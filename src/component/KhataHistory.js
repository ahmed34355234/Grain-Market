import React, { useContext, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ProductContext } from './ProductContext'
import { AddKhatas } from '../service'
import { toast } from 'react-toastify'

const KhataHistory = () => {
	const { khataNumber } = useParams()
	const { khatas } = useContext(ProductContext)
	const [isLoggedIn, setIsLoggedIn] = useState(false)
	const [khataRecords, setKhataRecords] = useState([])

	// Login check
	useEffect(() => {
		const user = localStorage.getItem('currentUser')
		setIsLoggedIn(!!user)
	}, [])

	// Fetch history from API
	useEffect(() => {
		if (!isLoggedIn) return

		const user = JSON.parse(localStorage.getItem('currentUser') || '{}')
		const fetchHistory = async () => {
			try {
				const res = await AddKhatas.getKhataHistory({
					khataNumber,
					userId: user.id,
				})

				// DEBUG
				console.log('Khata History API Response:', res)

				// FIX: res is already the data, NOT res.data
				const histories = res?.histories || []

				setKhataRecords(histories)
			} catch (error) {
				console.error('Fetch Khata History Error:', error)
				toast.error('Failed to load history')
				setKhataRecords([])
			}
		}

		fetchHistory()
	}, [khataNumber, isLoggedIn])

	// Not logged in
	if (!isLoggedIn) {
		return (
			<div className='container my-5 text-center'>
				<div className='alert alert-warning'>
					Please login to view Khata History.
				</div>
				<Link
					to='/login'
					className='btn btn-primary'>
					Login
				</Link>
			</div>
		)
	}

	// Format date & time
	const formatDateTime = (dateStr, timeStr) => {
		if (!dateStr || !timeStr) return { date: '-', time: '-' }
		const dateObj = new Date(`${dateStr}T${timeStr}`)
		if (isNaN(dateObj)) return { date: '-', time: '-' }

		const date = dateObj.toLocaleDateString('en-GB')
		const time = dateObj.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
		})
		return { date, time }
	}

	const formatType = (type) => {
		return type === 'credit' ? 'Credit (usko Diye)' : 'Debit (us sy Liye)'
	}

	// Calculate summary
	const calculateSummary = () => {
		let totalCredit = 0
		let totalDebit = 0

		khataRecords.forEach((item) => {
			const amount = parseFloat(item.amount) || 0
			if (item.type === 'credit') totalCredit += amount
			if (item.type === 'debit') totalDebit += amount
		})

		const balance = totalCredit - totalDebit
		return { totalCredit, totalDebit, balance }
	}

	const { totalCredit, totalDebit, balance } = calculateSummary()

	const formatBalance = (balance) => {
		if (balance >= 0) {
			return `Total (Us sy Leny hain): ₹${balance}`
		} else {
			return `Total (Usko Deny hain): ₹${Math.abs(balance)}`
		}
	}

	return (
		<div className='container my-5'>
			<h3
				className='my-lg-2'
				style={{ marginTop: '5rem' }}>
				Khata History - {khataNumber}
			</h3>
			<Link
				to='/All-khata'
				className='btn btn-secondary mb-3'>
				Back to Summary
			</Link>

			{/* Table */}
			<div className='table-responsive'>
				<table className='table table-bordered table-striped'>
					<thead className='table-light'>
						<tr>
							<th>Date</th>
							<th>Time</th>
							<th>Type</th>
							<th>Amount</th>
						</tr>
					</thead>
					<tbody>
						{khataRecords.length > 0 ? (
							khataRecords.map((item, index) => {
								const { date, time } = formatDateTime(
									item.date,
									item.time
								)
								return (
									<tr key={index}>
										<td>{date}</td>
										<td>{time}</td>
										<td>{formatType(item.type)}</td>
										<td>₹{item.amount || 0}</td>
									</tr>
								)
							})
						) : (
							<tr>
								<td
									colSpan='4'
									className='text-center text-muted'>
									No records found
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{/* Summary */}
			<div className='mt-4 p-3 border rounded bg-light'>
				<h5>Summary</h5>
				<p>
					<strong>Total Credit (usko Diye):</strong> ₹{totalCredit}
				</p>
				<p>
					<strong>Total Debit (us sy Liye):</strong> ₹{totalDebit}
				</p>
				<p>
					<strong>{formatBalance(balance)}</strong>
				</p>
			</div>
		</div>
	)
}

export default KhataHistory
