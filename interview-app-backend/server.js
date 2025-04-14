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
    process.exit(1)
  }
}

// if (!config.apiKey) {
//   console.error(
//     "FATAL ERROR: Gemini API Key not found in config. Please set process.env.GEMINI_API_KEY or add it to './src/config/index.js'"
//   )
//   process.exit(1)
// }

// console.log("api key", config.apiKey) // working fine

const GEMINI_MODEL = "gemini-2.0-flash"
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${config.apiKey}`

const MAX_INTERVIEW_QUESTIONS = 6

const conversationHistory = {}

// app.get("/api/key-test", async (req, res) => {
//   res.json({
//     message: "Your API key is",
//     key:
//       config.apiKey.substring(0, 4) +
//       "..." +
//       config.apiKey.substring(config.apiKey.length - 4),
//   })
// }) // working fine

// TESTING API KEY with a simple GET request // POSTMAN // Working fine // Gemini API is reachable
// GET // http://localhost:5001/api/test
//
// app.get("/api/test", async (req, res) => {
//   try {
//     // Fixed to use POST and include required body
//     const response = await fetch(GEMINI_API_URL, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         contents: [{ parts: [{ text: "Hello, this is a test message" }] }],
//         generationConfig: {
//           temperature: 0.7,
//           maxOutputTokens: 150,
//         },
//       }),
//     })
//     if (!response.ok) {
//       const responseBody = await response.json()
//       console.error(
//         "Gemini API error response:",
//         JSON.stringify(responseBody, null, 2)
//       )
//       return res.status(500).json({
//         error: `Gemini API request failed with status ${response.status}. ${
//           responseBody?.error?.message || ""
//         }`,
//       })
//     }
//     const responseBody = await response.json()
//     res.json({
//       message: "Gemini API is reachable.",
//       model: responseBody.name,
//       description: responseBody.description,
//     })
//   } catch (error) {
//     console.error("Error during Gemini API test call:", error)
//     res.status(500).json({
//       error: error.message || "An internal server error occurred.",
//     })
//   }
// }) // Working fine

function formatMessagesForPrompt(messages) {
  return messages
    .map(
      msg => `${msg.role === "user" ? "Candidate" : "Interviewer"}: ${msg.text}`
    )
    .join("\n")
}

async function callGeminiAPI(prompt, shouldGenerateFeedback) {
  const apiRequestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: shouldGenerateFeedback ? 450 : 150,
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

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apiRequestBody),
    })

    if (!response.ok) {
      const responseBody = await response.json()
      console.error(
        "Gemini API error response:",
        JSON.stringify(responseBody, null, 2)
      )
      let errorMessage =
        responseBody?.error?.message ||
        `Gemini API request failed with status ${response.status}`
      if (responseBody?.promptFeedback?.blockReason) {
        errorMessage = `Request blocked by safety settings before generation: ${responseBody.promptFeedback.blockReason}. Please rephrase your input.`
      }
      throw new Error(errorMessage)
    }

    const responseBody = await response.json()

    if (responseBody?.candidates?.[0]?.finishReason === "SAFETY") {
      const safetyRatings = responseBody.candidates[0]?.safetyRatings
      const blockedCategory = safetyRatings?.find(r => r.blocked)?.category
      throw new Error(
        `The generated response was blocked due to safety concerns${
          blockedCategory ? ` (${blockedCategory})` : ""
        }. Please try again or rephrase.`
      )
    }

    const generatedText =
      responseBody?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      if (responseBody?.candidates?.[0]?.finishReason === "STOP") {
        throw new Error("API returned an empty response.")
      }
      throw new Error("Failed to parse content from API response.")
    }

    return generatedText.trim()
  } catch (error) {
    console.error("Error during Gemini API call:", error)
    throw error
  }
}

function generateQuestionPrompt(jobTitle, conversationHistory) {
  const basePrompt = `You are an AI hiring manager conducting an interview for the role of "${jobTitle}". Keep your questions concise and focused. Ask only one question per turn. Do not add conversational filler like "Okay, great." before or after the question.`
  const historyPrompt = conversationHistory
    ? `\nHere is the conversation history so far:\n--- History Start ---\n${conversationHistory}\n--- History End ---\n`
    : `\nThis is the start of the interview. The first question should be asked by the Interviewer.\n`
  const instructionPrompt = `Based *specifically* on the candidate's last answer in the history provided (if any), ask the *next* relevant interview question suitable for a "${jobTitle}". Ensure the question logically follows the conversation flow but explores different aspects relevant to the role over time (e.g., technical skills, behavioral situations, problem-solving, teamwork). Ask only the question itself.`
  return `${basePrompt}${historyPrompt}${instructionPrompt}`
}

function generateFeedbackPrompt(jobTitle, conversationHistory) {
  return `You are an AI hiring manager reviewing a completed interview for the role of "${jobTitle}". The candidate has just given their final answer.\nHere is the full transcript of the interview:\n--- Transcript Start ---\n${conversationHistory}\n--- Transcript End ---\n\nBased *only* on the transcript provided, provide constructive feedback to the candidate.\n1. Briefly summarize their overall performance regarding the "${jobTitle}" role.\n2. Mention 1-2 potential strengths demonstrated in their answers relevant to the role.\n3. Mention 1-2 specific areas where their answers could be improved for future interviews for this type of role.\n4. Offer 1-2 concrete suggestions on *how* they could improve those areas (e.g., using the STAR method, providing more specific examples, quantifying achievements).\n\nStructure the feedback clearly and maintain a professional, encouraging tone. Do not ask any further questions. Start the feedback directly, for example: "Thank you for completing the interview. Based on our conversation: ..."`
}

app.post("/api/interview/chat", async (req, res) => {
  const { jobTitle, messages } = req.body

  if (!jobTitle || typeof jobTitle !== "string" || jobTitle.trim() === "") {
    return res.status(400).json({ error: "Valid job title is required." })
  }

  if (!Array.isArray(messages)) {
    return res
      .status(400)
      .json({ error: "Message history (array) is required." })
  }

  const trimmedJobTitle = jobTitle.trim()
  const formattedHistory = formatMessagesForPrompt(messages)
  const userTurns = messages.filter(m => m.role === "user").length
  const shouldGenerateFeedback = userTurns >= MAX_INTERVIEW_QUESTIONS

  let prompt
  if (shouldGenerateFeedback) {
    console.log(
      `Generating feedback for "${trimmedJobTitle}" after ${userTurns} user responses.`
    )
    prompt = generateFeedbackPrompt(trimmedJobTitle, formattedHistory)
  } else {
    console.log(
      `Generating question ${userTurns + 1} for "${trimmedJobTitle}".`
    )
    prompt = generateQuestionPrompt(trimmedJobTitle, formattedHistory)
  }

  console.log(
    "Prompt being sent to Gemini (first ~200 chars):",
    prompt.substring(0, 200) + "..."
  )

  try {
    const generatedText = await callGeminiAPI(prompt, shouldGenerateFeedback)
    res.json({
      nextBotMessage: generatedText,
      isComplete: shouldGenerateFeedback,
    })
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "An internal server error occurred." })
  }
})

const PORT = config.port

app.listen(PORT, () => {
  console.log(`Server is running on: http://localhost:${PORT}`)
}) // Working fine
