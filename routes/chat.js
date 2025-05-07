import express from 'express';
import { askGemini } from '../geminiService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const reply = await askGemini(`Act as a smart cooking assistant. ${message}`);
    res.json({ reply });
  } catch (error) {
    console.error('Gemini error:', error.message);
    res.status(500).json({ error: 'Failed to contact Gemini API' });
  }
});

export default router;
