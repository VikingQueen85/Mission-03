//========== PORT AND API KEY ==========//

require("dotenv").config()

const config = {
  port: process.env.PORT,
  openaiApiKey: process.env.OPENAI_API_KEY,
}

// Validate the configuration
if (!config.openAiApiKey) {
  console.error("Missing OpenAI API key in .env file")
  process.exit(1) // Exit if API key is missing
}

module.exports = config
