
//========== IMPORTS ==========//
const config = require("../config/index")

//========== CONSTANTS ==========//
const GEMINI_MODEL = "gemini-2.0-flash"
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${config.apiKey}` // Check if this is the correct URL for the chosen model

//================================================================//
//===================== HELPER FUNCTIONS==========================//
//================= INTERNAL TO THE SERVICE ======================//
//================================================================//

const formatMessagesForPrompt = messages => {
  return messages
    .map(
      msg => `${msg.role === "user" ? "Candidate" : "Interviewer"}: ${msg.text}`
    )
    .join("\n")
}

//========== PROMPTS ==========//

const generateQuestionPrompt = (jobTitle, conversationHistory) => {
  const basePrompt = `You are an AI hiring manager conducting an interview for the role of "${jobTitle}". Keep your questions concise and focused. Ask only one question per turn. Do not add conversational filler like "Okay, great." before or after the question. The first question should be: "Tell me about yourself."`

  const historyPrompt = conversationHistory
    ? `Here is the conversation history so far:

    --- History Start ---
    ${conversationHistory}
    --- History End ---
    
    `
    : `This is the start of the interview. The first question should be asked by the Interviewer.`

  // Ensure the instruction clearly asks for the the next question based on response
  const instructionPrompt = `Based *specifically* on the candidate's last answer in the history provided (if any), ask the *next* relevant interview question suitable for a "${jobTitle}". Ensure the question logically follows the conversation flow but explores different aspects relevant to the role over time (e.g., technical skills, behavioral situations, problem-solving, teamwork). Ask only the question itself.`

  return `${basePrompt}${historyPrompt}${instructionPrompt}`
}

// Prompt for generating feedback
const generateFeedbackPrompt = (jobTitle, conversationHistory) => {
  return `You are an AI hiring manager reviewing a completed interview for the role of "${jobTitle}". The candidate has just given their final answer.
  
  Here is the full transcript of the interview:
  
  --- Transcript Start ---
  ${conversationHistory}
  --- Transcript End ---
  
  Based *only* on the transcript provided, provide constructive feedback to the candidate.
  
  1. Briefly summarize their overall performance regarding the "${jobTitle}" role.
  2. Mention 1-2 potential strengths demonstrated in their answers relevant to the role.
  3. Mention 1-2 specific areas where their answers could be improved for future interviews for this type of role.
  4. Offer 1-2 concrete suggestions on *how* they could improve those areas (e.g., using the STAR method, providing more specific examples, quantifying achievements).
  
  Structure the feedback clearly and maintain a professional, encouraging tone. Do not ask any further questions. Start the feedback directly, for example: "Thank you for completing the interview. Based on our conversation: ..."`
}

