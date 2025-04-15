import React, { useState, useEffect, useRef } from "react"
import "./InterviewBot.css"

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT;
const INITIAL_BOT_MESSAGE = `Welcome!! To start the interview simulation, please tell me the job title you are applying for.`
const SECOND_BOT_MESSAGE = `Okay, let's start the interview for the role: `

const InterviewBot = () => {
  /*========== HOOKS ==========*/
  const messagesEndRef = useRef(null)

  /*========== STATES==========*/
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState(null)
  const [hasJobTitle, setHasJobTitle] = useState(false)
  const [jobTitle, setJobTitle] = useState("")
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([
    { role: "bot", text: INITIAL_BOT_MESSAGE },
  ]) // Initial message to be displayed before starting the interview

  /*========== FUNCTIONS ==========*/

  // This function handles the submission of the job title input
  const handleJobTitleSubmit = e => {
    e.preventDefault()

    // Trim and capitalize the job title
    const trimmedJobTitle = input
      .trim()
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

    if (!trimmedJobTitle) return

    setJobTitle(trimmedJobTitle)

    setHasJobTitle(true)

    setMessages(prev => [
      ...prev,
      {
        role: "bot",
        text: SECOND_BOT_MESSAGE + trimmedJobTitle,
      },
    ]) // Second bot message to be displayed with the job title
    setInput("")

    // Send EMPTY messages array to backend for first question generation: "Tell me about yourself"
    getBotResponse(trimmedJobTitle, [])
  }

  // This function handles the submission of the user answer input
  const handleSendAnswer = e => {
    e.preventDefault()

    if (!input.trim() || isLoading || isComplete) return

    const userAnswer = input.trim()

    setMessages(prev => [...prev, { role: "user", text: userAnswer }])

    setInput("")

    // Send the job title and the current messages to the backend
    getBotResponse(jobTitle, [...messages, { role: "user", text: userAnswer }])
  }

  // This function fetches the bot response from the backend API
  const getBotResponse = async (jobTitle, currentMessages) => {
    setIsLoading(true)

    setError(null)

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, messages: currentMessages }),
      })

      const responseBody = await response.json()

      if (!response.ok) {
        setError(
          responseBody?.error ||
            `API request failed (${response.status} ${response.statusText})`
        )
        return
      }

      setMessages(prev => [
        ...prev,
        { role: "bot", text: responseBody.nextBotMessage },
      ])

      setIsComplete(responseBody.isComplete)
    } catch (err) {
      console.error("API call failed:", err)

      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // This function renders each message in the chat
  const renderMessage = (msg, index) => (
    <div
      key={index}
      className={`message ${
        msg.role === "user" ? "user-message" : "bot-message"
      }`}>
      {msg.text.split("\n").map((line, i) => (
        <span key={i}>
          {line}
          <br />
        </span>
      ))}
    </div>
  )

  // This function renders the input form for the user to enter their answer
  const renderInputForm = () => {
    // If the interview is complete, show a completion message
    if (isComplete) {
      return (
        <p className="completion-message">
          Interview completed. Thank you for your time!
        </p>
      )
    }

    // Input Properties
    const inputProps = {
      type: "text",
      value: input,
      onChange: e => setInput(e.target.value),
      disabled: isLoading,
      autoComplete: "off",
    }

    // Button properties
    const buttonProps = {
      type: "submit",
      disabled: isLoading || !input.trim(),
    }

    //  If the user hasn't entered a job title yet, show the job title input form
    if (!hasJobTitle) {
      return (
        <form onSubmit={handleJobTitleSubmit} className="input-form">
          <input
            {...inputProps}
            placeholder="Enter job title to begin..."
            aria-label="Job Title Input"
          />
          <button {...buttonProps}>Start Interview</button>
        </form>
      )
    }

    return (
      // If the user has entered a job title, show the answer input form
      <form onSubmit={handleSendAnswer} className="input-form">
        <input
          {...inputProps}
          placeholder="Type your answer..."
          aria-label="User Answer Input"
        />
        <button {...buttonProps}>{isLoading ? "Thinking..." : "Send"}</button>
      </form>
    )
  }

  /*========== useEffects ==========*/

  // Automatic scrolling to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Clear error message when input changes
  useEffect(() => {
    if (input) setError(null)
  }, [input])

  return (
    <div className="interview-bot">
      <div className="messages-container">
        {messages.map(renderMessage)}
        {isLoading && (
          <div className="message bot-message typing-indicator">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </div>
        )}
        {error && <div className="message error-message">{error}</div>}
        <div ref={messagesEndRef} />
      </div>
      {renderInputForm()}
    </div>
  )
}

export default InterviewBot
