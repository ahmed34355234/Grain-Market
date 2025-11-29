import React, { useContext, useState, useEffect } from 'react'
import { ProductContext } from '../component/ProductContext'
import { AddKhatas } from '../service'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const KhataManagement = () => {
	const context = useContext(ProductContext)
	const khatas = context?.khatas || []
	const setKhatas = context?.setKhatas

	// Separate states for Add & Update
	const [addName, setAddName] = useState('')
	const [addKhataNumber, setAddKhataNumber] = useState('')

	const [updateKhataNumber, setUpdateKhataNumber] = useState('')
	const [updateAmount, setUpdateAmount] = useState('')
	const [updateType, setUpdateType] = useState('credit')

	const getCurrentUser = () => {
		const user = localStorage.getItem('currentUser')
		return user ? JSON.parse(user) : null
	}

	const isLoggedIn = () => !!getCurrentUser()

	// Fetch khatas on login
	useEffect(() => {
		const user = getCurrentUser()
		if (user) {
			fetchKhatasFromAPI(user.id)
		}
	}, [])

	const fetchKhatasFromAPI = async (userId) => {
		try {
			const res = await AddKhatas.getAllKhata(userId)
			if (res.data?.khatas) {
				setKhatas(res.data.khatas)
			}
		} catch (err) {
			console.warn('Failed to fetch khatas:', err)
		}
	}

	// ============= ADD KHATA =============
	const handleAddKhata = async (e) => {
		e.preventDefault()
		const user = getCurrentUser()
		if (!user) return toast.error('Please login!')

		if (!addName.trim() || !addKhataNumber.trim()) {
			return toast.error('Name aur Khata Number required!')
		}

		const exists = khatas.some(
			(k) => String(k.khataNumber) === String(addKhataNumber)
		)
		if (exists)
			return toast.error('Ye khata number already exist karta hai!')

		try {
			const res = await AddKhatas.addKhata({
				name: addName,
				khataNumber: addKhataNumber,
				user_id: user.id,
			})
			if (res.success) {
				const savedKhata = res.data?.khata
				setKhatas((prev) => [...prev, savedKhata])

				toast.success('Naya Khata Add Ho Gaya!')
				setAddName('')
				setAddKhataNumber('') // Clear only Add fields
			} else {
				console.log(res)
			}
		} catch (err) {
			toast.error(err.response?.data?.message || 'Add failed!')
		}
	}

	// ============= UPDATE KHATA =============

	const handleUpdateKhata = async (e) => {
		e.preventDefault()
		const user = getCurrentUser()
		if (!user) return toast.error('Please login!')

		if (!updateKhataNumber.trim() || !updateAmount) {
			return toast.error('Khata Number aur Amount required!')
		}

		// SAFE FIND: Prevent crash if k is null/undefined
		// const found = khatas.find(
		// 	(k) => k && String(k.khataNumber) === String(updateKhataNumber)
		// )

		// if (!found) {
		// 	return toast.error('Khata number not found!')
		// }

		const amt = parseFloat(updateAmount)
		if (isNaN(amt) || amt <= 0) return toast.error('Valid amount required!')

		try {
			const res = await AddKhatas.updateKhata({
				khataNumber: updateKhataNumber,
				amount: amt,
				type: updateType === 'debit' ? 'taken' : 'given',
				userId: user.id,
			})

			console.log('Update API Response:', res)

			// res is { message, khata: { ... } }
			const updatedKhata = res?.khata
			if (!updatedKhata?.khataNumber) {
				throw new Error('Invalid response from server')
			}

			// Update context safely
			setKhatas((prev) =>
				prev.map((k) =>
					k && k.khataNumber === updatedKhata.khataNumber
						? { ...k, balance: updatedKhata.balance }
						: k
				)
			)

			toast.success('Khata Update Ho Gaya!')
			toast.info(
				`${amt} PKR ${updateType === 'credit' ? 'Diye' : 'Liye'}!`
			)
			setUpdateAmount('')
		} catch (err) {
			console.error('Update Failed:', err)
			toast.error(err.message || 'Update failed!')
		}
	}
	return (
		<div className='container my-5'>
			<h3
				className='my-lg-2'
				style={{ marginTop: '5rem' }}>
				Khata Management
			</h3>

			{/* ========== ADD NEW KHATA ========== */}
			<div className='card mb-4 p-3'>
				<h4>Add New Khata</h4>
				<form onSubmit={handleAddKhata}>
					{!isLoggedIn() && (
						<div className='alert alert-warning'>
							Please login to add khata.
						</div>
					)}

					<div className='mb-3'>
						<label>Name</label>
						<input
							type='text'
							className='form-control'
							value={addName}
							onChange={(e) => setAddName(e.target.value)}
							disabled={!isLoggedIn()}
							placeholder='Enter name'
						/>
					</div>

					<div className='mb-3'>
						<label>Khata Number</label>
						<input
							type='text'
							className='form-control'
							value={addKhataNumber}
							onChange={(e) => setAddKhataNumber(e.target.value)}
							disabled={!isLoggedIn()}
							placeholder='Enter khata number'
						/>
					</div>

					<button
						type='submit'
						className='btn btn-success'
						disabled={!isLoggedIn()}>
						Add Khata
					</button>
				</form>
			</div>

			{/* ========== UPDATE KHATA ========== */}
			<div className='card p-3'>
				<h4>Update Khata</h4>
				<form onSubmit={handleUpdateKhata}>
					{!isLoggedIn() && (
						<div className='alert alert-warning'>
							Please login to update khata.
						</div>
					)}

					<div className='mb-3'>
						<label>Khata Number</label>
						<input
							type='text'
							className='form-control'
							value={updateKhataNumber}
							onChange={(e) =>
								setUpdateKhataNumber(e.target.value)
							}
							disabled={!isLoggedIn()}
							placeholder='Enter khata number to update'
						/>
					</div>

					<div className='mb-3'>
						<label>Amount</label>
						<input
							type='number'
							className='form-control'
							value={updateAmount}
							onChange={(e) => setUpdateAmount(e.target.value)}
							disabled={!isLoggedIn()}
							placeholder='Enter amount'
						/>
					</div>

					<div className='mb-3'>
						<label>Type</label>
						<select
							className='form-control'
							value={updateType}
							onChange={(e) => setUpdateType(e.target.value)}
							disabled={!isLoggedIn()}>
							<option value='credit'>Credit (Diya)</option>
							<option value='debit'>Debit (Liye)</option>
						</select>
					</div>

					<button
						type='submit'
						className='btn btn-primary'
						disabled={!isLoggedIn()}>
						Update Khata
					</button>
				</form>
			</div>

			<ToastContainer />
		</div>
	)
}

export default KhataManagement
