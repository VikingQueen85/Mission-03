
const interviewService = require("../services/interviewService");

const startInterview = async (req, res) => {
    const { jobTitle } = req.body;

    try {
        const initialQuestion = await interviewService.generateInitialQuestion(jobTitle);
        const sessionId = interviewService.createSession(jobTitle);

        interviewService.conversationHistory[sessionId].push({ role: "bot", text: initialQuestion });

        res.json({ sessionId, initialQuestion });
    } catch (error) {
        console.error("Error starting interview:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
};

module.exports = { startInterview };