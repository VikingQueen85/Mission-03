
This project implements an AI-powered mock interviewer designed to boost interview confidence. It allows users to practice answering realistic questions tailored to a specific job role. Our AI interviewer adapts to user answers and provides helpful feedback after a set number of questions to aid in improvement.

This was a collaborative group project where all contributors worked together across the various folders and files, leveraging GitHub for version control and teamwork.

Key Features
Adaptive AI Interviewer: The AI dynamically asks questions based on the user's input and the specified job title.

Realistic Interview Simulation: Provides a conversational flow, starting with common opening questions and progressing through job-specific inquiries.

Personalized Feedback: After approximately 6 questions, the AI reviews the conversation and offers constructive feedback to help users refine their responses.

Role-Specific Questions: Interview questions are tailored to the job title provided by the user, ensuring relevant practice.

User-Friendly Interface: A simple chat interface allows seamless interaction with the AI.

Installation
This project consists of two main parts: a Node.js/Express backend and a React (Vite) frontend. Both need to be set up and run.

Prerequisites:
Node.js: Ensure Node.js is installed on your system.

Git: For cloning the repository.

Code Editor: Such as VS Code.

Google Gemini API Key: Essential for the backend to communicate with the AI.

Setup Steps:
Clone the Repository:

git clone https://github.com/VikingQueen85/Mission-03.git
cd Mission-03 # Or the root directory of your cloned project

Backend Setup:
Navigate to the backend folder and install its dependencies.

cd interview-app-backend
npm install

Configure Environment Variables for Backend:
Create a .env file in the interview-app-backend directory (at the same level as package.json).
Add your Google Gemini API key:

GEMINI_API_KEY=YOUR_GOOGLE_GEMINI_API_KEY

Replace YOUR_GOOGLE_GEMINI_API_KEY with your actual key.
Ensure .env is added to your backend's .gitignore file to prevent accidental public exposure.

Start the Backend Server:

npm run dev

The server should start on http://localhost:5001.

Frontend Setup:
Open a new terminal window, navigate to the frontend folder, and install its dependencies.

cd ../interview-app-frontend
npm install

Configure Environment Variables for Frontend:
Create a .env file in the interview-app-frontend directory (at the same level as package.json).
This variable tells the React app where to find the backend API:

VITE_API_ENDPOINT=http://localhost:5001/api/interview/chat

Ensure .env is added to your frontend's .gitignore file.

Start the Frontend Application:

npm run dev

The React application will typically open in your browser at http://localhost:5173.

More Details
This website provides a dynamic and interactive platform for job interview preparation.

How it Works:
Enter a Job Title: You begin by specifying the job role you're applying for (e.g., "Software Engineer", "Marketing Manager", "Teacher").

AI Asks Questions: An AI chatbot, powered by Google Gemini, initiates the interview. It starts with a common opening like "Tell me about yourself" and then dynamically generates approximately 6 more questions based on the job title and your previous responses.

You Answer: You type your answers into the chat interface, simulating a real-time conversation.

Get Feedback: After the set number of questions, the AI reviews your entire conversation, providing insights into your strengths and offering actionable tips for improvement tailored to the specific job role.

Why Use It?
Practice answering common and job-specific interview questions.

Become comfortable with the typical interview flow and pacing.

Receive instant, personalized feedback to refine your answers.

Build confidence and reduce anxiety before your actual job interviews.

Technology Stack
Backend (Node.js/Express.js):

Handles API requests from the frontend.

Manages communication with the Google Gemini API using the @google/generative-ai SDK.

Uses dotenv for secure environment variable loading (e.g., GEMINI_API_KEY).

Implements cors middleware to enable cross-origin requests from the frontend during development.

nodemon is used for automatic server restarts during development.

Frontend (React with Vite):

Provides the interactive chat user interface.

Built with Vite for a fast development experience.

Fetches responses from the backend API using standard fetch calls.

Manages chat state, user input, and displays AI responses.

AI (Google Gemini API):

The core intelligence behind the mock interviewer, responsible for generating questions and providing feedback based on its prompt and conversation history.

Testing (Jest & Supertest):

Jest is used for unit and integration testing of backend logic.

Supertest assists in testing API endpoints.

Hosting: Azure

API Endpoints
The backend exposes the following primary API endpoint for chat interaction:

POST /api/interview/chat:

Purpose: Sends user messages and receives AI bot responses.

Request Body (JSON):

{
    "jobTitle": "string",
    "messages": [
        { "role": "user" | "bot", "text": "string" }
    ]
}

Response Body (JSON):

{
    "nextBotMessage": "string",
    "isComplete": "boolean"
}

Contributors
This project was a collaborative effort by:

Tessa - VikingQueen85

Sherelynn - sherelynn

Clark - hiu03052