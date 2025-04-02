import express from 'express';
import db from '../db/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const heightM = user.height_cm / 100;
    const bmi = user.current_weight / (heightM * heightM);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        bmi: parseFloat(bmi.toFixed(2)),
        is_premium: user.is_premium
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

export default router;
