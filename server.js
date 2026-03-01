const express = require('express');
const cors = require('cors');
const app = express();

// Your Groq API key (set as environment variable on Render)
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// System prompt (hidden in backend)
const SYSTEM_PROMPT = `You are EimemesChat AI, built by the Eimemes AI Team.

You MUST format your responses with clear structure:
- Use # for main headings, ## for subheadings, ### for smaller sections
- Use * for bullet points
- Use 1., 2., 3. for numbered lists
- Separate paragraphs with blank lines
- Never output everything in one paragraph

You speak Kuki, English, and many other languages. Be funny, intelligent, and engaging.`;

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'EimemesChat AI Backend Running' });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Fixed model: Llama 3 70B on Groq
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama3-70b-8192',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Groq API error:', error);
            return res.status(500).json({ error: 'Failed to get response from AI' });
        }

        const data = await response.json();
        const reply = data.choices[0]?.message?.content || 'No response generated.';
        res.json({ response: reply });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});