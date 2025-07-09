
const express = require("express")
const cors = require("cors")
const interviewRoutes = require("./routes/interviewRoutes")

//========== INITIALISE EXPRESS ==========//
const app = express()

//========== MIDDLEWARE ==========//
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//========== HEALTH CHECK ==========//
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", timestamp: new Date().toISOString() })
})

//========== API ROUTES ==========//
app.use("/api/interview", interviewRoutes)

//========== BASIC ERROR HANDLING ==========//
app.use((req, res, next) => {
  res.status(404).json({ error: "Not Found" })
})

//========== GENERAL ERROR HANDLING ==========//
app.use((err, req, res, next) => {
  console.error("Unhandled error: ", err.stack)
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal Server Error" })
})

module.exports = app
