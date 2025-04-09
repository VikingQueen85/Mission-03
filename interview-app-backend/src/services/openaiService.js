//========== ALL INTERACTIONS WITH OPENAI API ==========//
//======================================================//
const OpenAI = require("openai")
const config = require("../config/index")

//========== CONFIGURE OPENAI CLIENT ==========//
const client = new OpenAI({
  apiKey: process.env.config.openaiApiKey,
})

//========== STORE CONVERSATION HISTORY ==========//
// DATABASE TO BE USED LATER
// FOR NOW, IN-MEMORY OBJECT WILL BE USED
const conversationHistory = {} // KEY: SESSION ID, VALUE: ARRAY OF MESSAGES

//========== FUNCTION TO GENERATE INTERVIEW QUESTIONS ==========//
const generateInterviewQuestions = async (
  sessionId,
  jobTitle,
  userResponse
) => {
  //========== PROMPT (VERY IMPORTANT)==========//
  const prompt = `You are a helpful and professional job interviewer. You are interviewing the user for the role of "${jobTitle}". Your goal is to assess the candidate's suitability for this role. Start the interview ONLY with the exact phrase: "Tell me about yourself.". Do not add any pleasantries before it in the first turn. Ask relevant follow-up behavioral or technical questions based on the user's previous answer and the specified job title ("${jobTitle}"). Ask exactly 6 questions in total after the initial "Tell me about yourself.". Do not ask more or less than 6 follow-up questions. After the user answers the 6th follow-up question, provide constructive feedback on their overall performance during the interview. Summarize their strengths and suggest specific areas for improvement based on their answers throughout the conversation. Do not ask any more questions after providing feedback. Start the feedback with "Okay, that concludes the main part of our interview. Here's some feedback on your responses:". Maintain a professional and neutral tone. Do not reveal you are an AI.`

  //========== CHECK IF SESSION EXISTS ==========//
  if (!conversationHistory[sessionId]) {
    // If the session does not exist, create a new one
    conversationHistory[sessionId] = [
      {
        role: "system",
        content: prompt, // The initial "Tell me about yourself." will be added by the controller logic
      },
    ]
  }

  //========== ADD USER'S RESPONSE TO HISTORY ==========//
  const history = conversationHistory[sessionId]

  // Add the latest user response to the history
  if (userResponse) {
    history.push({
      role: "user",
      content: userResponse,
    })
  }

  //========== DETERMINE IF IT'S THE INITIAL QUESTION (NO USER RESPONSE YET) ==========//
  const isInitialQuestion = !userResponse
}
