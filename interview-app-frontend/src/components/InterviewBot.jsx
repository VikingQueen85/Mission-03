
import React, { useState, useEffect, useRef } from "react";
import './InterviewBot.css';

// Configure API endpoint URL
const API_ENDPOINT = import.meta.env.REACT_APP_GEMINI_API_KEY || "http://localhost:5000/api/interview-chat";

const INITIAL_BOT_MESSAGE = "Welcome! To start the interview simulation, please tell me the job title you are applying for.";
const FIRST_QUESTION = "Tell me about yourself."; 

function InterviewBot() {
  const [jobTitle, setJobTitle] = useState("");
  const [hasJobTitle, setHasJobTitle] = useState(false);
  const [messages, setMessages] = useState([{ role: 'bot', text: INITIAL_BOT_MESSAGE }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [errorState, setErrorState] = useState(null); 
  const messagesEndRef = useRef(null); 

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clear error when user starts typing again
  useEffect(() => {
      if (input) setErrorState(null);
  }, [input]);

  // Function to handle API call
  const getBotResponse = async (currentMessages) => {
    setIsLoading(true);
    setErrorState(null); 
    try {
        console.log("Sending to API:", { jobTitle, messages: currentMessages });
        const response = await fetch(API_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobTitle: jobTitle, messages: currentMessages }), 
      });

      const responseBody = await response.json(); 

      if (!response.ok) {
        console.error("API Error Response:", responseBody);
        throw new Error(responseBody?.error || `API request failed (${response.status} ${response.statusText})`);
      }

      console.log("Received from API:", responseBody);

      // Add bot's response to messages
      setMessages(prevMessages => [...prevMessages, { role: 'bot', text: responseBody.nextBotMessage }]);

      // Check if the interview is now complete
      if (responseBody.isComplete) {
        setIsComplete(true);
      }

    } catch (error) {
      console.error("API call processing failed: ", error);
      const errorMessage = error.message || "An unexpected error occurred. Please try again.";

      setErrorState(errorMessage); 
    } finally {
      setIsLoading(false);
    }
  };

  // Handle initial job title submission
  const handleJobTitleSubmit = (e) => {
    e.preventDefault();
    const trimmedJobTitle = input.trim();
    if (!trimmedJobTitle) return; 

    setJobTitle(trimmedJobTitle);
    setHasJobTitle(true);
    setMessages(prev => [
        ...prev,
        { role: 'bot', text: `Okay, let's start the interview for the ${trimmedJobTitle} role.` },
        { role: 'bot', text: FIRST_QUESTION } 
    ]);
    setInput(""); 
    setErrorState(null); 
  };

  // Handle sending a user's answer
  const handleSendAnswer = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isComplete) return;

    const userAnswer = input.trim();

    const updatedMessages = [...messages, { role: 'user', text: userAnswer }];

    setMessages(updatedMessages); 
    setInput(""); 
    setErrorState(null); 

    // Call API to get the next bot response 
    getBotResponse(updatedMessages);
  };

  const renderInputArea = () => {
    if (isComplete) {
      return <p className="completion-message">Interview completed. Thank you for your time!</p>;
    }
    if (!hasJobTitle) {
      return (
        <form onSubmit={handleJobTitleSubmit} className="input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter job title to begin..."
            disabled={isLoading}
            aria-label="Job Title Input"
            autoComplete="off"
          />
          <button type="submit" disabled={isLoading || !input.trim()}>
            Start Interview
          </button>
        </form>
      );
    }
    // If job title is set and interview not complete, show answer input
    return (
      <form onSubmit={handleSendAnswer} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your answer..."
          disabled={isLoading}
          aria-label="User Answer Input"
          autoComplete="off"
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? "Thinking..." : "Send"}
        </button>
      </form>
    );
  };

  return (
    <div className="interview-bot">
      <div className="messages-container">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role === 'user' ? 'user-message' : 'bot-message'}`}>
            {msg.text.split('\n').map((line, i) => (
              <span key={i}>{line}<br/></span>
            ))}
          </div>
        ))}
          {isLoading && <div className="message bot-message typing-indicator"><span>.</span><span>.</span><span>.</span></div>}
          {errorState && <div className="message error-message">{errorState}</div>}
        <div ref={messagesEndRef} />
      </div>
      {renderInputArea()}
    </div>
  );
}

export default InterviewBot;