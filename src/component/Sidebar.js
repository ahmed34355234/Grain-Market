import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaBars, FaStar } from 'react-icons/fa';
import { BiGridAlt } from "react-icons/bi";
import { FiBook, FiBox, FiFolder, FiList, FiBarChart2, FiMail, FiHeart } from "react-icons/fi";

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);

    const handleRating = (value) => {
        setRating(value);
        alert(`Shukriya! Aapne ${value} stars diye`);
    };

    // Yeh rating component alag banaya taake dono jagah use kar sakein
    const RatingSection = () => (
        <div className="text-center border-top border-light pt-4 mt-auto">
            <p className="mb-3 fw-bold small">Rate Zrai~trade</p>
            <div className="d-flex justify-content-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                        key={star}
                        size={26}
                        className="cursor-pointer"
                        color={(hovered || rating) >= star ? "#FFD700" : "#e4e5e9"}
                        style={{ 
                            filter: (hovered || rating) >= star ? "drop-shadow(0 0 10px gold)" : "",
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => handleRating(star)}
                    />
                ))}
            </div>
            <p className="small opacity-75 mb-3">Pasand aa raha hai app?</p>
            <a href="mailto:ab1338484@gmail.com" className="btn btn-outline-light btn-sm w-100 mb-2">
                Contact Developer
            </a>
            <p className="small opacity-50 mt-3">
                Made with <FiHeart className="text-danger" style={{display: 'inline'}} /> in Pakistan
            </p>
        </div>
    );

    return (
        <>
            {/* ================== DESKTOP SIDEBAR ================== */}
            <div className="bg-success text-white vh-100 d-none d-lg-flex flex-column" style={{ width: '280px', position: 'sticky', top: 0 }}>
                <div className="p-4">
                    <h2 className="text-center fw-bold mb-5">Zrai~trade</h2>
                    <ul className="nav flex-column fw-semibold gap-2">
                        <li><NavLink to="/" className="nav-link text-white py-3 px-4 rounded d-flex align-items-center" activeClassName="bg-white text-success"><BiGridAlt className="me-3" /> Dashboard</NavLink></li>
                        <li><NavLink to="/roznamcha" className="nav-link text-white py-3 px-4 rounded d-flex align-items-center" activeClassName="bg-white text-success"><FiBook className="me-3" /> Roznamcha</NavLink></li>
                        <li><NavLink to="/inventory" className="nav-link text-white py-3 px-4 rounded d-flex align-items-center" activeClassName="bg-white text-success"><FiBox className="me-3" /> Inventory</NavLink></li>
                        <li><NavLink to="/khata-management" className="nav-link text-white py-3 px-4 rounded d-flex align-items-center" activeClassName="bg-white text-success"><FiFolder className="me-3" /> Khata Management</NavLink></li>
                        <li><NavLink to="/all-khata" className="nav-link text-white py-3 px-4 rounded d-flex align-items-center" activeClassName="bg-white text-success"><FiList className="me-3" /> All Khatas</NavLink></li>
                        <li><NavLink to="/reports" className="nav-link text-white py-3 px-4 rounded d-flex align-items-center" activeClassName="bg-white text-success"><FiBarChart2 className="me-3" /> Reports</NavLink></li>
                    </ul>
                </div>

                {/* Rating Section - Desktop (neeche fixed) */}
                <div className="p-4 border-top border-light">
                    <RatingSection />
                </div>
            </div>

            {/* ================== MOBILE HEADER ================== */}
            <header className="bg-success text-white p-3 d-lg-none fixed-top shadow-sm">
                <div className="d-flex justify-content-between align-items-center">
                    <h4 className="m-0 fw-bold">Zrai~trade</h4>
                    <button className="btn btn-light" onClick={() => setIsOpen(!isOpen)}>
                        <FaBars size={22} />
                    </button>
                </div>
            </header>

            {/* ================== MOBILE MENU (Sliding from Right) ================== */}
            {isOpen && (
                <div className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-50 z-50" onClick={() => setIsOpen(false)}>
                    <div 
                        className="bg-success text-white h-100 p-4 d-flex flex-column"
                        style={{ width: '300px', maxWidth: '85%', boxShadow: '-5px 0 15px rgba(0,0,0,0.3)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-center mb-5">Menu</h3>
                        <ul className="nav flex-column flex-grow-1">
                            <li className="mb-3"><NavLink to="/" onClick={() => setIsOpen(false)} className="text-white fs-5">Dashboard</NavLink></li>
                            <li className="mb-3"><NavLink to="/roznamcha" onClick={() => setIsOpen(false)} className="text-white fs-5">Roznamcha</NavLink></li>
                            <li className="mb-3"><NavLink to="/inventory" onClick={() => setIsOpen(false)} className="text-white fs-5">Inventory</NavLink></li>
                            <li className="mb-3"><NavLink to="/khata-management" onClick={() => setIsOpen(false)} className="text-white fs-5">Khata Management</NavLink></li>
                            <li className="mb-3"><NavLink to="/all-khata" onClick={() => setIsOpen(false)} className="text-white fs-5">All Khatas</NavLink></li>
                            <li className="mb-3"><NavLink to="/reports" onClick={() => setIsOpen(false)} className="text-white fs-5">Reports</NavLink></li>
                        </ul>

                        {/* Rating Section - Mobile  */}
                        <div className="border-top border-light pt-4">
                            <RatingSection />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Sidebar;
