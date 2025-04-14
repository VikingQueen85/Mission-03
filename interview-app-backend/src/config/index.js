// require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
require("dotenv").config() // Load environment variables from .env file // If without any arguments, it will look for the .env file in the root directory. The application is started from the project root (server.js), which is the same location as the .env file. // If the application is stared from a different directory then the path must be explicitly provided.

const config = {
  // apiKey: process.env.REACT_APP_GEMINI_API_KEY, // Initialising the API key with "REACT_APP_" prefix is used for client-side or frontend code, similar to using "VITE_" as prefix if frontend is using Vite. For server-side code, we can use the API key directly from process.env
  apiKey: process.env.GEMINI_API_KEY, // Console logging fine
  port: process.env.PORT || 5001, // Working fine
}

//========== VALIDATING ESSENTIAL CONFIG ==========//
// Validation happens exactly once during startup
if (!config.apiKey) {
  console.error(
    "Error: GEMINI_API_KEY is not set in the environment variables."
  )
  process.exit(1)
}

module.exports = {
  config,
}
