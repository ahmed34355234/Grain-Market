import React, { createContext, useState, useEffect } from 'react'

export const ProductContext = createContext()

export const ProductProvider = ({ children }) => {
	const BORISIZE = 100 // 1 bori = 100 kg

	// Load from localStorage or default
	const [products, setProducts] = useState(() => {
		const saved = localStorage.getItem('products')
		return saved ? JSON.parse(saved) : []
	})

	const [inventory, setInventory] = useState(() => {
		const saved = localStorage.getItem('inventory')
		return saved ? JSON.parse(saved) : []
	})

	const [khatas, setKhatas] = useState(() => {
		const saved = localStorage.getItem('khatas')
		return saved ? JSON.parse(saved) : []
	})

	// Sync to localStorage whenever state changes
	useEffect(() => {
		localStorage.setItem('products', JSON.stringify(products))
	}, [products])

	useEffect(() => {
		localStorage.setItem('inventory', JSON.stringify(inventory))
	}, [inventory])

	useEffect(() => {
		localStorage.setItem('khatas', JSON.stringify(khatas))
	}, [khatas])

	useEffect(() => {
		const user = localStorage.getItem('currentUser')
		const userId = user ? JSON.parse(user).id : null

		if (!userId) {
			setKhatas([])
			localStorage.removeItem(`khatas_${userId}`)
			return
		}

		const saved = localStorage.getItem(`khatas_${userId}`)
		if (saved) {
			setKhatas(JSON.parse(saved))
		} else {
			setKhatas([])
		}
	}, [localStorage.getItem('currentUser')])
	// ----------------- Roznamcha / Inventory functions -----------------
	const addProduct = (product) => {
		const newProducts = [...products, product]
		setProducts(newProducts)

		let quantityKg = 0
		let quantityBori = 0
		console.log(22, product)

		if (product.unit === 'kg') {
			quantityKg = product.quantity
			quantityBori = product.quantity / BORISIZE
		} else if (product.unit === 'bori') {
			quantityBori = product.quantity
			quantityKg = product.quantity * BORISIZE
		}

		const purchaseDetail = {
			person: product.person,
			rate: product.rate,
			quantity: product.quantity,
			unit: product.unit,
			contact: product.contact,
			total: product.total,
			quantityKg,
			quantityBori,
		}

		const existingItem = inventory.find((i) => i.name === product.item)

		if (existingItem) {
			const updatedItem = {
				...existingItem,
				quantityKg: existingItem.quantityKg + quantityKg,
				quantityBori: existingItem.quantityBori + quantityBori,
				totalPurchase:
					(existingItem.totalPurchase || 0) + product.total,
				purchases: [...existingItem.purchases, purchaseDetail],
			}
			setInventory(
				inventory.map((i) =>
					i.name === product.item ? updatedItem : i
				)
			)
		} else {
			setInventory([
				...inventory,
				{
					name: product.item,
					quantityKg,
					quantityBori,
					totalPurchase: product.total,
					purchases: [purchaseDetail],
				},
			])
		}
	}

	const updateProduct = (id, updatedProduct) => {
		const oldProduct = products.find((p) => p.id === id)
		if (!oldProduct) return

		const newProducts = products.map((p) =>
			p.id === id ? updatedProduct : p
		)
		setProducts(newProducts)

		const oldQtyKg =
			oldProduct.unit === 'kg'
				? oldProduct.quantity
				: oldProduct.quantity * BORISIZE
		const oldQtyBori =
			oldProduct.unit === 'bori'
				? oldProduct.quantity
				: oldProduct.quantity / BORISIZE

		const newQtyKg =
			updatedProduct.unit === 'kg'
				? updatedProduct.quantity
				: updatedProduct.quantity * BORISIZE
		const newQtyBori =
			updatedProduct.unit === 'bori'
				? updatedProduct.quantity
				: updatedProduct.quantity / BORISIZE

		setInventory(
			inventory.map((item) => {
				if (item.name === updatedProduct.item) {
					const updatedPurchases = item.purchases.map((p) => {
						if (
							p.person === oldProduct.person &&
							p.contact === oldProduct.contact &&
							p.rate === oldProduct.rate &&
							p.quantity === oldProduct.quantity
						) {
							return {
								person: updatedProduct.person,
								rate: updatedProduct.rate,
								quantity: updatedProduct.quantity,
								unit: updatedProduct.unit,
								contact: updatedProduct.contact,
								total: updatedProduct.total,
								quantityKg: newQtyKg,
								quantityBori: newQtyBori,
							}
						}
						return p
					})

					const totalKg = updatedPurchases.reduce(
						(sum, p) => sum + p.quantityKg,
						0
					)
					const totalBori = updatedPurchases.reduce(
						(sum, p) => sum + p.quantityBori,
						0
					)
					const totalPurchase = updatedPurchases.reduce(
						(sum, p) => sum + p.total,
						0
					)

					return {
						...item,
						purchases: updatedPurchases,
						quantityKg: totalKg,
						quantityBori: totalBori,
						totalPurchase,
					}
				}
				return item
			})
		)
	}

	const deleteProduct = (id) => {
		const productToDelete = products.find((p) => p.id === id)
		if (!productToDelete) return

		setProducts(products.filter((p) => p.id !== id))

		setInventory(
			inventory
				.map((item) => {
					if (item.name === productToDelete.item) {
						const updatedPurchases = item.purchases.filter(
							(p) =>
								!(
									p.person === productToDelete.person &&
									p.contact === productToDelete.contact &&
									p.rate === productToDelete.rate &&
									p.quantity === productToDelete.quantity
								)
						)
						const totalKg = updatedPurchases.reduce(
							(sum, p) => sum + p.quantityKg,
							0
						)
						const totalBori = updatedPurchases.reduce(
							(sum, p) => sum + p.quantityBori,
							0
						)
						const totalPurchase = updatedPurchases.reduce(
							(sum, p) => sum + p.total,
							0
						)

						return {
							...item,
							purchases: updatedPurchases,
							quantityKg: totalKg,
							quantityBori: totalBori,
							totalPurchase,
						}
					}
					return item
				})
				.filter((i) => i.purchases.length > 0)
		)
	}

	// ----------------- Khata functions (بغیر ledger) -----------------
	const addKhata = (khata) => {
		const user = JSON.parse(localStorage.getItem('currentUser') || '{}')
		const newKhata = {
			...khata,
			khataNumber: khata.khataNumber || `KH-${Date.now()}`,
			name: khata.name || 'Unknown',
			entries: [],
			userId: user.id,
		}
		setKhatas([...khatas, newKhata])
	}

	const updateKhata = (khataNumber, entry) => {
		setKhatas(
			khatas.map((khata) =>
				khata.khataNumber === khataNumber
					? { ...khata, entries: [...(khata.entries || []), entry] }
					: khata
			)
		)
	}

	const deleteKhata = (id) => {
		setKhatas(khatas.filter((k) => k.id !== id))
	}

	// ----------------- Dashboard Calculations -----------------
	const getTotalTrades = () => khatas.length
	const getTotalBuyers = () => khatas.filter((k) => k.role === 'Buyer').length
	const getTotalSellers = () =>
		khatas.filter((k) => k.role === 'Seller').length
	const getTotalCommission = () =>
		khatas.reduce(
			(sum, k) => sum + (k.pricePerBag || 0) * (k.amount || 0),
			0
		)

	return (
		<ProductContext.Provider
			value={{
				products,
				inventory,
				setProducts,
				khatas,
				setKhatas,
				addProduct,
				updateProduct,
				deleteProduct,
				addKhata,
				updateKhata,
				deleteKhata,
				getTotalTrades,
				getTotalBuyers,
				getTotalSellers,
				getTotalCommission,
			}}>
			{children}
		</ProductContext.Provider>
	)
}
