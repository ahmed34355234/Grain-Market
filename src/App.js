// src/App.js
import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import Sidebar from './component/Sidebar'
import Dashboard from './component/Dashboard '
import Inventory from './component/Inventory'
import AllKhatas from './component/AllKhatas'
import Reports from './component/Reports'
import Roznamcha from './component/Roznamcha'
import { ProductProvider } from './component/ProductContext'
import KhataManagement from './component/KhataManagement'
import KhataHistory from './component/KhataHistory'
import Login from './component/login'

function App() {
	return (
		<ProductProvider>
			<Router>
				<div className='d-flex'>
					<Sidebar />
					<div className='flex-grow-1 p-3'>
						<Routes>
							<Route
								path='/'
								element={<Dashboard />}
							/>

							<Route
								path='/inventory'
								element={<Inventory />}
							/>
							<Route
								path='/All-khata'
								element={<AllKhatas />}
							/>
							<Route
								path='/reports'
								element={<Reports />}
							/>
							<Route
								path='/roznamcha'
								element={<Roznamcha />}
							/>
							<Route
								path='/khata-management'
								element={<KhataManagement />}
							/>
							<Route
								path='/khata-history/:khataNumber'
								element={<KhataHistory />}
							/>
							<Route
								path='/login'
								element={<Login />}
							/>
						</Routes>
					</div>
				</div>
			</Router>
		</ProductProvider>
	)
}

export default App
