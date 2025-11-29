// src/components/Inventory.js
import React, { useContext } from "react";
import { ProductContext } from "../component/ProductContext";

const ShowInventory = () => {
    const { inventory } = useContext(ProductContext);

    return (
        <div>

            { inventory.length === 0 ? (
                <p>No stock available</p>
            ) : (
                inventory.map((item, index) => {


                    return (
                        <div key={ index } className="mb-5 p-3 border rounded bg-light">

                            {/* Roznamcha / Purchases */ }
                            { item.purchases && item.purchases.length > 0 && (
                                <div className="mt-3">
                                    <h5>📒 Roznamcha (Purchase Details)</h5>
                                    <table className="table table-bordered text-center mt-2">
                                        <thead className="table-secondary">
                                            <tr>
                                                <th>Person</th>
                                                <th>Rate (PKR)</th>
                                                <th>Quantity</th>
                                                <th>Unit</th>
                                                <th>Contact</th>
                                                <th>Total (PKR)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            { item.purchases.map((p, i) => (
                                                <tr key={ i }>
                                                    <td>{ p.person }</td>
                                                    <td>{ p.rate }</td>
                                                    <td>{ p.quantity }</td>
                                                    <td>{ p.unit }</td>
                                                    <td>{ p.contact }</td>
                                                    <td>{ p.total?.toFixed(2) }</td>
                                                </tr>
                                            )) }
                                        </tbody>
                                    </table>
                                </div>
                            ) }
                            <table className="table table-striped text-center">
                                <tr>
                                    <th>Total Purchase (PKR)</th>
                                    <th>
                                        { item.totalPurchase?.toFixed(2) }  PKR
                                    </th>
                                </tr>
                            </table>
                        </div>
                    )
                })
            ) }
        </div>
    );
};

export default ShowInventory;
