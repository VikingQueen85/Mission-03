
import React, { useState } from "react"; 
import axios from "axios";
import './InterviewBot.css'; 

function InterviewBot() {
  const [messages, setMessages] = useState([{ text: "Welcome! What job are you applying for?", isUser: false }]);
  const [input, setInput] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);  // State to control the welcome message
  const [showCompletionMessage, setShowCompletionMessage] = useState(false); // Initially hidden
  const [showMessages, setShowMessages] = useState(false); // Hide message box initially


  const keywordQuestionsMapping = {
    developer: [
      "What programming languages are you most proficient in?",
      "How do you approach debugging and troubleshooting?",
      "Can you describe a challenging project you've worked on?",
    ],
    manager: [
      "How do you handle team conflicts?",
      "Can you describe your management style?",
      "What steps do you take to ensure project completion?",
    ],
    designer: [
      "What design tools do you prefer to use?",
      "How do you approach user experience design?",
      "Can you share a portfolio piece that showcases your design skills?",
    ],
    nursing: [
      "What inspired you to become a nurse?",
      "How do you handle stress while caring for patients?",
      "Describe a situation where you had to advocate for a patient.",
    ],
    // Add more keywords and questions as needed
  };

  const generateQuestions = (jobTitle) => {
    const lowerJobTitle = jobTitle.toLowerCase();
    const questions = [];

    // Gather specific questions based on the job title
    for (const [keyword, keywordQuestions] of Object.entries(keywordQuestionsMapping)) {
      if (lowerJobTitle.includes(keyword)) {
        questions.push(...keywordQuestions);
      }
    }

    // If there are not enough questions, add generic ones until we have 6
    while (questions.length < 6) {
      questions.push("What makes you a good fit for this position?");
      questions.push("Tell me about a time you faced a challenge at work.");
    }

    // Limit to 6 unique questions to avoid duplicates
    return questions.slice(0, 6);
  };

  const generateQuestionsWithApi = async (jobTitle) => {
    const openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY;
    const apiEndpoint = "https://api.openai.com/v1/engines/davinci/completions";

    const prompt = `Generate five interview questions for the job title "${jobTitle}".`;

    try {
      const response = await axios.post(apiEndpoint, {
        prompt: prompt,
        max_tokens: 150,
        n: 1,
        stop: null,
        temperature: 0.7,
      }, {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const generatedQuestions = response.data.choices[0].text.trim().split('\n');
      return generatedQuestions.slice(0, 6); // Limit to 6 questions from the API
    } catch (error) {
      console.error("API call failed: ", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: "Failed to generate questions from the API. Please try again.", isUser: false },
      ]);
      return [];
    }
  };

/************************************************************************* */


  const handleJobTitleSubmit = async () => {
    const trimmedJobTitle = jobTitle.trim();

    if (!trimmedJobTitle) {
      alert("Please enter a job title.");
      return;
    }

    const normalizedJobTitle = trimmedJobTitle.charAt(0).toUpperCase() + trimmedJobTitle.slice(1).toLowerCase();

    // Generate initial questions from predefined mapping
    let generatedQuestions = generateQuestions(normalizedJobTitle);

    // Call the API if we didn't get any questions
    if (generatedQuestions.length === 0) {
      setLoading(true);
      try {
        generatedQuestions = await generateQuestionsWithApi(normalizedJobTitle);
      } finally {
        setLoading(false);
      }
    }

    // Update messages to indicate the job title
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: `You are applying for: ${normalizedJobTitle}`, isUser: false },
    ]);

    setQuestions(generatedQuestions);
    setQuestionCount(0);
    setJobTitle("");

      
        setShowWelcomeMessage(false);    // Hide welcome message and start interview
        setShowCompletionMessage(false); // Hide completion message
        setShowMessages(true);           // Show message box after starting interview
        // Ask first question
        askNextQuestion(generatedQuestions);
      };

      const askNextQuestion = (questionsList) => {
        if (questionCount < questionsList.length) {
          const nextQuestion = questionsList[questionCount];
          setMessages((prevMessages) => [
            ...prevMessages,
            { text: nextQuestion, isUser: false }
          ]);
          setQuestionCount((prevCount) => prevCount + 1);
        }
      };

/************************************************************************* */

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prevMessages) => [...prevMessages, { text: userMessage, isUser: true }]);
    setInput("");

    const isLastQuestion = questionCount === questions.length;

    if (isLastQuestion) {
      setTimeout(() => {
        setShowCompletionMessage(true);
      }, 300); 
      return;
    }

    // // Send answer and move to the next question
    // if (questionCount === questions.length) {
    //   setTimeout(() => {
    //     const finalMessage = "Interview completed. Thank you for your time!";
    //     setMessages((prevMessages) => [
    //       ...prevMessages,
    //       { text: finalMessage, isUser: false },
    //     ]);
    //     setShowCompletionMessage(true);
    //   }, 300); 
    //   return;
    // }
  
    askNextQuestion(questions);
  };

  // Moved to CSS :)
  // const renderMessage = (msg, index) => {
  //   const messageStyle = {
  //     padding: "10px",
  //     margin: "5px 0",
  //     borderRadius: "5px",
  //     color: msg.isUser ? "black" : "white",
  //     backgroundColor: msg.isUser ? "#e0f7fa" : "#333",
  //     textAlign: msg.isUser ? "right" : "left",
  //   };

  //   return (
  //     <div key={index} style={messageStyle}>
  //       {msg.text}
  //     </div>
  //   );
  // };


  return (
    <div className="interview-bot">
      <h2>AI Interview Bot</h2>

   {/* Welcome message and job title input */}
   {showWelcomeMessage && (
        <div>
          <div>Welcome! What job are you applying for?</div>
          <div className="job-input-container">
            <input
              id="job-title"
              name="job-title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Enter job title"
              autoComplete="off"
            />
            <button onClick={handleJobTitleSubmit} disabled={loading}>
              {loading ? "Loading..." : "Start Interview"}
            </button>
          </div>
        </div>
      )}

      {/* Message box for conversation */}
      {showMessages && (
      <div className="message-box">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.isUser ? "user-message" : "bot-message"}`}
          >
            {msg.text}
          </div>
        ))}
      </div>
    )}


      {/* User input box and send button */}
      {questionCount > 0 && questionCount <= questions.length && !showCompletionMessage && (
  <>
    <input
      id="user-response"
      name="user-response"
      className="styled-input"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      placeholder="Your answer"
    />
    <button onClick={handleSend}>
      Send
    </button>
  </>
)}


      {/* Interview completion message */}
      {showMessages && showCompletionMessage && (
  <p>Interview completed. Thank you for your time!</p>
)}
    </div>
  );
}

export default InterviewBot;