const interviewService = require("../services/interviewService")

const startInterview = async (req, res) => {
  const { jobTitle, messages } = req.body

  // Validate required fields
  if (!jobTitle || typeof jobTitle !== "string" || jobTitle.trim() === "") {
    return res.status(400).json({ error: "Valid job title is required." })
  }

  // Ensure messages is an array (empty for first call)
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages must be an array." })
  }

  console.log("Received job title:", jobTitle)
  console.log("Messages count:", messages.length)

  try {
    // Generate the initial question or next question based on conversation
    const initialQuestion = await interviewService.generateInitialQuestion(
      jobTitle
    )

    // Create a session if this is a new conversation
    if (messages.length === 0) {
      const sessionId = interviewService.createSession(jobTitle)

      // Store the initial question in conversation history
      interviewService.conversationHistory[sessionId].push({
        role: "bot",
        text: initialQuestion,
      })
    }

    // Return the response
    res.json({
      nextBotMessage: initialQuestion,
      isComplete: false, // First question is never the end of interview
    })
  } catch (error) {
    console.error("Error in interview process:", error)
    res.status(500).json({ error: error.message || "Internal server error" })
  }
}

module.exports = { startInterview }
