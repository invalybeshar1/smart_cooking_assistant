import express from 'express';
import { askGemini } from './geminiService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const reply = await askGemini(`Act as a smart cooking assistant. Based on these ingredients, suggest one recipe name and its main ingredients only. Just respond clearly in markdown without extra explanation.

User ingredients: ${message}`);
    res.json({ reply });
  } catch (error) {
    console.error('Gemini error:', error.message);
    res.status(500).json({ error: 'Failed to contact Gemini API' });
  }
});

router.post('/recipe', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const prompt = `
You are an AI chef assistant. The user has requested a recipe using these ingredients or preferences: "${message}".

Respond ONLY with a valid JSON object using the following format:

{
  "title": "Recipe Title",
  "ingredients": [ "ingredient 1", "ingredient 2", ... ],
  "equipment": [ "equipment item 1", "equipment item 2", ... ],
  "servings": "e.g. 1-2 people",
  "time": {
    "prep": "e.g. 10 minutes",
    "cook": "e.g. 15 minutes",
    "total": "e.g. 25 minutes"
  },
  "instructions": [
    "Step 1: Describe in detail what needs to be prepared or preheated. Mention utensils if needed.",
    "Step 2: Describe each cooking action in a clear, step-by-step way with tips like temperature or timing.",
    "Step 3: Add clarifications where a beginner might need help (e.g., how to know when something is done).",
    ...
  ]
}

Make each instruction step clear, friendly, and a bit more elaborate than usual — as if you're walking a beginner through the process.

Respond ONLY in JSON. No markdown. No explanations.
`;

    const reply = await askGemini(prompt);
    const jsonReply = reply.trim().replace(/^```json\n?|```$/g, '');

    let recipeJson;
    try {
      recipeJson = JSON.parse(jsonReply);
    } catch (err) {
      console.error('Invalid JSON from Gemini:', reply);
      return res.status(502).json({ error: 'Invalid JSON format from Gemini' });
    }

    res.json(recipeJson);
  } catch (error) {
    console.error('Gemini full recipe error:', error.message);
    res.status(500).json({ error: 'Failed to contact Gemini API' });
  }
});

export default router;
