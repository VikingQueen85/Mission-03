//========== CENTRALISED CONFIGURATION SETTING ==========//

require("dotenv").config() // Load environment variables from .env file

const config = {
  apiKey: process.env.GEMINI_API_KEY,
  port: process.env.PORT,
}

module.exports = config
