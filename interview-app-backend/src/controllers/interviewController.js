//========== IMPORTS ==========//
const interviewService = require("../services/geminiService")

const chatInterview = async (req, res) => {
  const { jobTitle, messages } = req.body

  // Input validations
  if (!jobTitle || typeof jobTitle !== "string" || jobTitle.trim() === "") {
    return res.status(400).json({ error: "Valid job title is required." })
  }

  // Ensure messages is an array (empty for first call)
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages must be an array." })
  }

  try {
    console.log(`Controller received chat request for job: "${jobTitle}"`)
    const result = await interviewService.processInterviewTurn(
      jobTitle,
      messages
    )

    res.status(200).json(result)
  } catch (error) {
    console.error("Error in interview controller:", error.message)

    if (error.isSafetyBlock) {
      return res.status(400).json({
        error: "Request or response blocked due to safety settings.",
        details: error.message,
      })
    }

    // General server error
    res.status(500).json({
      error:
        error.message ||
        "An internal server error occurred while processing the interview chat.",
    })
  }
}

module.exports = { chatInterview }
