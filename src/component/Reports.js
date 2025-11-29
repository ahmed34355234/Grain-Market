import React, {
	useContext,
	useState,
	useEffect,
	useMemo,
	useCallback,
} from 'react'
import { ProductContext } from './ProductContext'
import { getData } from '../dynmicSevice'

const Reports = () => {
	const { products = [], ledger = [] } = useContext(ProductContext)

	const [filter, setFilter] = useState('all')
	const [searchQuery, setSearchQuery] = useState('')
	const [shownMonths, setShownMonths] = useState({})
	const [transactions, setTransactions] = useState([])

	// Parse date
	const parseDate = (dateStr) => {
		if (dateStr === 'Unknown' || !dateStr) return new Date('01/01/1900')
		const [day, month, year] = dateStr.split('/')
		return new Date(`${month}/${day}/${year}`)
	}

	// Filter by date
	const filterByDate = useCallback(
		(items = []) => {
			if (!Array.isArray(items)) return []
			const now = new Date()
			return items.filter((item) => {
				if (!item.date) return true
				const itemDate = parseDate(item.date)
				if (filter === 'monthly') {
					return (
						itemDate.getMonth() === now.getMonth() &&
						itemDate.getFullYear() === now.getFullYear()
					)
				} else if (filter === 'yearly') {
					return itemDate.getFullYear() === now.getFullYear()
				}
				return true
			})
		},
		[filter]
	) // Only depends on filter

	// Memoized filtered data (replaces useEffect)
	const filteredProducts = useMemo(
		() => filterByDate(transactions),
		[filterByDate, transactions]
	)
	const filteredLedger = useMemo(
		() => filterByDate(ledger),
		[filterByDate, ledger]
	)

	// Fetch transactions — wrapped in useCallback
	const fetchTransactions = useCallback(async () => {
		const userId = localStorage.getItem('userId')

		if (!userId) {
			setTransactions([])
			return
		}
		try {
			const allTransaction = await getData(
				`/report/summary?userId=${userId}`
			)

			if (Array.isArray(allTransaction) && allTransaction.length > 0) {
				const processed = allTransaction.map((t) => ({
					...t,
					item: t.product,
					unit: 'bori',
					quantity: t.quantityBori,
					total: t.quantityBori * t.pricePerBori,
					date: new Date(t.date).toLocaleDateString('en-GB'),
				}))
				setTransactions(processed)
			} else {
				setTransactions(products)
			}
			console.log('report fetch successfully', allTransaction)
		} catch (err) {
			console.error('Failed to fetch transactions:', err)
			setTransactions(products)
		}
	}, [products])

	// Run fetch only when products change
	useEffect(() => {
		fetchTransactions()
	}, [fetchTransactions])

	// Click outside handler (unchanged)
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (Object.values(shownMonths).some((value) => value === true)) {
				if (
					!event.target.closest('.month-data-table') &&
					!event.target.closest('.btn')
				) {
					setShownMonths({})
				}
			}
		}
		document.addEventListener('click', handleClickOutside)
		return () => document.removeEventListener('click', handleClickOutside)
	}, [shownMonths])

	// Filter purchases and sales
	const filteredPurchases = Array.isArray(filteredProducts)
		? filteredProducts.filter((p) => p.transactionType === 'purchase')
		: []
	const filteredSales = Array.isArray(filteredProducts)
		? filteredProducts.filter((p) => p.transactionType === 'sale')
		: []

	// Calculate totals
	const totalPurchases = filteredPurchases.reduce(
		(sum, p) => sum + (p.total || 0),
		0
	)
	const totalSales = filteredSales.reduce((sum, p) => sum + (p.total || 0), 0)
	const profit = totalSales - totalPurchases

	// Product-wise purchase totals
	const purchaseTotalsByProduct = filteredPurchases.reduce((acc, p) => {
		acc[p.item] = (acc[p.item] || 0) + (p.total || 0)
		return acc
	}, {})

	// Product-wise sales totals
	const salesTotalsByProduct = filteredSales.reduce((acc, p) => {
		acc[p.item] = (acc[p.item] || 0) + (p.total || 0)
		return acc
	}, {})

	// Product-wise quantities
	const purchaseQuantitiesByProduct = filteredPurchases.reduce((acc, p) => {
		if (!acc[p.item]) acc[p.item] = { quantity: 0, unit: p.unit || 'bori' }
		acc[p.item].quantity +=
			p.unit === 'bori' ? p.quantity || 0 : p.quantityBori || 0
		return acc
	}, {})

	const salesQuantitiesByProduct = filteredSales.reduce((acc, p) => {
		if (!acc[p.item]) acc[p.item] = { quantity: 0, unit: p.unit || 'bori' }
		acc[p.item].quantity += p.quantity || 0
		return acc
	}, {})

	// Purchase Totals by Date
	const purchaseTotalsByDate = filteredPurchases.reduce((acc, p) => {
		const date = p.date || 'Unknown'
		const item = p.item
		const unit = p.unit || 'bori'
		const quantity = p.quantity || 0
		const total = p.total || 0

		if (!acc[date]) acc[date] = {}
		if (!acc[date][item])
			acc[date][item] = { quantity: 0, unit: 'bori', total: 0 }

		let currentQty = acc[date][item].quantity
		let bori = Math.floor(currentQty)
		let kg = Math.round((currentQty - bori) * 100)

		if (unit === 'bori') {
			bori += quantity
		} else if (unit === 'kg') {
			kg += quantity
		}

		if (kg >= 100) {
			bori += Math.floor(kg / 100)
			kg = kg % 100
		}

		const finalQty = parseFloat(`${bori}.${kg.toString().padStart(2, '0')}`)
		acc[date][item].quantity = finalQty
		acc[date][item].total = +(acc[date][item].total + total).toFixed(2)

		return acc
	}, {})

	// Sales Totals by Date
	const salesTotalsByDate = filteredSales.reduce((acc, p) => {
		const date = p.date || 'Unknown'
		const item = p.item
		const unit = p.unit || 'bori'
		const quantity = p.quantity || 0
		const total = p.total || 0

		if (!acc[date]) acc[date] = {}
		if (!acc[date][item])
			acc[date][item] = { quantity: 0, unit: 'bori', total: 0 }

		let currentQty = acc[date][item].quantity
		let bori = Math.floor(currentQty)
		let kg = Math.round((currentQty - bori) * 100)

		if (unit === 'bori') {
			bori += quantity
		} else if (unit === 'kg') {
			kg += quantity
		}

		if (kg >= 100) {
			bori += Math.floor(kg / 100)
			kg = kg % 100
		}

		const finalQty = parseFloat(`${bori}.${kg.toString().padStart(2, '0')}`)
		acc[date][item].quantity = finalQty
		acc[date][item].total = +(acc[date][item].total + total).toFixed(2)

		return acc
	}, {})

	// Ledger calculations
	const totalGiven = Array.isArray(filteredLedger)
		? filteredLedger
				.filter((l) => l.type === 'given')
				.reduce((sum, l) => sum + (l.amount || 0), 0)
		: 0

	const totalTaken = Array.isArray(filteredLedger)
		? filteredLedger
				.filter((l) => l.type === 'taken')
				.reduce((sum, l) => sum + (l.amount || 0), 0)
		: 0

	const netBalance = totalTaken - totalGiven

	// Month grouping
	const getMonthYear = (dateStr) => {
		if (dateStr === 'Unknown' || !dateStr)
			return {
				monthYear: 'Unknown',
				monthName: 'Unknown',
				date: new Date('01/01/1900'),
			}
		const [day, month, year] = dateStr.split('/')
		const date = new Date(`${month}/${day}/${year}`)
		const monthName = date.toLocaleString('default', { month: 'long' })
		const yearNum = date.getFullYear()
		return { monthYear: `${monthName} ${yearNum}`, monthName, date }
	}

	const purchaseMonths = Object.keys(purchaseTotalsByDate).reduce(
		(acc, date) => {
			const { monthYear } = getMonthYear(date)
			if (!acc[monthYear]) acc[monthYear] = []
			acc[monthYear].push(date)
			return acc
		},
		{}
	)

	const now = new Date()
	const currentMonthYear = `${now.toLocaleString('default', {
		month: 'long',
	})} ${now.getFullYear()}`
	const sortedPurchaseMonths = Object.keys(purchaseMonths).sort((a, b) => {
		if (a === currentMonthYear) return -1
		if (b === currentMonthYear) return 1
		const dateA = parseDate(purchaseMonths[a][0] || '01/01/1900')
		const dateB = parseDate(purchaseMonths[b][0] || '01/01/1900')
		return dateB - dateA
	})

	const salesMonths = Object.keys(salesTotalsByDate).reduce((acc, date) => {
		const { monthYear } = getMonthYear(date)
		if (!acc[monthYear]) acc[monthYear] = []
		acc[monthYear].push(date)
		return acc
	}, {})

	const sortedSalesMonths = Object.keys(salesMonths).sort((a, b) => {
		if (a === currentMonthYear) return -1
		if (b === currentMonthYear) return 1
		const dateA = parseDate(salesMonths[a][0] || '01/01/1900')
		const dateB = parseDate(salesMonths[b][0] || '01/01/1900')
		return dateB - dateA
	})

	const displayedPurchaseMonths = sortedPurchaseMonths.filter((month) =>
		month.toLowerCase().includes(searchQuery.toLowerCase())
	)
	const displayedSalesMonths = sortedSalesMonths.filter((month) =>
		month.toLowerCase().includes(searchQuery.toLowerCase())
	)

	return (
		<div
			className='p-3 border rounded bg-light my-lg-2'
			style={{ marginTop: '5rem' }}>
			<h4>Reports</h4>

			{/* Search & Filter */}
			<div className='mb-3'>
				<input
					type='text'
					className='form-control d-inline-block me-2'
					placeholder='Search Month/Summary'
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
				<label className='mt-4'>Filter: </label>
				<select
					className='form-select w-auto d-inline-block ms-2'
					value={filter}
					onChange={(e) => setFilter(e.target.value)}>
					<option value='all'>All</option>
					<option value='monthly'>Monthly</option>
					<option value='yearly'>Yearly</option>
				</select>
			</div>

			{/* Purchases */}
			<h5>Purchases / Roznamcha</h5>
			{displayedPurchaseMonths.length === 0 ? (
				<p>No purchases found.</p>
			) : (
				displayedPurchaseMonths.map((monthYear) => {
					const monthDates = purchaseMonths[monthYear].sort(
						(a, b) => parseDate(b) - parseDate(a)
					)
					const totalPurchaseForMonth = monthDates.reduce(
						(sum, date) => {
							return (
								sum +
								Object.values(
									purchaseTotalsByDate[date] || {}
								).reduce((s, d) => s + d.total, 0)
							)
						},
						0
					)
					return (
						<div key={monthYear}>
							<table className='table table-bordered text-center mt-2'>
								<thead>
									<tr>
										<th
											className='table-primary'
											colSpan='2'>
											{monthYear} Purchases
										</th>
									</tr>
									<tr>
										<th>Total Purchases</th>
										<td>
											{totalPurchaseForMonth.toFixed(2)}{' '}
											PKR
										</td>
									</tr>
								</thead>
							</table>
							<button
								className='btn btn-primary mb-5'
								onClick={() =>
									setShownMonths((prev) => ({
										...prev,
										[monthYear + '_purchase']:
											!prev[monthYear + '_purchase'],
									}))
								}>
								{shownMonths[monthYear + '_purchase']
									? `Hide ${monthYear} Data`
									: `${monthYear} Detail`}
							</button>
							{shownMonths[monthYear + '_purchase'] && (
								<table className='table table-bordered text-center mt-2'>
									<thead className='table-dark'>
										<tr>
											<th>Date</th>
											<th>Item</th>
											<th>Total Quantity</th>
											<th>Unit</th>
											<th>Total PKR</th>
										</tr>
									</thead>
									<tbody>
										{monthDates.flatMap((date) =>
											Object.entries(
												purchaseTotalsByDate[date] || {}
											).map(([item, data], i) => (
												<tr
													key={`${date}-${item}-${i}`}>
													<td>{date}</td>
													<td>{item}</td>
													<td>{data.quantity}</td>
													<td>{data.unit}</td>
													<td>
														{data.total.toFixed(2)}
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							)}
						</div>
					)
				})
			)}

			{/* Sales */}
			<h5>Sales / Roznamcha</h5>
			{displayedSalesMonths.length === 0 ? (
				<p>No sales found.</p>
			) : (
				displayedSalesMonths.map((monthYear) => {
					const monthDates = salesMonths[monthYear].sort(
						(a, b) => parseDate(b) - parseDate(a)
					)
					const totalSaleForMonth = monthDates.reduce((sum, date) => {
						return (
							sum +
							Object.values(salesTotalsByDate[date] || {}).reduce(
								(s, d) => s + d.total,
								0
							)
						)
					}, 0)
					return (
						<div key={monthYear}>
							<table className='table table-bordered text-center mt-2'>
								<thead>
									<tr>
										<th
											className='table-primary'
											colSpan='2'>
											{monthYear} Sales
										</th>
									</tr>
									<tr>
										<th>Total Sales</th>
										<td>
											{totalSaleForMonth.toFixed(2)} PKR
										</td>
									</tr>
								</thead>
							</table>
							<button
								className='btn btn-primary mb-5'
								onClick={() =>
									setShownMonths((prev) => ({
										...prev,
										[monthYear + '_sale']:
											!prev[monthYear + '_sale'],
									}))
								}>
								{shownMonths[monthYear + '_sale']
									? `Hide ${monthYear} Data`
									: `${monthYear} Detail`}
							</button>
							{shownMonths[monthYear + '_sale'] && (
								<table className='table table-bordered text-center mt-2'>
									<thead className='table-dark'>
										<tr>
											<th>Date</th>
											<th>Item</th>
											<th>Total Quantity</th>
											<th>Unit</th>
											<th>Total PKR</th>
										</tr>
									</thead>
									<tbody>
										{monthDates.flatMap((date) =>
											Object.entries(
												salesTotalsByDate[date] || {}
											).map(([item, data], i) => (
												<tr
													key={`${date}-${item}-${i}`}>
													<td>{date}</td>
													<td>{item}</td>
													<td>{data.quantity}</td>
													<td>{data.unit}</td>
													<td>
														{data.total.toFixed(2)}
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							)}
						</div>
					)
				})
			)}

			{/* Product-Wise Totals */}
			<h5>Product-Wise Totals</h5>
			{Object.keys(purchaseTotalsByProduct).length === 0 &&
			Object.keys(salesTotalsByProduct).length === 0 ? (
				<p>No product-wise data available.</p>
			) : (
				<>
					<table className='table table-bordered text-center mt-2 d-none d-md-table'>
						<thead className='table-primary'>
							<tr>
								<th>Item</th>
								<th>Total Quantity</th>
								<th>Unit</th>
								<th>Total Purchased (PKR)</th>
								<th>Total Sold (PKR)</th>
							</tr>
						</thead>
						<tbody>
							{[
								...new Set([
									...Object.keys(purchaseTotalsByProduct),
									...Object.keys(salesTotalsByProduct),
								]),
							].map((item, i) => (
								<tr key={i}>
									<td>{item}</td>
									<td>
										{(
											purchaseQuantitiesByProduct[item]
												?.quantity || 0
										).toFixed(2)}
									</td>
									<td>
										{purchaseQuantitiesByProduct[item]
											?.unit ||
											salesQuantitiesByProduct[item]
												?.unit ||
											'bori'}
									</td>
									<td>
										{(
											purchaseTotalsByProduct[item] || 0
										).toFixed(2)}
									</td>
									<td>
										{(
											salesTotalsByProduct[item] || 0
										).toFixed(2)}
									</td>
								</tr>
							))}
						</tbody>
					</table>

					<div className='d-md-none mt-2'>
						{[
							...new Set([
								...Object.keys(purchaseTotalsByProduct),
								...Object.keys(salesTotalsByProduct),
							]),
						].map((item, i) => (
							<div
								key={i}
								className='border rounded p-2 mb-2'>
								<hr />
								<div className='d-flex justify-content-between px-2 py-1 rounded-2 bg-primary mb-2 text-light'>
									<strong>Item</strong>
									<span>{item}</span>
								</div>
								<div className='d-flex justify-content-between mb-2'>
									<strong>Total Quantity</strong>
									<span>
										{(
											purchaseQuantitiesByProduct[item]
												?.quantity || 0
										).toFixed(2)}
									</span>
								</div>
								<div className='d-flex justify-content-between mb-2'>
									<strong>Unit</strong>
									<span>
										{purchaseQuantitiesByProduct[item]
											?.unit ||
											salesQuantitiesByProduct[item]
												?.unit ||
											'bori'}
									</span>
								</div>
								<div className='d-flex justify-content-between mb-2'>
									<strong>Total Purchased</strong>
									<span>
										{(
											purchaseTotalsByProduct[item] || 0
										).toFixed(2)}
									</span>
								</div>
								<div className='d-flex justify-content-between mb-2'>
									<strong>Total Sold</strong>
									<span>
										{(
											salesTotalsByProduct[item] || 0
										).toFixed(2)}
									</span>
								</div>
							</div>
						))}
					</div>
				</>
			)}

			{/* Summary */}
			<div className='alert alert-info mt-3'>
				<p>
					<strong>Total Purchases:</strong>{' '}
					{totalPurchases.toFixed(2)} PKR
				</p>
				<p>
					<strong>Total Sales:</strong> {totalSales.toFixed(2)} PKR
				</p>
				<p>
					<strong>Profit (Sales - Purchases):</strong>{' '}
					{profit.toFixed(2)} PKR
				</p>
			</div>
		</div>
	)
}

export default Reports
