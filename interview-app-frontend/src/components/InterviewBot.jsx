
import React, { useState, useEffect, useRef } from "react";
import "./InterviewBot.css";

const API_ENDPOINT = import.meta.env.REACT_APP_GEMINI_API_KEY || "http://localhost:5000/api/interview-chat";
const INITIAL_BOT_MESSAGE = "Welcome!! To start the interview simulation, please tell me the job title you are applying for.";
const FIRST_QUESTION = "Tell me about yourself.";

function InterviewBot() {
    const [jobTitle, setJobTitle] = useState("");
    const [hasJobTitle, setHasJobTitle] = useState(false);
    const [messages, setMessages] = useState([{ role: "bot", text: INITIAL_BOT_MESSAGE }]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (input) setError(null);
    }, [input]);

    const handleJobTitleSubmit = (e) => {
        e.preventDefault();
        const trimmedJobTitle = input.trim();
        if (!trimmedJobTitle) return;

        setJobTitle(trimmedJobTitle);
        setHasJobTitle(true);
        setMessages((prev) => [
            ...prev,
            { role: "bot", text: `Okay, let's start the interview for the ${trimmedJobTitle} role.` },
            { role: "bot", text: FIRST_QUESTION },
        ]);
        setInput("");
    };

    const handleSendAnswer = (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading || isComplete) return;

        const userAnswer = input.trim();
        setMessages((prev) => [...prev, { role: "user", text: userAnswer }]);
        setInput("");
        getBotResponse([...messages, { role: "user", text: userAnswer }]);
    };

    const getBotResponse = async (currentMessages) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(API_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobTitle, messages: currentMessages }),
            });

            if (!response.ok) {
                const responseBody = await response.json();
                setError(responseBody?.error || `API request failed (${response.status} ${response.statusText})`);
                return;
            }

            const responseBody = await response.json();
            setMessages((prev) => [...prev, { role: "bot", text: responseBody.nextBotMessage }]);
            setIsComplete(responseBody.isComplete);
        } catch (err) {
            console.error("API call failed:", err);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessage = (msg, index) => (
        <div key={index} className={`message ${msg.role === "user" ? "user-message" : "bot-message"}`}>
            {msg.text.split("\n").map((line, i) => (
                <span key={i}>
                    {line}
                    <br />
                </span>
            ))}
        </div>
    );

    const renderInputForm = () => {
        if (isComplete) {
            return <p className="completion-message">Interview completed. Thank you for your time!</p>;
        }

        const inputProps = {
            type: "text",
            value: input,
            onChange: (e) => setInput(e.target.value),
            disabled: isLoading,
            autoComplete: "off",
        };

        const buttonProps = {
            type: "submit",
            disabled: isLoading || !input.trim(),
        };

        if (!hasJobTitle) {
            return (
                <form onSubmit={handleJobTitleSubmit} className="input-form">
                    <input {...inputProps} placeholder="Enter job title to begin..." aria-label="Job Title Input" />
                    <button {...buttonProps}>Start Interview</button>
                </form>
            );
        }

        return (
            <form onSubmit={handleSendAnswer} className="input-form">
                <input {...inputProps} placeholder="Type your answer..." aria-label="User Answer Input" />
                <button {...buttonProps}>{isLoading ? "Thinking..." : "Send"}</button>
            </form>
        );
    };

    return (
        <div className="interview-bot">
            <div className="messages-container">
                {messages.map(renderMessage)}
                {isLoading && <div className="message bot-message typing-indicator"><span>.</span><span>.</span><span>.</span></div>}
                {error && <div className="message error-message">{error}</div>}
                <div ref={messagesEndRef} />
            </div>
            {renderInputForm()}
        </div>
    );
}

export default InterviewBot;