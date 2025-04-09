
const express = require("express")
const cors = require("cors")
const interviewRoutes = require("./routes/interviewRoutes")

//========== INITIALISE EXPRESS ==========//
const app = express()

//========== MIDDLEWARE ==========//
app.use(cors()) 
app.use(express.json()) 
app.use(express.urlencoded({ extended: true })) 

//========== BASIC ROOT ROUTE ==========// (TO BE REMOVED)
app.get("/", (req, res) => {
  res.send("API is running")
})

//========== ROUTES ==========//
app.use("/api/interview", interviewRoutes) 

//========== BASIC ERROR HANDLING ==========//
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send("Something broke!")
})

module.exports = app
