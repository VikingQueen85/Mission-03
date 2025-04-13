
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { FaHome, FaComment } from 'react-icons/fa'; // react-icons
import InterviewBot from './components/InterviewBot'; // Adjust the import path as necessary
import './App.css';

function App() {

  return (
    <div className="app-container">
      {/* 헤더 영역 */}
      <header className="app-header">
        <img
          src="https://content.tgstatic.co.nz/webassets/contentassets/3e15c8546917474ca0a150b18e9fd64e/turnerscars_logo_1line_horz_true-rgb-desktop.png"
          alt="Turners Logo"
          className="logo"
        />
      </header>

      {/* 네비게이션 버튼 */}
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


  {/* // return (
  //     <div>
  //     <nav>
  //       <div className="button-container">
  //         <Link to="/" className="button">
  //           <FaHome style={{ marginRight: '0.5rem' }} />
  //           Home
  //         </Link>
  //         <Link to="/chat" className="button">
  //           <FaComment style={{ marginRight: '0.5rem' }} />
  //           Chat
  //         </Link>
  //       </div>
  //     </nav> */}


<Routes>
        <Route
          path="/"
          element={
            <div className="home-content">
              <h2>Welcome to the Turners Interview Practice Tool</h2>
              <p>
                Use this tool to prepare for internal job opportunities as part of your retraining journey.
                <br />
                Click on <strong>Chat</strong> to begin a mock interview powered by AI.
              </p>
            </div>
          }
        />
        <Route path="/chat" element={<InterviewBot />} />
      </Routes>
    </div>
  );
}

export default App;