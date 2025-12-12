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
		const saved = localStorage.getItem('currentUser')
		try {
			return saved ? JSON.parse(saved) : null
		} catch {
			return null
		}
	})

	useEffect(() => {
		const handleStorageChange = (event) => {
			if (event.key === 'currentUser') {
				try {
					setCurrentUser(event.newValue ? JSON.parse(event.newValue) : null)
				} catch {
					setCurrentUser(null)
				}
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

	// Password Strength Checker - Component ke bahar ya andar top pe rakho
	const checkPasswordStrength = (password) => {
		if (!password) return { score: 0, label: '', color: '', suggestions: [] }

		let score = 0
		const suggestions = []

		if (password.length >= 8) score += 1
		else suggestions.push('8+ characters')

		if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
		else suggestions.push('Upper & lowercase')

		if (/\d/.test(password)) score += 1
		else suggestions.push('At least one number')

		if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1
		else suggestions.push('Special character')

		if (password.length >= 12) score += 1

		const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
		const colors = ['danger', 'danger', 'warning', 'info', 'success']

		return {
			score,
			label: labels[score] || 'Strong',
			color: colors[score] || 'success',
			suggestions
		}
	}

	const handleSubmit = async (e) => {
		e.preventDefault()
		setError('')
		setSuccess('')

		try {
			if (isForgot) {
				if (!code) {
					const response = await axios.post(`${apiUrl}/forgot-password`, { email })
					setSuccess(response.data.msg || 'Code sent!')
					showToast('Reset code sent to email')
				} else {
					const response = await axios.post(`${apiUrl}/verify-code`, { email, code })
					if (!response.data.token || !response.data.user) {
						setError('Invalid code!')
						return
					}
					const { token, user } = response.data
					localStorage.setItem('userId', user.id)
					localStorage.setItem('userName', user.name)
					showToast('Login successful!')
					setTimeout(() => navigate('/'), 1000)
				}
			}
			else if (isLogin) {
				const response = await axios.post(`${apiUrl}/login`, { email, password })

				if (response.data?.msg === 'Invalid credentials') {
					setError('Invalid Email or Password!')
					return
				}

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
			else {
				// SIGNUP - Strong Password Force Karo
				const strength = checkPasswordStrength(password)
				if (strength.score < 3) {
					setError('Password too weak! Use stronger password.')
					return
				}

				const response = await axios.post(`${apiUrl}/register`, {
					name,
					email,
					password,
					role: 'user'
				})

				setSuccess('Signup successful! Now login.')
				showToast('Account created!')
				setIsLogin(true)
				setName('')
				setEmail('')
				setPassword('')
			}
		} catch (err) {
			setError(err.response?.data?.msg || 'Something went wrong!')
		}
	}

	const handleLogout = () => {
		localStorage.clear()
		showToast('Logged out!')
		navigate('/login')
	}

	const isAuthenticated = () => !!localStorage.getItem('token')

	return (
		<div className='container d-flex justify-content-center align-items-center min-vh-100'>
			<div className='card p-4 shadow-lg' style={{ maxWidth: '420px', width: '100%' }}>
				{/* Toasts */}
				<div className='position-fixed top-0 end-0 p-3' style={{ zIndex: 9999 }}>
					{toasts.map((t) => (
						<div key={t.id} className='alert alert-success alert-dismissible fade show'>
							{t.msg}
						</div>
					))}
				</div>

				{isAuthenticated() ? (
					<>
						<h2 className='text-center mb-4'>Welcome {currentUser?.name}</h2>
						<p className='text-center text-success'>Apka karobar apki khushi</p>
						<button className='btn btn-danger w-100' onClick={handleLogout}>
							Logout
						</button>
					</>
				) : (
					<>
						<h2 className='text-center mb-4'>
							{isForgot ? 'Reset Password' : isLogin ? 'Login' : 'Signup'}
						</h2>

						<form onSubmit={handleSubmit}>
							{!isLogin && !isForgot && (
								<div className='mb-3'>
									<label className='form-label'>Shop Name</label>
									<input
										type='text'
										className='form-control'
										value={name}
										onChange={(e) => setName(e.target.value)}
										required
										placeholder='Your business name'
									/>
								</div>
							)}

							<div className='mb-3'>
								<label className='form-label'>Email</label>
								<input
									type='email'
									className='form-control'
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									placeholder='email@example.com'
								/>
							</div>

							{!isForgot && (
								<>
									<div className='mb-3'>
										<label className='form-label'>Password</label>
										<input
											type='password'
											className='form-control'
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											required
											placeholder='Strong password'
										/>
									</div>

									{/* Password Strength - Sirf Signup ya Login pe dikhao */}
									{password && !isLogin && (
										<div className='mb-3 p-3 bg-light rounded'>
											<small>Strength: </small>
											<strong className={`text-${checkPasswordStrength(password).color}`}>
												{checkPasswordStrength(password).label}
											</strong>
											<div className='progress mt-2' style={{ height: '8px' }}>
												<div
													className={`progress-bar bg-${checkPasswordStrength(password).color}`}
													style={{ width: `${(checkPasswordStrength(password).score / 5) * 100}%` }}
												/>
											</div>
											{checkPasswordStrength(password).suggestions.length > 0 && (
												<small className='text-muted d-block mt-2'>
													Improve: {checkPasswordStrength(password).suggestions.join(', ')}
												</small>
											)}
										</div>
									)}
								</>
							)}

							{isForgot && code && (
								<div className='mb-3'>
									<label className='form-label'>6-Digit Code</label>
									<input
										type='text'
										className='form-control text-center'
										value={code}
										onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
										maxLength={6}
										placeholder='000000'
										style={{ letterSpacing: '10px', fontSize: '24px' }}
									/>
								</div>
							)}

							{error && <div className='alert alert-danger'>{error}</div>}
							{success && <div className='alert alert-success'>{success}</div>}

							<button type='submit' className='btn btn-primary w-100'>
								{isForgot ? (code ? 'Verify & Login' : 'Send Code') : isLogin ? 'Login' : 'Create Account'}
							</button>
						</form>

						<div className='text-center mt-3'>
							{!isForgot && (
								<button className='btn btn-link' onClick={() => { setIsForgot(true); setError(''); }}>
									Forgot Password?
								</button>
							)}
							{isForgot && (
								<button className='btn btn-link' onClick={() => setIsForgot(false)}>
									Back to Login
								</button>
							)}
						</div>

						{!isForgot && (
							<p className='text-center mt-3'>
								{isLogin ? "Don't have account?" : "Already have account?"}{' '}
								<button className='btn btn-link p-0' onClick={() => { setIsLogin(!isLogin); setError(''); setPassword(''); }}>
									{isLogin ? 'Signup' : 'Login'}
								</button>
							</p>
						)}
					</>
				)}
			</div>
		</div>
	)
}

export default Login
