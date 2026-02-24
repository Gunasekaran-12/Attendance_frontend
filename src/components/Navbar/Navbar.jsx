import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../../services/api';

const Navbar = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    Rural School Attendance
                </Link>
            </div>
            <div className="navbar-links">
                <Link to="/">Home</Link>
                {token ? (
                    <>
                        <Link to="/dashboard">Dashboard</Link>
                        <Link to="/attendance">Mark Attendance</Link>
                        <Link to="/report">Reports</Link>
                        <span style={{ marginLeft: '20px', fontSize: '0.9rem' }}>Welcome, {user.name}</span>
                        <button onClick={handleLogout} style={{ marginLeft: '20px', padding: '5px 10px' }}>Logout</button>
                    </>
                ) : (
                    <Link to="/login">Login</Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
