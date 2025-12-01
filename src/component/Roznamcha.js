import React from 'react'
import { useState, useContext, useEffect, useMemo } from 'react'
import { Card, Button } from 'react-bootstrap'
import { ProductContext } from './ProductContext'
import { v4 as uuidv4 } from 'uuid'
import { Online, Offline } from 'react-detect-offline'
import { Addtransactions } from '../service'
import { getData, postData } from '../dynmicSevice'

const Roznamcha = () => {
	const context = useContext(ProductContext)
	if (!context) {
		throw new Error(
			'ProductContext must be used within a ProductContext.Provider'
		)
	}
	const { addProduct, products, setProducts } = context // Ensure setProducts is provided

	const [items, setItems] = useState(['Gandum', 'Chana', 'Chawal'])
	const [name, setName] = useState('')
	const [date, setDate] = useState('')

	const [item, setItem] = useState('')
	const [newItem, setNewItem] = useState('')
	const [person, setPerson] = useState('')
	const [rate, setRate] = useState('')
	const [quantity, setQuantity] = useState('')
	const [unit, setUnit] = useState('bori')
	const [contact, setContact] = useState('')
	const [transactionType, setTransactionType] = useState('purchase')
	const [openingBalance, setOpeningBalance] = useState(() => {
		return parseFloat(localStorage.getItem('openingBalance')) || 0
	})
	const [tempBalance, setTempBalance] = useState('')
	const [toasts, setToasts] = useState([])
	const [warehouses, setWarehouses] = useState(() => {
		const savedWarehouses = localStorage.getItem('warehouses')
		return savedWarehouses
			? JSON.parse(savedWarehouses)
			: []
	})
	const [selectedWarehouse, setSelectedWarehouse] = useState('')
	const [newWarehouse, setNewWarehouse] = useState('')

	// Persist openingBalance to local storage
	useEffect(() => {
		localStorage.setItem('openingBalance', openingBalance)
	}, [openingBalance])

	// Stabilize products with useMemo to avoid re-computation on every render
	const memoizedProducts = useMemo(
		() => products.map((p) => ({ ...p })),
		[products]
	)

	// Migration for existing products to use BORISIZE=100 and lowercase units (runs once on mount)
	// useMemo ہٹا دو
	// const memoizedProducts = ...

	// Migration: صرف ایک بار چلے
	useEffect(() => {
		if (!setProducts || products.length === 0) return

		const BORISIZE = 100
		const needsMigration = products.some(
			(p) =>
				p.unit &&
				!p.unit.toLowerCase().includes('bori') &&
				!p.unit.toLowerCase().includes('kg')
		)

		if (!needsMigration) return

		const migrated = products.map((p) => {
			const unitLower = (p.unit || '').toLowerCase()
			let qtyKg = p.quantityKg || 0
			let qtyBori = p.quantityBori || 0

			if (unitLower === 'bori') {
				qtyKg = (p.quantity || 0) * BORISIZE
				qtyBori = p.quantity || 0
			} else if (unitLower === 'kg') {
				qtyKg = p.quantity || 0
				qtyBori = Math.round((p.quantity / BORISIZE) * 100) / 100
			}

			return {
				...p,
				quantityKg: qtyKg,
				quantityBori: qtyBori,
				unit: unitLower,
			}
		})

		setProducts(migrated)
	}, []) // صرف ایک بار// Added dependencies to satisfy exhaustive-deps

	const getRoznamchaDate = () => {
		const now = new Date()
		return now.toLocaleDateString('en-GB')
	}

	// ✅ Fetch Items (with offline support)

	useEffect(() => {
		const fetchItems = () => {
			const currentUserData = localStorage.getItem('currentUser')
			const user = currentUserData ? JSON.parse(currentUserData) : null

			if (!user?.id) {
				setItems([])
				return
			}

			// Load all items from localStorage
			const stored = JSON.parse(localStorage.getItem('items')) || []

			// Filter only current user's items
			const filtered = stored.filter((i) => i.user_id === user.id)

			// Set UI (only name)
			setItems(filtered.map((i) => i.name || i))
		}

		fetchItems()
	}, ['currentUser'])

	// ✅ Fetch Warehouses (with offline support)
	// ✅ Warehouses: LocalStorage + /getwearHouse
	useEffect(() => {
		const fetchWarehouses = () => {
			const currentUserData = localStorage.getItem('currentUser')
			const user = currentUserData ? JSON.parse(currentUserData) : null

			if (!user?.id) {
				setWarehouses([])
				return
			}

			// LocalStorage se warehouses load karo
			const stored = JSON.parse(localStorage.getItem('warehouses')) || []
		}

		fetchWarehouses()
	}, ['currentUser'])

	//getallhistryroznamcha function
	useEffect(() => {
		setProducts([])
		getallhistryroznamcha()
	}, ['currentUser']) // currentUser

	const getallhistryroznamcha = async () => {
		const currentUserData = localStorage.getItem('currentUser')

		if (!currentUserData) {
			setProducts([])
			console.log('No user logged in → transactions cleared')
			return
		}

		const userdata = JSON.parse(currentUserData)
		const userId = userdata?.id

		if (!userId) {
			setProducts([])
			console.log('Invalid user data → transactions cleared')
			return
		}

		try {
			// API سے user-specific transactions
			const allTransaction = await Addtransactions.getTransactions(userId)

			setProducts([])
			console.log('API Response:', allTransaction)

			if (
				allTransaction &&
				Array.isArray(allTransaction) &&
				allTransaction.length > 0
			) {
				setProducts(allTransaction)
				console.log(
					'Context Updated with',
					allTransaction.length,
					'transactions'
				)
			} else {
				setProducts([])
				console.log('No transactions found for this user')
			}
		} catch (error) {
			console.error('API Error:', error)

			// آف لائن: localStorage سے پرانی transactions لے لو (اگر ہیں)
			const storedProducts = JSON.parse(
				localStorage.getItem('products') || '[]'
			)
			const userTransactions = storedProducts.filter(
				(t) => t.user_id === userId
			)

			if (userTransactions.length > 0) {
				setProducts(userTransactions)
				console.log(
					'Offline: Loaded',
					userTransactions.length,
					'transactions from localStorage'
				)
			} else {
				setProducts([])
				console.log('Offline: No local transactions found')
			}
		}
	}

	useEffect(() => {
		getallhistryroznamcha()
	}, [localStorage.getItem('currentUser')]) // جب currentUser بدلے

	useEffect(() => {
		fetchBalance()
	}, [localStorage.getItem('currentUser')])

	const fetchBalance = async () => {
		const currentUserData = localStorage.getItem('currentUser')

		// اگر user لاگ آؤٹ ہے
		if (!currentUserData) {
			setOpeningBalance(0)
			localStorage.removeItem('openingBalance')
			return
		}

		const userdata = JSON.parse(currentUserData)
		const userId = userdata?.id

		if (!userId) {
			setOpeningBalance(0)
			localStorage.removeItem('openingBalance')
			return
		}

		try {
			const balance = await Addtransactions.getOpeningBalance(userId)

			const newBalance = balance.data?.opening_balance || 0

			setOpeningBalance(newBalance)
			localStorage.setItem('openingBalance', newBalance.toString())
		} catch (error) {
			console.error('Error fetching balance:', error.message)

			const stored =
				parseFloat(localStorage.getItem('openingBalance')) || 0
			setOpeningBalance(stored)
		}
	}

	const handleAddNewItem = async () => {
		const trimmedItem = newItem.trim()
		if (!trimmedItem) return showFloatingError('Enter item name!')

		const currentUserData = localStorage.getItem('currentUser')
		if (!currentUserData) {
			return showFloatingError('Please login to add item!')
		}

		const userdata = JSON.parse(currentUserData)

		// Get all stored items
		const storedItems = JSON.parse(localStorage.getItem('items')) || []

		// Only this user's items
		const userItems = storedItems.filter((i) => i.user_id === userdata.id)

		// Check duplicate
		if (userItems.some((i) => i.name === trimmedItem)) {
			return showFloatingError('Item already exists!')
		}

		try {
			const result = await postData('/additem', {
				name: trimmedItem,
				userId: userdata.id,
			})

			const newItemObj = {
				name: result.item?.name || trimmedItem,
				user_id: userdata.id,
			}

			// Updated items of current user
			const updatedUserItems = [...userItems, newItemObj]

			// Keep other users' items safe
			const otherUsersItems = storedItems.filter(
				(i) => i.user_id !== userdata.id
			)

			// Final localStorage data
			const finalItems = [...otherUsersItems, ...updatedUserItems]

			localStorage.setItem('items', JSON.stringify(finalItems))

			// UI me sirf current user
			setItems(updatedUserItems.map((i) => i.name))
			setNewItem('')
			showFloatingError('Item added successfully!')
		} catch (error) {
			showFloatingError('Failed to add item. Check internet.')
		}
	}

	const getItemall = async () => {
		const currentUserData = localStorage.getItem('currentUser')
		if (!currentUserData) {
			return showFloatingError('Please login to add item!')
		}

		const userdata = JSON.parse(currentUserData)
		let allitems = await Addtransactions.getTransactionItems(userdata.id)
		return allitems.items
	}
	// Handle adding a new warehouse
	const handleAddNewWarehouse = async () => {
		const trimmedWarehouse = newWarehouse.trim()
		if (!trimmedWarehouse) return showFloatingError('Enter warehouse name!')

		// Step 1: Check if user is logged in
		const currentUserData = localStorage.getItem('currentUser')
		if (!currentUserData) {
			return showFloatingError('Please login to add warehouse!')
		}

		const userdata = JSON.parse(currentUserData)

		// Step 2: Check duplicate (local list)
		if (warehouses.includes(trimmedWarehouse)) {
			return showFloatingError('Warehouse already exists!')
		}

		try {
			// Step 3: Send to API (save in DB)
			const result = await postData('/warehouse/create', {
				name: trimmedWarehouse,
				user_id: userdata.id,
			})

			const newWhName = result.warehouse?.name || trimmedWarehouse

			// Step 4: Update state + localStorage
			const updated = [...warehouses, newWhName]
			setWarehouses(updated)
			localStorage.setItem('warehouses', JSON.stringify(updated))
			setSelectedWarehouse(newWhName)
			setNewWarehouse('')
			showFloatingError('Warehouse added to server!')
		} catch (error) {
			console.error('API failed:', error)
			showFloatingError('Failed to add warehouse. Check internet.')
		}
	}

	const showFloatingError = (msg) => {
		const id = uuidv4()
		setToasts((prev) => [...prev, { id, msg }].slice(-3))
		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id))
		}, 5000)
	}

	// ✅ FIXED: handleAdd function
	const handleAdd = async () => {
		console.log('handleAdd CALLED!')
		const currentUserData = localStorage.getItem('currentUser')
		if (!currentUserData) {
			return showFloatingError('Please login to add transaction!')
		}

		const userdata = JSON.parse(currentUserData)

		if (!item) return showFloatingError('Item is required!')
		if (!person) return showFloatingError('Person Name is required!')
		if (!rate || isNaN(rate) || parseFloat(rate) <= 0)
			return showFloatingError('Rate must be > 0!')
		if (!quantity || isNaN(quantity) || parseFloat(quantity) <= 0)
			return showFloatingError('Quantity must be > 0!')
		if (!contact || !/^\d{7,15}$/.test(contact))
			return showFloatingError('Contact must be 7–15 digits!')
		if (!selectedWarehouse)
			return showFloatingError('Warehouse is required!')

		const BORISIZE = 100
		let qtyKg, qtyBori
		if (unit === 'kg') {
			qtyKg = parseFloat(quantity)
			qtyBori = qtyKg / BORISIZE
		} else {
			qtyBori = parseFloat(quantity)
			qtyKg = qtyBori * BORISIZE
		}
		const total = parseFloat(rate) * parseFloat(quantity)

		const newEntry = {
			id: uuidv4(),
			item,
			person,
			rate: parseFloat(rate),
			quantity: parseFloat(quantity),
			unit,
			quantityKg: qtyKg,
			quantityBori: qtyBori,
			contact,
			total,
			transactionType,
			date: getRoznamchaDate(),
			warehouse: selectedWarehouse,
			timestamp: Date.now(),
			user_id: userdata.id,
		}

		addProduct(newEntry) // Local context update

		// Step 3: API کے لیے data
		const apiData = {
			personName: person,
			product: item,
			quantityBori: qtyBori,
			quantityKg: qtyKg,
			pricePerBori: parseFloat(rate),
			transactionType: transactionType,
			contact: contact,
			warehouse: selectedWarehouse,
			date: new Date().toISOString().split('T')[0],
			user_id: userdata.id,
		}

		console.log('SENDING TO API:', apiData)

		try {
			await Addtransactions.addTransaction(apiData)
			showFloatingError('Transaction Added Successfully!')

			// Refresh history
			await getallhistryroznamcha()
		} catch (error) {
			console.error('API Error:', error)
			showFloatingError('Failed to add transaction!')
			return // آگے نہ جاؤ
		}

		// Step 5: Balance update
		if (transactionType === 'purchase') {
			const newBalance = parseFloat(openingBalance) - total
			setOpeningBalance(newBalance)
			Addtransactions.addOpeningBalance(
				newBalance,
				total,
				'purchase',
				userdata.id
			).catch((err) => console.error('Balance update error:', err))
		} else if (transactionType === 'sale') {
			const newBalance = parseFloat(openingBalance) + total
			setOpeningBalance(newBalance)
			Addtransactions.addOpeningBalance(
				newBalance,
				total,
				'sale',
				userdata.id
			).catch((err) => console.error('Balance update error:', err))
		}

		// Step 6: Reset form
		setItem('')
		setPerson('')
		setRate('')
		setQuantity('')
		setUnit('bori')
		setContact('')
		setTransactionType('purchase')
		setSelectedWarehouse('')
	}

	const handleAddBalance = async () => {
		const currentUserData = localStorage.getItem('currentUser')
		if (!currentUserData) {
			return showFloatingError('Please login to update balance!')
		}

		const userdata = JSON.parse(currentUserData)

		if (
			!tempBalance ||
			isNaN(tempBalance) ||
			parseFloat(tempBalance) <= 0
		) {
			return showFloatingError('Enter a valid balance!')
		}

		const changeAmount = parseFloat(tempBalance)
		const newAmount = parseFloat(openingBalance) + changeAmount

		setOpeningBalance(newAmount)
		setTempBalance('')

		console.log('Sending balance:', {
			newAmount,
			changeAmount,
			user_id: userdata.id,
		})

		try {
			await Addtransactions.addOpeningBalance(
				newAmount,
				changeAmount,
				'',
				userdata.id
			)

			// Step 5: کامیابی → localStorage sync
			localStorage.setItem('openingBalance', newAmount.toFixed(2))
			showFloatingError('Balance added successfully!')
		} catch (error) {
			console.error('Balance update failed:', error)

			// Step 6: ناکامی → rollback
			const previousBalance =
				parseFloat(localStorage.getItem('openingBalance')) || 0
			setOpeningBalance(previousBalance)

			showFloatingError('Failed to update balance!')
		}
	}

	const groupByDate = () => {
		const grouped = memoizedProducts.reduce((acc, t) => {
			if (!acc[t.date]) acc[t.date] = []
			acc[t.date].push(t)
			return acc
		}, {})
		Object.keys(grouped).forEach((date) => {
			grouped[date].sort((a, b) => b.timestamp - a.timestamp) // Newest Transiction first
		})
		return grouped
	}

	const calculateSummary = (transactions) => {
		let purchased = 0
		let sold = 0

		transactions.forEach((t) => {
			if (t.transactionType === 'purchase') {
				purchased += parseFloat(t.total) || 0
			} else if (t.transactionType === 'sale') {
				sold += parseFloat(t.total) || 0
			}
		})

		return { purchased, sold }
	}

	const filteredTransaction = groupByDate()

	const filteredTransactions = Object.keys(filteredTransaction).reduce(
		(acc, d) => {
			let trans = filteredTransaction[d]

			if (name) {
				trans = trans.filter((t) =>
					(t.person || '').toLowerCase().includes(name.toLowerCase())
				)
			}

			if (date) {
				trans = trans.filter((t) => {
					const [day, month, year] = t.date.split('/')
					const formatted = `${year}-${month.padStart(
						2,
						'0'
					)}-${day.padStart(2, '0')}`
					return formatted === date
				})
			}

			if (trans.length > 0) {
				acc[d] = trans
			}
			return acc
		},
		{}
	)

	return (
		<div className='container my-5'>
			<div>
				<Online>
					<p style={{ color: 'green' }}>✅ You are online!</p>
				</Online>
				<Offline>
					<p style={{ color: 'red' }}>⚠️ You are offline!</p>
				</Offline>
			</div>

			<h2
				className='mb-4 my-lg-2  text-center fw-bold'
				style={{ marginTop: '5rem' }}>
				📜 Roznamcha
			</h2>

			{/* Opening Balance */}
			<Card className='shadow border-0 mb-5'>
				<div className='card-body p-4'>
					<div className='row g-3 align-items-end'>
						<div className='col-md-3'>
							<label className='form-label fw-medium'>
								Opening Balance (PKR)
							</label>
							<input
								type='number'
								className='form-control'
								value={tempBalance}
								onChange={(e) => setTempBalance(e.target.value)}
							/>
						</div>
						<div className='col-md-2'>
							<Button
								variant='success'
								onClick={handleAddBalance}
								className='w-100'>
								Add Balance
							</Button>
						</div>
						<div className='col-md-3'>
							<p className='fw-semibold mb-0'>
								Current Balance: PKR {openingBalance.toString()}
							</p>
						</div>
					</div>
				</div>
			</Card>

			{/* Add Transaction Form */}
			<Card className='shadow border-0 mb-5'>
				<div className='card-body p-4'>
					<h4 className='card-title mb-4 fw-semibold'>
						Add Transaction
					</h4>
					<div className='toast-container'>
						{toasts.map((t) => (
							<div
								key={t.id}
								className='floating-toast'>
								{t.msg}
							</div>
						))}
					</div>

					<div className='row g-3'>
						<div className='col-md-3'>
							<label className='form-label fw-bold'>Type</label>
							<select
								className='form-select'
								value={transactionType}
								onChange={(e) =>
									setTransactionType(e.target.value)
								}>
								<option value='purchase'>
									Purchase (Khareedi)
								</option>
								<option value='sale'>Sale (Bechi)</option>
							</select>
						</div>
						<div className='col-md-3'>
							<label className='form-label fw-bold'>Item</label>
							<select
								className='form-select'
								value={item}
								onChange={(e) => setItem(e.target.value)}>
								<option value=''>Select Item</option>
								{items.map((itm, i) => (
									<option
										key={i}
										value={itm.name || itm}>
										{itm.name || itm}
									</option>
								))}
								<option value='custom'>+ Add New Item</option>
							</select>
						</div>

						{item === 'custom' && (
							<div className='col-md-3'>
								<label className='form-label fw-bold'>
									New Item
								</label>
								<div className='input-group'>
									<input
										type='text'
										className='form-control'
										value={newItem}
										onChange={(e) =>
											setNewItem(e.target.value)
										}
										placeholder='Enter new item'
									/>
									<Button
										variant='success'
										onClick={handleAddNewItem}>
										Add
									</Button>
								</div>
							</div>
						)}

						<div className='col-md-3'>
							<label className='form-label fw-bold'>
								Person Name
							</label>
							<input
								type='text'
								className='form-control'
								value={person}
								onChange={(e) => setPerson(e.target.value)}
							/>
						</div>

						<div className='col-md-3'>
							<label className='form-label fw-bold'>
								Rate (PKR)
							</label>
							<input
								type='number'
								className='form-control'
								value={rate}
								onChange={(e) => setRate(e.target.value)}
							/>
						</div>

						<div className='col-md-3'>
							<label className='form-label fw-bold'>
								Quantity
							</label>
							<div className='input-group'>
								<input
									type='number'
									className='form-control'
									value={quantity}
									onChange={(e) =>
										setQuantity(e.target.value)
									}
								/>
								<select
									className='form-select'
									value={unit}
									onChange={(e) => setUnit(e.target.value)}>
									<option value='bori'>Bori</option>
									<option value='kg'>kg</option>
								</select>
							</div>
						</div>

						<div className='col-md-3'>
							<label className='form-label fw-bold'>
								Contact No
							</label>
							<input
								type='text'
								className='form-control'
								value={contact}
								onChange={(e) => setContact(e.target.value)}
							/>
						</div>

						<div className='col-md-3'>
							<label className='form-label fw-bold'>
								Warehouse
							</label>
							<select
								className='form-select'
								value={selectedWarehouse}
								onChange={(e) =>
									setSelectedWarehouse(e.target.value)
								}>
								<option value=''>Select Warehouse</option>
								{warehouses.map((wh, idx) => (
									<option
										key={idx}
										value={wh.name || wh}>
										{wh.name || wh}
									</option>
								))}
								<option value='custom'>
									+ Add New Warehouse
								</option>
							</select>
							{selectedWarehouse === 'custom' && (
								<div className='input-group mt-2'>
									<input
										type='text'
										className='form-control'
										placeholder='Enter New Warehouse'
										value={newWarehouse}
										onChange={(e) =>
											setNewWarehouse(e.target.value)
										}
									/>
									<Button
										variant='success'
										onClick={handleAddNewWarehouse}>
										Add
									</Button>
								</div>
							)}
						</div>

						<div className='col-md-3 d-flex align-items-end'>
							<Button
								className='w-100'
								variant='success'
								onClick={handleAdd}>
								Add Transaction
							</Button>
						</div>
					</div>
				</div>
			</Card>

			<div className='container my-3'>
				<h5>Search</h5>
				<div className='row justify-content-start'>
					<div className='col-12 col-md-8 col-lg-6'>
						<div className='d-flex flex-column flex-md-row gap-2 mb-3'>
							{/* Person Name Input */}
							<input
								type='text'
								className='form-control'
								placeholder='Search by Person Name'
								value={name}
								onChange={(e) => setName(e.target.value)}
							/>
							{/* Date Input */}
							<input
								type='date'
								className='form-control'
								value={date}
								onChange={(e) => setDate(e.target.value)}
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Display Transactions by Date */}
			{Object.keys(filteredTransactions)
				.sort((a, b) => {
					// Split "DD/MM/YYYY"
					const [dayA, monthA, yearA] = a.split('/').map(Number)
					const [dayB, monthB, yearB] = b.split('/').map(Number)

					// Convert to proper Date objects
					const dateA = new Date(yearA, monthA - 1, dayA)
					const dateB = new Date(yearB, monthB - 1, dayB)

					return dateB - dateA // 🔑 newest first
				})
				.map((date, idx) => {
					const summary = calculateSummary(filteredTransaction[date])
					const transactionsForDate = filteredTransactions[date] || []

					return (
						<div
							key={idx}
							className='mb-5'>
							<h3 className='fw-bold text-center my-3'>
								📅 Roznamcha for {date}
							</h3>
							<Card className='shadow border-0'>
								<div className='card-body p-0'>
									{/* Large screen: Full table */}
									<div className='d-none d-md-block'>
										<table className='table table-bordered table-hover mb-0'>
											<thead className='table-light'>
												<tr>
													<th>#</th>
													<th>Item</th>
													<th>Type</th>
													<th>Person</th>
													<th>Quantity</th>
													<th>Rate</th>
													<th>Total</th>
													<th>Contact</th>
													<th>Warehouse</th>
												</tr>
											</thead>
											<tbody>
												{transactionsForDate.map(
													(t, index) => {
														return (
															<tr
																key={t.id}
																className={
																	name &&
																	(
																		t.person ||
																		''
																	)
																		.toLowerCase()
																		.includes(
																			name.toLowerCase()
																		)
																		? 'table-primary'
																		: ''
																}>
																<td className='fw-bold'>
																	{index + 1}.
																</td>
																<td>
																	{t.item ||
																		''}
																</td>
																<td
																	className={
																		t.transactionType ===
																		'purchase'
																			? 'text-success'
																			: 'text-danger'
																	}>
																	{t.transactionType ===
																	'purchase'
																		? 'Khareedi'
																		: 'Bechi'}
																</td>
																<td>
																	{t.person ||
																		''}
																</td>
																<td>
																	{`${
																		(t.unit ||
																			'') ===
																		'kg'
																			? (
																					(parseFloat(
																						t.quantity
																					) ||
																						0) /
																					100
																			  ).toFixed(
																					2
																			  )
																			: (
																					parseFloat(
																						t.quantity
																					) ||
																					0
																			  ).toFixed(
																					2
																			  )
																	} Bori (${
																		(t.unit ||
																			'') ===
																		'kg'
																			? (
																					parseFloat(
																						t.quantity
																					) ||
																					0
																			  ).toFixed(
																					2
																			  )
																			: (
																					(parseFloat(
																						t.quantity
																					) ||
																						0) *
																					100
																			  ).toFixed(
																					2
																			  )
																	} kg)`}
																</td>

																<td>
																	PKR{' '}
																	{(
																		parseFloat(
																			t.rate
																		) || 0
																	).toFixed(
																		2
																	)}
																</td>

																<td>
																	PKR{' '}
																	{(
																		parseFloat(
																			t.total
																		) || 0
																	).toFixed(
																		2
																	)}
																</td>

																<td>
																	{t.contact ||
																		''}
																</td>
																<td>
																	{t.warehouse ||
																		''}
																</td>
															</tr>
														)
													}
												)}
												<tr className='fw-bold table-secondary'>
													<td colSpan='2'>Summary</td>
													<td colSpan='2'>
														Purchase: PKR{' '}
														{(
															summary.purchased ||
															0
														).toFixed(2)}
													</td>
													<td colSpan='2'>
														Sale: PKR{' '}
														{(
															summary.sold || 0
														).toFixed(2)}
													</td>
													<td colSpan='3'>
														Balance: PKR{' '}
														{(
															openingBalance || 0
														).toFixed(2)}
													</td>
												</tr>
											</tbody>
										</table>
									</div>

									{/* Small screen: 3-column grid layout (Item, Type/Total, Person/Warehouse) */}
									<div className='d-md-none'>
										<div className='row g-5'>
											{transactionsForDate.map(
												(t, index) => (
													<div
														key={t.id}
														className='col-12 col-sm-6 col-md-4 mb-2 fw-bolder'>
														<div className='card h-100 border'>
															<div className='card-body p-2'>
																<div className='row g-1'>
																	<div className='col-12'>
																		<span>
																			ID:{' '}
																		</span>
																		<small className='fw-bold text-dark'>
																			#
																			{index +
																				1}
																		</small>
																	</div>
																	<div className='col-12'>
																		<strong>
																			{t.item ||
																				''}
																		</strong>
																	</div>
																	<div className='col-6 g-2'>
																		<span>
																			Type:{' '}
																		</span>
																		<span
																			className={`badge ${
																				t.transactionType ===
																				'purchase'
																					? 'bg-success'
																					: 'bg-danger'
																			}`}>
																			{t.transactionType ===
																			'purchase'
																				? 'Khareedi'
																				: 'Bechi'}
																		</span>
																	</div>

																	<div className='col-6 text-end'>
																		<strong>
																			PKR
																			:{' '}
																			{(
																				parseFloat(
																					t.total
																				) ||
																				0
																			).toFixed(
																				2
																			)}
																		</strong>
																	</div>

																	<div className='col-12'>
																		<span className='text-dark fw-bold'>
																			Name
																		</span>
																		:{' '}
																		<small className='text-muted fw-bold'>
																			{t.person ||
																				''}
																			<hr></hr>{' '}
																			<br></br>
																			<span className='text-dark fw-bold'>
																				WearHouse
																			</span>
																			:{' '}
																			{t.warehouse ||
																				''}
																		</small>
																		<hr></hr>
																	</div>
																	<div className='col-12'>
																		<small className='text-muted fw-bold'>
																			<span className='text-dark fw-bold'>
																				{' '}
																				Qty:
																			</span>{' '}
																			{(t.unit ||
																				'') ===
																			'kg'
																				? (
																						(parseFloat(
																							t.quantity
																						) ||
																							0) /
																						100
																				  ).toFixed(
																						2
																				  )
																				: (
																						parseFloat(
																							t.quantity
																						) ||
																						0
																				  ).toFixed(
																						2
																				  )}{' '}
																			Bori
																			(
																			{(t.unit ||
																				'') ===
																			'kg'
																				? (
																						parseFloat(
																							t.quantity
																						) ||
																						0
																				  ).toFixed(
																						2
																				  )
																				: (
																						(parseFloat(
																							t.quantity
																						) ||
																							0) *
																						100
																				  ).toFixed(
																						2
																				  )}{' '}
																			kg)
																			<br></br>{' '}
																			<span className='text-dark fw-bold'>
																				{' '}
																				Rate:
																			</span>{' '}
																			PKR{' '}
																			{(
																				parseFloat(
																					t.rate
																				) ||
																				0
																			).toFixed(
																				2
																			)}{' '}
																			<br></br>
																			<span className='text-dark fw-bold'>
																				{' '}
																				Contact:{' '}
																			</span>{' '}
																			{t.contact ||
																				'NA'}
																		</small>
																	</div>
																</div>
															</div>
														</div>
													</div>
												)
											)}
											{transactionsForDate.length > 0 && (
												<div className='col-12'>
													<div className='card border-secondary'>
														<div className='card-body p-2 bg-light'>
															<div className='row'>
																<div className='col-6'>
																	<small className='fw-bold'>
																		Purchase:
																		PKR{' '}
																		{(
																			summary.purchased ||
																			0
																		).toFixed(
																			2
																		)}
																	</small>
																</div>
																<div className='col-6 text-end'>
																	<small className='fw-bold'>
																		Sale:
																		PKR{' '}
																		{(
																			summary.sold ||
																			0
																		).toFixed(
																			2
																		)}
																	</small>
																</div>
																<div className='col-12 text-center mt-1'>
																	<strong className='text-primary'>
																		Balance:
																		PKR{' '}
																		{(
																			openingBalance ||
																			0
																		).toFixed(
																			2
																		)}
																	</strong>
																</div>
															</div>
														</div>
													</div>
												</div>
											)}
										</div>
									</div>
								</div>
							</Card>
						</div>
					)
				})}
		</div>
	)
}

export default Roznamcha
