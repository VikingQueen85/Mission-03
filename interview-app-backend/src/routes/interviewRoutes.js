
const express = require("express")
const router = express.Router()
const interviewController = require("../controllers/interviewController")

// Route to start an interview
router.post("/start", interviewController.startInterview)

module.exports = router
