
const fetch = require('node-fetch');
const config = require('../config/index');

const GEMINI_MODEL = 'gemini-1.5-flash-latest';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${config.apiKey}`;

// Global object to store conversation history by session ID
const conversationHistory = {};

async function generateInitialQuestion(jobTitle) {
    const prompt = `You are a helpful and professional job interviewer. You are interviewing the user for the role of "${jobTitle}". Your goal is to assess the candidate's suitability for this role. Start the interview ONLY with the exact phrase: "Tell me about yourself.". Do not add any pleasantries before it in the first turn.`;

    try {
        const apiRequestBody = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 100,
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

        const responseBody = await response.json();

        if (!response.ok) {
            console.error("Gemini API error response:", JSON.stringify(responseBody, null, 2));
            const errorMessage = responseBody?.error?.message || `Gemini API request failed with status ${response.status}`;
            throw new Error(errorMessage);
        }

        const generatedText = responseBody?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            throw new Error('Failed to parse content from API response.');
        }

        return generatedText.trim();
    } catch (error) {
        console.error('Error in generateInitialQuestion:', error);
        throw error;
    }
}

function createSession(jobTitle) {
    const sessionId = generateSessionId(); // Implement this function
    conversationHistory[sessionId] = [];
    return sessionId;
}

function generateSessionId() {
    // Basic session ID generation (you can use a more robust method)
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

module.exports = { generateInitialQuestion, createSession, conversationHistory };