const fetch = require("node-fetch")
const config = require("../config/index") // Check how the module exports this. If module exports it as object you have to destructure it such as const { config }. If not then import it this way.

const GEMINI_MODEL = "gemini-2.0-flash"
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${config.apiKey}`

// Global object to store conversation history by session ID
const conversationHistory = {}

// Testing with postman
// POST method
// http://localhost:5001/api/interview/start
// body: {
//   "jobTitle": "Software Developer",
//   "messages": []
// }

async function generateInitialQuestion(jobTitle) {
  console.log(
    "API Key first 5 chars:",
    config.apiKey ? config.apiKey.substring(0, 5) + "..." : "NOT FOUND"
  )

  const prompt = `You are a helpful and professional job interviewer. You are interviewing the user for the role of "${jobTitle}". Your goal is to assess the candidate's suitability for this role. Start the interview ONLY with the exact phrase: "Tell me about yourself.". Do not add any pleasantries before it in the first turn.`

  try {
    const apiRequestBody = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 100,
        topK: 40,
        topP: 0.95,
        stopSequences: ["Interviewer:", "Candidate:"],
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    }

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apiRequestBody),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("API Error:", errorData)
      throw new Error(
        `API request failed: ${
          errorData?.error?.message || response.statusText
        }`
      )
    }

    const responseBody = await response.json()

    // console.log(responseBody)

    const generatedText =
      responseBody?.candidates?.[0]?.content?.parts?.[0]?.text

    console.log("Generated text:", generatedText) // Output: Tell me about yourself.
    // JSON OUTPUT FROM POSTMAN
    //   {
    //     "nextBotMessage": "Tell me about yourself.\n",
    //     "isComplete": false
    // }

    if (!generatedText) {
      throw new Error("Failed to parse content from API response")
    }
    console.log(generatedText.trim()) // trims \n from the end of string

    return generatedText.trim() // Just return the standard question for now
  } catch (error) {
    console.error("Error in generateInitialQuestion:", error)
    throw error
  }
}

function createSession(jobTitle) {
  const sessionId = generateSessionId()
  conversationHistory[sessionId] = []
  return sessionId
}

function generateSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

// Export all required functions
module.exports = { generateInitialQuestion, createSession, conversationHistory }
