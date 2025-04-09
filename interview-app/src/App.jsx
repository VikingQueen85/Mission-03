
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import InterviewBot from './components/InterviewBot'; // Adjust the import path as necessary

function App() {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/chat">Chat</Link>
      </nav>
    <Routes> {/* No need to wrap with Router as it's done in index.js */}
      <Route path="/" element={<h1>Hello World</h1>} />
      <Route path="/chat" element={<InterviewBot />} />
    </Routes>
    </div>
  );
}

export default App;