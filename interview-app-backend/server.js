
// Dependencies
const express = require('express');
const fetch = require('node-fetch');
const config = require('./src/config/index'); 
const cors = require('cors'); 

if (!config.apiKey) {
    console.error("FATAL ERROR: Gemini API Key not found in config. Please set process.env.GEMINI_API_KEY or add it to './src/config/index.js'");
    process.exit(1); 
}

const app = express();

// Middleware
app.use(express.json());
app.use(cors()); 

// Gemini API Config

const GEMINI_MODEL = 'gemini-1.5-flash-latest';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${config.apiKey}`;
const MAX_INTERVIEW_QUESTIONS = 6; 

// Helper to format messages for the prompt
function formatMessagesForPrompt(messages) {
    return messages.map(msg => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.text}`).join('\n');
}

// Conversational Endpoint
app.post('/api/interview-chat', async (req, res) => {
    const { jobTitle, messages } = req.body; 

    if (!jobTitle || typeof jobTitle !== 'string' || jobTitle.trim() === '') {
        return res.status(400).json({ error: 'Valid job title is required.' });
    }
    if (!Array.isArray(messages)) {
        return res.status(400).json({ error: 'Message history (array) is required.' });
    }

    const trimmedJobTitle = jobTitle.trim();
    const conversationHistory = formatMessagesForPrompt(messages);

    const userTurns = messages.filter(m => m.role === 'user').length;
    const shouldGenerateFeedback = userTurns >= MAX_INTERVIEW_QUESTIONS;

    let prompt;
    if (shouldGenerateFeedback) {
        console.log(`Generating feedback for "${trimmedJobTitle}" after ${userTurns} user responses.`);
        prompt = `
You are an AI hiring manager reviewing a completed interview for the role of "${trimmedJobTitle}".
The candidate has just given their final answer.
Here is the full transcript of the interview:
--- Transcript Start ---
${conversationHistory}
--- Transcript End ---

Based *only* on the transcript provided, provide constructive feedback to the candidate.
1. Briefly summarize their overall performance regarding the "${trimmedJobTitle}" role.
2. Mention 1-2 potential strengths demonstrated in their answers relevant to the role.
3. Mention 1-2 specific areas where their answers could be improved for future interviews for this type of role.
4. Offer 1-2 concrete suggestions on *how* they could improve those areas (e.g., using the STAR method, providing more specific examples, quantifying achievements).

Structure the feedback clearly and maintain a professional, encouraging tone. Do not ask any further questions. Start the feedback directly, for example: "Thank you for completing the interview. Based on our conversation: ..."
        `;
    } else {
        console.log(`Generating question ${userTurns + 1} for "${trimmedJobTitle}".`);
        const basePrompt = `You are an AI hiring manager conducting an interview for the role of "${trimmedJobTitle}". Keep your questions concise and focused. Ask only one question per turn. Do not add conversational filler like "Okay, great." before or after the question.`;
        const historyPrompt = messages.length > 0 ? `
Here is the conversation history so far:
--- History Start ---
${conversationHistory}
--- History End ---
` : `This is the start of the interview. The first question should be asked by the Interviewer.`; 

        const instructionPrompt = `Based *specifically* on the candidate's last answer in the history provided (if any), ask the *next* relevant interview question suitable for a "${trimmedJobTitle}". Ensure the question logically follows the conversation flow but explores different aspects relevant to the role over time (e.g., technical skills, behavioral situations, problem-solving, teamwork). Ask only the question itself.`;

        prompt = `${basePrompt}\n${historyPrompt}\n${instructionPrompt}`;
    }

    console.log("Prompt being sent to Gemini (first ~200 chars):", prompt.substring(0, 200) + "..."); 

    try {
        const apiRequestBody = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: shouldGenerateFeedback ? 450 : 150, 
                stopSequences: ["Interviewer:", "Candidate:"] 
            },
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            ]
        };

        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apiRequestBody),
        });

        console.log(`Gemini API Response Status: ${response.status} ${response.statusText}`);
        const responseBody = await response.json();

        if (!response.ok) {
            console.error("Gemini API error response:", JSON.stringify(responseBody, null, 2));
            const errorMessage = responseBody?.error?.message || `Gemini API request failed with status ${response.status}`;
            const statusCode = response.status >= 500 ? 502 : response.status; 
            if (responseBody?.promptFeedback?.blockReason) {
                console.warn(`Gemini prompt blocked: ${responseBody.promptFeedback.blockReason}`);
                return res.status(400).json({ error: `Request blocked by safety settings before generation: ${responseBody.promptFeedback.blockReason}. Please rephrase your input.` });
            }
            return res.status(statusCode).json({ error: errorMessage });
        }

        // --- Process successful response ---
        if (responseBody?.candidates?.[0]?.finishReason === 'SAFETY') {
            console.warn("Gemini response blocked due to safety settings during generation.");
            const safetyRatings = responseBody.candidates[0]?.safetyRatings;
            const blockedCategory = safetyRatings?.find(r => r.blocked)?.category;
            return res.status(400).json({ error: `The generated response was blocked due to safety concerns${blockedCategory ? ` (${blockedCategory})` : ''}. Please try again or rephrase.` });
        }

        const generatedText = responseBody?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            if (responseBody?.candidates?.[0]?.finishReason === 'STOP') {
                console.warn("Gemini finished with STOP reason but no text content.");
                return res.status(500).json({ error: 'API returned an empty response.' });
            }
            console.error("Unexpected Gemini API response structure:", JSON.stringify(responseBody, null, 2));
            return res.status(500).json({ error: 'Failed to parse content from API response.' });
        }

        console.log("Gemini generated text:", generatedText.trim());

        res.json({
            nextBotMessage: generatedText.trim(),
            isComplete: shouldGenerateFeedback 
        });

    } catch (error) {
        console.error('Error during API call or processing:', error); 
        res.status(500).json({ error: 'An internal server error occurred while contacting the AI service.' });
    }
});

// Root route and Server Start
app.get('/', (req, res) => {
    res.send('Interview Bot API is running!');
});

const PORT = process.env.PORT || config.port || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Using Gemini Model: ${GEMINI_MODEL}`);
    console.log(`Targeting ${MAX_INTERVIEW_QUESTIONS} questions before feedback.`);
});