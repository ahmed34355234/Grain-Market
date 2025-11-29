import React, { useContext, useEffect, useState } from 'react'
import { ProductContext } from './ProductContext'
import { Button } from 'react-bootstrap'
import { getData } from '../dynmicSevice'

// Logo

const Dashboard = () => {
	const { products } = useContext(ProductContext)

	/* ---------- STATE ---------- */
	const [userId, setUserId] = useState(localStorage.getItem('userId')) // <-- now in state

	const [finalData, setFinalData] = useState([]) // will store API data
	const [showBuyers, setShowBuyers] = useState(false)
	const [showSellers, setShowSellers] = useState(false)
	const [buyerSearch, setBuyerSearch] = useState('')
	const [sellerSearch, setSellerSearch] = useState('')
	const [loading, setLoading] = useState(false) // optional UI feedback

	/* ---------- FETCH DATA ---------- */
	const getAllHistoryRoznamcha = async () => {
		if (!userId) return

		setLoading(true)
		try {
			console.log('Fetching with UserID:', userId)
			const data = await getData(`/transaction/my?userId=${userId}`)
			console.log('API Response:', data)

			console.log(data.transactions)

			setFinalData(data.transactions)
		} catch (error) {
			console.error('API Error:', error)
			setFinalData([])
		} finally {
			setLoading(false)
		}
	}

	/* ---------- EFFECTS ---------- */
	// 1. Re-check localStorage on mount (in case login happened elsewhere)
	useEffect(() => {
		const id = localStorage.getItem('userId')
		if (id && id !== userId) {
			setUserId(id)
		}
	}, []) // run once

	// 2. Fetch whenever userId changes (including after the mount-check)
	useEffect(() => {
		if (userId) {
			getAllHistoryRoznamcha()
		} else {
			setFinalData([])
		}
	}, [userId])

	const totalTrades = finalData.length
	const uniqueBuyers = [
		...new Set(
			finalData
				.filter((p) => p.transactionType === 'purchase')
				.map((p) => p.person)
		),
	]
	const uniqueSellers = [
		...new Set(
			finalData
				.filter((p) => p.transactionType === 'sale')
				.map((p) => p.personName)
		),
	]

	// Group buyers by product
	const buyersByProduct = finalData
		.filter((p) => p.transactionType === 'purchase')
		.reduce((acc, p) => {
			const productKey = p.item || p.product || 'Unknown Product'
			if (!acc[productKey]) acc[productKey] = []
			acc[productKey].push({
				person: p.person,
				total: p.total || p.rate * p.quantity, // ✅ use total or calculate if missing
			})
			return acc
		}, {})

	// Group sellers by product
	const sellersByProduct = finalData
		.filter((p) => p.transactionType === 'sale')
		.reduce((acc, p) => {
			const productKey = p.item || p.product || 'Unknown Product'
			if (!acc[productKey]) acc[productKey] = []
			acc[productKey].push({
				person: p.personName || p.person || 'Unknown Seller',
				total: p.total || p.rate * p.quantity,
			})
			return acc
		}, {})

	const filteredBuyersByProduct = Object.keys(buyersByProduct).reduce(
		(acc, item) => {
			const filtered = buyersByProduct[item].filter((t) =>
				t.person && typeof t.person === 'string'
					? t.person.toLowerCase().includes(buyerSearch.toLowerCase())
					: false
			)
			if (filtered.length) acc[item] = filtered
			return acc
		},
		{}
	)

	const filteredSellersByProduct = Object.keys(sellersByProduct).reduce(
		(acc, item) => {
			const filtered = sellersByProduct[item].filter((t) =>
				t.person && typeof t.person === 'string'
					? t.person
							.toLowerCase()
							.includes(sellerSearch.toLowerCase())
					: false
			)
			if (filtered.length) acc[item] = filtered
			return acc
		},
		{}
	)

	/* ---------- RENDER (unchanged UI) ---------- */
	return (
		<div
			className='container my-lg-2'
			style={{ marginTop: '5rem' }}>
			<h1 className='mb-4 fw-bold text-success d-flex justify-content-center'>
				Dashboard Overview
			</h1>
			<hr />

			{/* optional loading indicator */}
			{loading && <p className='text-center'>Loading transactions...</p>}

			<div className='row'>
				<div className='col-md-4 mb-3'>
					<div className='card bg-secondary text-white text-center'>
						<div className='card-body'>
							<h5>{totalTrades}</h5>
							<p>Total Trades</p>
						</div>
					</div>
				</div>

				<div className='col-md-4 mb-3'>
					<div
						className='card bg-danger text-white text-center'
						style={{ cursor: 'pointer' }}
						onClick={() => setShowBuyers(!showBuyers)}>
						<div className='card-body'>
							<h5>{uniqueBuyers.length}</h5>
							<p>Total Buyers</p>
						</div>
					</div>
				</div>

				<div className='col-md-4 mb-3'>
					<div
						className='card bg-success text-white text-center'
						style={{ cursor: 'pointer' }}
						onClick={() => setShowSellers(!showSellers)}>
						<div className='card-body'>
							<h5>{uniqueSellers.length}</h5>
							<p>Total Sellers</p>
						</div>
					</div>
				</div>
			</div>

			{/* BUYERS SECTION */}
			{showBuyers && (
				<div className='mt-4'>
					<h4>Buyers by Product</h4>
					<input
						type='text'
						className='form-control mb-3'
						placeholder='Search buyers by name...'
						value={buyerSearch}
						onChange={(e) => setBuyerSearch(e.target.value)}
					/>
					{Object.keys(filteredBuyersByProduct).length > 0 ? (
						Object.keys(filteredBuyersByProduct).map(
							(item, idx) => (
								<div
									key={idx}
									className='mb-3'>
									<h5>Buyers of {item}</h5>
									<ul className='list-group'>
										{filteredBuyersByProduct[item].map(
											(t, i) => (
												<li
													key={i}
													className='list-group-item fw-medium'>
													{t.person} - PKR{' '}
													{t.total.toFixed(2)}
												</li>
											)
										)}
									</ul>
								</div>
							)
						)
					) : (
						<p>No buyers found matching the search.</p>
					)}
					<Button
						variant='secondary'
						className='mt-2'
						onClick={() => setShowBuyers(false)}>
						Hide Buyers
					</Button>
				</div>
			)}

			{/* SELLERS SECTION */}
			{showSellers && (
				<div className='mt-4'>
					<h4>Sellers by Product</h4>
					<input
						type='text'
						className='form-control mb-3'
						placeholder='Search sellers by name...'
						value={sellerSearch}
						onChange={(e) => setSellerSearch(e.target.value)}
					/>
					{Object.keys(filteredSellersByProduct).length > 0 ? (
						Object.keys(filteredSellersByProduct).map(
							(item, idx) => (
								<div
									key={idx}
									className='mb-3'>
									<h5>Sellers of {item}</h5>
									<ul className='list-group'>
										{filteredSellersByProduct[item].map(
											(t, i) => (
												<li
													key={i}
													className='list-group-item'>
													{t.person} - PKR{' '}
													{t.total.toFixed(2)}
												</li>
											)
										)}
									</ul>
								</div>
							)
						)
					) : (
						<p>No sellers found matching the search.</p>
					)}
					<Button
						variant='secondary'
						className='mt-2'
						onClick={() => setShowSellers(false)}>
						Hide Sellers
					</Button>
				</div>
			)}
		</div>
	)
}

export default Dashboard
