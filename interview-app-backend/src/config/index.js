// require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
require("dotenv").config() // Load environment variables from .env file // If without any arguments, it will look for the .env file in the root directory. The application is started from the project root (server.js), which is the same location as the .env file. // If the application is stared from a different directory then the path must be explicitly provided.

module.exports = {
  // apiKey: process.env.REACT_APP_GEMINI_API_KEY, // Initialising the API key with REACT_APP_ prefix is used for client-side or frontend code, same as using VITE_ as prefix if frontend is using Vite. For server-side code, we can use the API key directly from process.env
  apiKey: process.env.GEMINI_API_KEY,
  port: process.env.PORT || 5000,
}
