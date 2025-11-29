import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import 'bootstrap/dist/css/bootstrap.min.css'
import { v4 as uuidv4 } from 'uuid'

const Login = () => {
	const [isLogin, setIsLogin] = useState(true)
	const [isForgot, setIsForgot] = useState(false)
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [name, setName] = useState('')
	const [code, setCode] = useState('')
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	const [toasts, setToasts] = useState([])
	const navigate = useNavigate()
	const [currentUser, setCurrentUser] = useState(() => {
		return JSON.parse(localStorage.getItem('currentUser'))
	})

	useEffect(() => {
		function handleStorageChange(event) {
			if (event.key === 'currentUser') {
				setCurrentUser(JSON.parse(event.newValue))
			}
		}
		window.addEventListener('storage', handleStorageChange)
		return () => window.removeEventListener('storage', handleStorageChange)
	}, [])

	const apiUrl = 'https://azearn.com/api'

	const showToast = (msg) => {
		const id = uuidv4()
		setToasts((prev) => [...prev, { id, msg }])
		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id))
		}, 5000)
	}

	const handleSubmit = async (e) => {
		e.preventDefault()
		setError('')
		setSuccess('')

		try {
			// FORGOT PASSWORD FLOW
			if (isForgot) {
				// Step 1: send reset code
				if (!code) {
					const response = await axios.post(
						`${apiUrl}/forgot-password`,
						{
							email,
						}
					)
					setSuccess(response.data.msg)
					showToast('Reset code sent to your email.')
				} else {
					// Step 2: verify code & login
					const response = await axios.post(`${apiUrl}/verify-code`, {
						email,
						code,
					})
					const { token, user } = response.data

					localStorage.setItem('token', token)
					localStorage.setItem('currentUser', JSON.stringify(user))
					localStorage.setItem('userId', user.id)
					localStorage.setItem('userName', user.name)

					showToast('Login successful!')
					setTimeout(() => navigate('/'), 1000)
				}
			}

			// LOGIN FLOW
			else if (isLogin) {
				const response = await axios.post(`${apiUrl}/login`, {
					email,
					password,
				})
				console.log(response)

				const { token, user } = response.data

				localStorage.setItem('token', token)
				localStorage.setItem('currentUser', JSON.stringify(user))
				localStorage.setItem('userId', user.id)
				localStorage.setItem('userName', user.name)

				showToast('Login successful!')
				setEmail('')
				setPassword('')

				setTimeout(() => navigate('/'), 1000)
			}

			// SIGNUP FLOW
			else {
				const response = await axios.post(`${apiUrl}/register`, {
					name,
					email,
					password,
					role: 'user',
				})

				if (response.data && response.data.user) {
					setSuccess('Signup successful! Please login.')
				} else {
					setSuccess('Signup request received! Please login.')
				}

				setIsLogin(true)
				setName('')
				setEmail('')
				setPassword('')
			}
		} catch (err) {
			// FIXED: show friendly message
			if (isLogin) {
				setError('Email or Password does not match.')
			} else {
				setError(err.response?.data?.msg || 'Something went wrong.')
			}
		}
	}

	const handleLogout = () => {
		localStorage.removeItem('token')
		localStorage.removeItem('currentUser')
		localStorage.removeItem('userId')
		localStorage.removeItem('userName')
		showToast('Logout successful!')
		navigate('/login')
	}

	const isAuthenticated = () => !!localStorage.getItem('token')

	return (
		<div className='container d-flex justify-content-center align-items-center min-vh-100'>
			<div
				className='card p-4 shadow-lg'
				style={{ maxWidth: '400px', width: '100%' }}>
				{/* Toast popup UI */}
				<div className='toast-container position-fixed top-0 end-0 p-3'>
					{toasts.map((t) => (
						<div
							key={t.id}
							className='floating-toast'>
							{t.msg}
						</div>
					))}
				</div>

				{isAuthenticated() ? (
					<>
						<h2 className='text-center mb-4'>
							Welcome 😊 {currentUser?.name}
						</h2>
						<p className='text-center text-success mb-4'>
							Apka karobar apki kushali
						</p>
						<button
							className='btn btn-danger w-100'
							onClick={handleLogout}>
							Logout
						</button>
					</>
				) : (
					<>
						<h2 className='text-center mb-4'>
							{isForgot
								? 'Forgot Password'
								: isLogin
								? 'Login'
								: 'Signup'}
						</h2>

						<form onSubmit={handleSubmit}>
							{/* Signup Name Field */}
							{!isLogin && !isForgot && (
								<div className='mb-3'>
									<label
										htmlFor='name'
										className='form-label'>
										Name
									</label>
									<input
										type='text'
										className='form-control'
										id='name'
										value={name}
										onChange={(e) =>
											setName(e.target.value)
										}
										required
										placeholder='Enter your Shop name'
									/>
								</div>
							)}

							{/* Email Field */}
							<div className='mb-3'>
								<label
									htmlFor='email'
									className='form-label'>
									Email
								</label>
								<input
									type='email'
									className='form-control'
									id='email'
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									placeholder='Enter your email'
								/>
							</div>

							{/* Password Field (Hide if forgot password) */}
							{!isForgot && (
								<div className='mb-3'>
									<label
										htmlFor='password'
										className='form-label'>
										Password
									</label>
									<input
										type='password'
										className='form-control'
										id='password'
										value={password}
										onChange={(e) =>
											setPassword(e.target.value)
										}
										required
										placeholder='Enter your password'
									/>
								</div>
							)}

							{/* Verification Code */}
							{isForgot && (
								<div className='mb-3'>
									<label
										htmlFor='code'
										className='form-label'>
										Verification Code
									</label>
									<input
										type='text'
										className='form-control'
										id='code'
										value={code}
										onChange={(e) =>
											setCode(e.target.value)
										}
										placeholder='Enter the 6-digit code'
										maxLength={6}
										style={{
											letterSpacing: '5px',
											textAlign: 'center',
											fontSize: '20px',
										}}
									/>
								</div>
							)}

							{/* Error & Success Messages */}
							{error && (
								<div className='alert alert-danger'>
									{error}
								</div>
							)}
							{success && (
								<div className='alert alert-success'>
									{success}
								</div>
							)}

							{/* Button */}
							<button
								type='submit'
								className='btn btn-primary w-100 mb-3'>
								{isForgot
									? code
										? 'Verify & Login'
										: 'Send Code'
									: isLogin
									? 'Login'
									: 'Signup'}
							</button>
						</form>

						{/* Forgot Password Link */}
						{!isForgot && (
							<p className='text-center'>
								<button
									className='btn btn-link p-0'
									onClick={() => {
										setIsForgot(true)
										setError('')
										setSuccess('')
									}}>
									Forgot Password?
								</button>
							</p>
						)}

						{/* Switch Login / Signup */}
						<p className='text-center'>
							{isForgot ? (
								<button
									className='btn btn-link p-0'
									onClick={() => setIsForgot(false)}>
									Back to Login
								</button>
							) : (
								<>
									{isLogin
										? "Don't have an account?"
										: 'Already have an account?'}{' '}
									<button
										className='btn btn-link p-0'
										onClick={() => {
											setIsLogin(!isLogin)
											setError('')
											setSuccess('')
										}}>
										{isLogin ? 'Signup' : 'Login'}
									</button>
								</>
							)}
						</p>
					</>
				)}
			</div>
		</div>
	)
}

export default Login
