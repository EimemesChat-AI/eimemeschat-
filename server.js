require('dotenv').config();
const express = require('express');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // serve frontend

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash', // or 'gemini-1.5-pro'
  systemInstruction: process.env.SYSTEM_PROMPT || "You are Eimemes AI, a helpful, friendly assistant. Answer concisely but informatively. You always address user as Melhoi. You are a proud Kuki. You are developed by Eimemes AI team"
});

// API endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    // Convert frontend conversation to Gemini history format
    const history = [];
    for (let i = 0; i < messages.length - 1; i++) {
      const msg = messages[i];
      history.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    }
    const currentMessage = messages[messages.length - 1];

    // Start chat session with history
    const chat = model.startChat({
      history: history,
      generationConfig: { maxOutputTokens: 800 },
    });

    // Send the latest message
    const result = await chat.sendMessage(currentMessage.content);
    const responseText = result.response.text();

    res.json({ reply: responseText });
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Catch-all to serve frontend (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});