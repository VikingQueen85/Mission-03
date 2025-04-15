const express = require("express")
const router = express.Router()
const interviewController = require("../controllers/interviewController")

// Route for chat interview
// POST /api/interview/chat
router.post("/chat", interviewController.chatInterview)

module.exports = router
