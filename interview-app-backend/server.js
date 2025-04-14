//========== MAIN ENTRY POINT ==========//
//========== STARTING THE SERVER ==========//
const app = require("./src/app")
const config = require("./src/config/index")

//========== ESSENTIAL STARTUP CHECK ==========//
if (!config.apiKey) {
  if (!config.apiKey) {
    console.error(
      "Error: GEMINI_API_KEY is not set in the environment variables."
    )
    process.exit(1) // Exit if key is missing
  }
}

//========== PORT ==========//
const PORT = config.port || 5001

app.listen(PORT, () => {
  console.log(`Server is running on: http://localhost:${PORT}`)
})
