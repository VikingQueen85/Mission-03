
// ./src/config/index.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') }); // Load .env file from project root

module.exports = {
    // IMPORTANT: Load API Key securely from environment variables
    apiKey: process.env.REACT_APP_GEMINI_API_KEY, // Ensure this environment variable is set!
    port: process.env.PORT || 5000 // Use environment port or default to 5000
};