//========== FUNCTION TO CALL GEMINI API ==========//
const callGeminiApi = async (prompt, shouldGenerateFeedback) => {
  const apiRequestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: shouldGenerateFeedback ? 450 : 150,
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

  // Logging the API URL, request body, and prompt for debugging
  console.log(
    "Sending request to Gemini API URL:",
    GEMINI_API_URL.replace(config.apiKey, "[REDACTED_KEY]")
  )
  console.log(
    "Gemini Request Body (excluding prompt text):",
    JSON.stringify({ ...apiRequestBody, contents: "[PROMPT OMITTED]" }, null, 2)
  )
  console.log(
    "Prompt being sent to Gemini (first ~200 chars):",
    prompt.substring(0, 200) + "..."
  )

  try {
    // Make the API call to Gemini
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apiRequestBody),
    })

    const responseBody = await response.json().catch(err => {
      console.error("Failed to parse Gemini response as JSON:", err)
      throw new Error(
        `Gemini API request failed with status ${response.status} ${response.statusText}. Non-JSON response received.`
      )
    })

    // Unsuccessful response handling
    if (!response.ok) {
      console.error(
        "Gemini API error response:",
        JSON.stringify(responseBody, null, 2)
      )

      let errorMessage =
        responseBody?.error?.message ||
        `Gemini API request failed with status ${response.status}`

      // Check for prompt blocking specifically
      if (responseBody?.promptFeedback?.blockReason) {
        errorMessage = `Request blocked by safety settings before generation: ${responseBody.promptFeedback.blockReason}. Please rephrase your input.`
      }

      // Check for other specific error messages
      if (responseBody?.error?.code === 400) {
        errorMessage = `Bad request: ${responseBody.error.message}. Please check your input.`
      } else if (responseBody?.error?.code === 403) {
        errorMessage = `Forbidden: ${responseBody.error.message}. Please check your API key and permissions.`
      } else if (responseBody?.error?.code === 500) {
        errorMessage = `Internal server error: ${responseBody.error.message}. Please try again later.`
      }

      throw new Error(errorMessage)
    }

    // Check for response blocking AFTER generation
    if (responseBody?.candidates?.[0]?.finishReason === "SAFETY") {
      const safetyRatings = responseBody.candidates[0]?.safetyRatings
      const blockedCategory = safetyRatings?.find(r => r.blocked)?.category
      throw new Error(
        `The generated response was blocked due to safety concerns${
          blockedCategory ? ` (${blockedCategory})` : ""
        }. Please try again or rephrase.`
      )
    }

    // Successful response: Extract the text from the response safely
    const generatedText =
      responseBody?.candidates?.[0]?.content?.parts?.[0]?.text

    // Check if the generated text is empty or undefined
    if (!generatedText) {
      console.error(
        "Gemini API response missing expected text content: ",
        JSON.stringify(responseBody, null, 2)
      )

      // Handle if stop sequence hit immediately or max tokens reached
      if (
        responseBody?.candidates?.[0]?.finishReason === "STOP" ||
        responseBody?.candidates?.[0]?.finishReason === "MAX_TOKENS"
      ) {
        console.warn(
          "Gemini API returned an empty text response. Finish Reason: ",
          responseBody.candidates[0].finishReason
        )
        return ""
      }

      // Handle if the response was blocked for other reasons
      if (responseBody?.candidates?.[0]?.finishReason === "OTHER") {
        throw new Error(
          `Gemini API request failed with reason "OTHER. Check logs for details.`
        )
      }

      // General fallback error if no text and no specific reason handled above
      throw new Error(
        "Failed to parse generated text content from Gemini API response."
      )
    }

    // Successful text generation: Return it
    return generatedText.trim()
  } catch (error) {
    console.error("Error during Gemini API call processing:", error)
    throw error
  }
}

//================================================================//
//================= EXPORTED SERVICE FUNCTION ====================//
//================================================================//

const processInterviewTurn = async (jobTitle, messages) => {
  const MAX_INTERVIEW_QUESTIONS = 7
  const trimmedJobTitle = jobTitle.trim()
  const formattedHistory = formatMessagesForPrompt(messages)
  const userTurns = messages.filter(m => m.role === "user").length
  const shouldGenerateFeedback = userTurns >= MAX_INTERVIEW_QUESTIONS

  let prompt

  // If the user has answered enough questions, generate feedback
  // Otherwise, generate the next question
  if (shouldGenerateFeedback) {
    console.log(
      `Generating feedback for "${jobTitle}" after ${userTurns} user responses.`
    )
    prompt = generateFeedbackPrompt(trimmedJobTitle, formattedHistory)
  } else {
    const questionNumber = userTurns + 1
    console.log(`Generating question ${questionNumber} for "${trimmedJobTitle}`)
    prompt = generateQuestionPrompt(trimmedJobTitle, formattedHistory)
  }
  try {
    const generatedText = await callGeminiApi(prompt, shouldGenerateFeedback)
    return {
      nextBotMessage: generatedText,
      isComplete: shouldGenerateFeedback,
    }
  } catch (error) {
    throw error
  }
}

module.exports = { processInterviewTurn }
