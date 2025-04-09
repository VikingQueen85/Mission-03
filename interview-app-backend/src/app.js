const express = require("express")
const cors = require("cors")
const interviewRoutes = require("./routes/interviewRoutes")

//========== INITIALISE EXPRESS ==========//
const app = express()

//========== MIDDLEWARE ==========//
app.use(cors()) // Enable CORS fro all origins (to be adjusted)
app.use(express.json()) // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })) // If form data needed to be parsed

//========== BASIC ROOT ROUTE ==========// (TO BE REMOVED)
app.get("/", (req, res) => {
  res.send("API is running")
})

//========== ROUTES ==========//
app.use("/api/interview", interviewRoutes) // Mount interview routes

//========== BASIC ERROR HANDLING ==========//
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send("Something broke!")
})

module.exports = app
