
import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { FaHome, FaComment } from 'react-icons/fa';
import InterviewBot from './components/InterviewBot';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <header className="app-header">
          <img
            src="https://content.tgstatic.co.nz/webassets/contentassets/3e15c8546917474ca0a150b18e9fd64e/turnerscars_logo_1line_horz_true-rgb-desktop.png"
            alt="Turners Logo"
            className="logo"
          />
        </header>
        <nav className="nav-bar">
          <div className="button-container">
            <Link to="/" className="nav-button">
              <FaHome style={{ marginRight: '0.5rem' }} />
              Home
            </Link>
            <Link to="/chat" className="nav-button">
              <FaComment style={{ marginRight: '0.5rem' }} />
              Chat
            </Link>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<div className="home-content">...</div>} />
          <Route path="/chat" element={<InterviewBot />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;