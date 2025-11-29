import React, { useEffect, useState, useMemo } from 'react'
import { Card } from 'react-bootstrap'
import { toast, ToastContainer } from 'react-toastify' // Add this import
import 'react-toastify/dist/ReactToastify.css'
import { getData } from '../dynmicSevice'

// Constants
const BORIPERKG = 100
const CURRENCY = 'PKR'

const Inventory = () => {
	const [data, setData] = useState([])
	const [searchQuery, setSearchQuery] = useState('')

	// Fetch inventory data
	const getInventoryData = async () => {
		const user = JSON.parse(localStorage.getItem('currentUser') || 'null')
		if (!user?.id) {
			setData([])
			return
		}

		try {
			const result = await getData(
				`/inventory/products?userId=${user.id}`
			)
			console.log(result)

			setData(result.data || [])
		} catch (error) {
			console.error('Error fetching inventory:', error)
			setData([])
			toast.error('Inventory load nahi hua') // Now this works
		}
	}

	useEffect(() => {
		getInventoryData()
	}, [])

	// ✅ Calculate overall totals from backend data
	const totals = useMemo(() => {
		let totalPurchasedBori = 0
		let totalPurchasedPrice = 0
		let totalSoldBori = 0
		let totalSoldPrice = 0

		data.forEach((item) => {
			totalPurchasedBori += item.purchased?.bori || 0
			totalPurchasedPrice += item.purchased?.price || 0
			totalSoldBori += item.sold?.bori || 0
			totalSoldPrice += item.sold?.price || 0
		})

		const remainingBori = totalPurchasedBori - totalSoldBori
		const totalProfit = totalSoldPrice - totalPurchasedPrice

		return {
			totalPurchasedBori: totalPurchasedBori.toFixed(2),
			totalSoldBori: totalSoldBori.toFixed(2),
			remainingBori: remainingBori.toFixed(2),
			totalPurchasedKg: (totalPurchasedBori * BORIPERKG).toFixed(2),
			totalSoldKg: (totalSoldBori * BORIPERKG).toFixed(2),
			remainingKg: (remainingBori * BORIPERKG).toFixed(2),
			totalProfit: totalProfit.toFixed(2),
			totalPurchasedPrice: totalPurchasedPrice.toFixed(2),
			totalSoldPrice: totalSoldPrice.toFixed(2),
		}
	}, [data])

	// ✅ Filtered products based on search
	const filteredData = useMemo(() => {
		if (!searchQuery) return data
		const query = searchQuery.toLowerCase()
		return data.filter((item) => item.product.toLowerCase().includes(query))
	}, [searchQuery, data])

	return (
		<div className='container my-5'>
			<h2
				className='mb-4 text-center fw-bold my-lg-2'
				aria-label='Inventory Overview'
				style={{ marginTop: '5rem' }}>
				📦 Inventory
			</h2>

			{/* ✅ Net Totals Section */}
			<div className='row g-3 mb-5'>
				<div className='col-12 col-md-4'>
					<Card className='shadow border-0 h-100'>
						<div className='card-body p-4 text-center'>
							<p className='mb-4 fw-bolder bg-secondary rounded-5'>
								Total Purchased
							</p>
							<p className='text-success'>
								{totals.totalPurchasedBori} bori (
								{totals.totalPurchasedKg} kg)
								<br />({CURRENCY} {totals.totalPurchasedPrice})
							</p>
						</div>
					</Card>
				</div>
				<div className='col-12 col-md-4'>
					<Card className='shadow border-0 h-100'>
						<div className='card-body p-4 text-center'>
							<p className='mb-4 fw-bolder bg-danger rounded-5'>
								Total Sold
							</p>
							<p className='text-danger'>
								{totals.totalSoldBori} bori (
								{totals.totalSoldKg} kg)
								<br />({CURRENCY} {totals.totalSoldPrice})
							</p>
						</div>
					</Card>
				</div>
				<div className='col-12 col-md-4'>
					<Card className='shadow border-0 h-100'>
						<div className='card-body p-4 text-center'>
							<p className='mb-4 fw-bolder bg-success rounded-5'>
								Remaining Stock
							</p>
							<p
								className={
									totals.remainingBori >= 0
										? 'text-success'
										: 'text-danger'
								}>
								{totals.remainingBori} bori (
								{totals.remainingKg} kg)
								<br />
								Total Profit: {CURRENCY} {totals.totalProfit}
							</p>
						</div>
					</Card>
				</div>
			</div>

			{/* ✅ Search bar */}
			<div className='mb-3'>
				<input
					type='text'
					className='form-control'
					placeholder='Search product...'
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</div>

			{/* ✅ Product Summary Table */}
			{filteredData.length === 0 ? (
				<p className='text-center'>No products found.</p>
			) : (
				filteredData.map((item, idx) => (
					<div
						key={idx}
						className='mb-5'>
						<h3 className='fw-bold text-center my-3'>
							📋 Inventory for {item.product}
						</h3>
						<Card className='shadow border-0'>
							<div className='card-body p-0'>
								<div className='table-responsive'>
									<table className='table table-bordered table-hover mb-0'>
										<tbody>
											<tr className='fw-bold table-primary'>
												<td colSpan='2'>
													Purchased:{' '}
													{item.purchased.bori} Bori{' '}
													<br />
													Price: {CURRENCY}{' '}
													{item.purchased.price}
												</td>
												<td colSpan='2'>
													Sold: {item.sold.bori} Bori{' '}
													<br />
													Price: {CURRENCY}{' '}
													{item.sold.price}
												</td>
												<td colSpan='3'>
													Remaining:{' '}
													{item.remaining.bori} Bori{' '}
													<br />
													Total Profit: {
														CURRENCY
													}{' '}
													{item.totalProfit}
												</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>
						</Card>
					</div>
				))
			)}
		</div>
	)
}

export default Inventory
