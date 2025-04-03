
import { useState } from "react";
import { OpenAI } from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

function InterviewBot() {
  const [messages, setMessages] = useState(["Welcome!! What job are you applying for??"]);
  const [input, setInput] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Function to fetch next question from OpenAI
  const getNextQuestion = async (answer) => {
    if (questionCount >= 6) {
      // End interview after 6 questions
      return "Thank you for your time!! We will review your responses.";
    }

    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: `You are a professional job interviewer. Ask relevant follow-up questions for the role of ${jobTitle}. Tailor your questions based on the candidate's previous answer.` },
          { role: "user", content: `Candidate's previous answer: "${answer}". What is the next best question to ask?` },
        ],
      });

      setLoading(false);
      return response.choices[0].message.content;
    } catch (error) {
      console.error("Error fetching AI question:", error);
      setLoading(false);
      return "Tell me about a challenge you've faced in your career."; 
    }
  };

  // Function to start interview when job title is submitted
  const handleJobTitleSubmit = () => {
    if (!jobTitle.trim()) return;

    const newMessages = [...messages, `You are applying for the ${jobTitle} role.`];
    newMessages.push(`Bot: Tell me about yourself.`);
    setMessages(newMessages);
    setQuestionCount(1);
    setInput("");
  };

  // Function to handle user input and send it to the AI
  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, `You: ${input}`];
    const nextQuestion = await getNextQuestion(input);
    newMessages.push(`Bot: ${nextQuestion}`);

    setMessages(newMessages);
    setInput("");
    setQuestionCount((prev) => prev + 1);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
      <h2>AI Interview Bot</h2>

      {/* Job Title Input */}
      {questionCount === 0 && (
        <div>
          <input
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            style={{ width: "100%", marginTop: "10px" }}
            placeholder="Enter job title"
          />
          <button onClick={handleJobTitleSubmit} style={{ marginTop: "10px" }}>
            Start Interview
          </button>
        </div>
      )}

      {/* Display interview messages */}
      {questionCount > 0 && (
        <div style={{ border: "1px solid black", padding: "10px", minHeight: "200px" }}>
          {messages.map((msg, index) => (
            <p key={index}>{msg}</p>
          ))}
        </div>
      )}

      {/* Input and send button for responses */}
      {questionCount > 0 && questionCount < 6 && (
        <>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ width: "100%", marginTop: "10px" }}
            placeholder="Your answer"
          />
          <button onClick={handleSend} style={{ marginTop: "10px" }} disabled={loading}>
            {loading ? "Thinking..." : "Send"}
          </button>
        </>
      )}

      {/* End of interview */}
      {questionCount >= 6 && <p>Interview completed. Thank you for your time!</p>}
    </div>
  );
}

export default InterviewBot;
