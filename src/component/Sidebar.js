import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';
import { BiGridAlt } from "react-icons/bi";


import { FiBook, FiBox, FiFolder, FiList, FiBarChart2, FiLogIn } from "react-icons/fi";




const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);



    return (
        <>
            {/* Sidebar for large screens */ }
            <div className="bg-success text-white vh-100 p-3 d-none d-lg-block  sidebar" style={ { width: '250px', position: "sticky", top: "0" } }>
                <h2 className="mb-4">Zrai~trade</h2>
                <ul className="nav flex-column fw-semibold">
                    <li className="nav-item ">
                        <NavLink className="nav-link text-white d-flex align-items-center" to="/" onClick={ () => setIsOpen(false) }>
                            < BiGridAlt className='me-1 fs-5 ' /> Dashboard</NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink className="nav-link text-white d-flex align-items-center" to="/roznamcha" onClick={ () => setIsOpen(false) }>
                            <FiBook className='me-2 fs-5' /> Roznamcha</NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink className="nav-link text-white d-flex align-items-center" to="/inventory" onClick={ () => setIsOpen(false) }><FiBox className='me-2 fs-5' />Inventory</NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink className="nav-link text-white d-flex align-items-center" to="/khata-management" onClick={ () => setIsOpen(false) }>
                            <FiFolder className='me-2 fs-5' />  Khata Management</NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink className="nav-link text-white d-flex align-items-center" to="/all-khata" onClick={ () => setIsOpen(false) }><FiList className='me-2 fs-5' /> All Khatas</NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink className="nav-link text-white d-flex align-items-center" to="/reports" onClick={ () => setIsOpen(false) }> <FiBarChart2 className='me-2 fs-5' />Reports</NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink className="nav-link text-white d-flex align-items-center" to="/login" onClick={ () => setIsOpen(false) }><FiLogIn className='me-2 fs-5' />Login</NavLink>
                    </li>
                </ul>
            </div>

            {/* Header for small screens */ }
            <header className="bg-success text-white p-3 d-lg-none d-block fixed-top mb-5">
                <div className="d-flex justify-content-between align-items-center fw-bold ">
                    <h2 className="m-0">Zrai~trade</h2>
                    <button
                        className="btn btn-secondary"
                        onClick={ () => setIsOpen(!isOpen) }
                    >
                        <span> <FaBars /></span>
                    </button>
                </div>
            </header>

            {/* Menu for small screens */ }
            { isOpen && (
                <div
                    className=" d-lg-none position-fixed vh-100 pt-4  transition-menu"
                    style={ {
                        zIndex: 1000,
                        top: "4rem",
                        right: 0, // right side se
                        width: window.innerWidth >= 768 ? "50%" : "100%", // tablet pe 50%, mobile pe 100%

                    } }
                >
                    <ul className="nav flex-column  fs-3 fw-medium">
                        <li className="nav-item">
                            <NavLink className="nav-link text-white" to="/" onClick={ () => setIsOpen(false) }>Dashboard</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link text-white" to="/roznamcha" onClick={ () => setIsOpen(false) }>Roznamcha</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link text-white" to="/inventory" onClick={ () => setIsOpen(false) }>Inventory</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link text-white" to="/khata-management" onClick={ () => setIsOpen(false) }>Khata Management</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link text-white" to="/all-khata" onClick={ () => setIsOpen(false) }>All Khatas</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link text-white" to="/reports" onClick={ () => setIsOpen(false) }>Reports</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link text-white" to="/login" onClick={ () => setIsOpen(false) }>Login</NavLink>
                        </li>
                    </ul>
                </div>
            ) }


        </>
    );
};

export default Sidebar;
