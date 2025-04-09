const express = require("express")
const router = express.Router()
const interviewController = require("../controllers/interviewController")

// Route to start an interview
// POST /api/interview/mock
router.post("/start", interviewController.startInterview)

module.exports = router
