import express from 'express';
import db from '../db/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

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
        last_name: user.last_name,
        email: user.email,
        calorie_goal: user.calorie_goal,
        current_weight: user.current_weight,
        goal_weight: user.goal_weight,
        height_cm: user.height_cm,
        activity_level: user.activity_level,
        is_premium: user.is_premium,
        bmi: parseFloat(bmi.toFixed(2))
      }

    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

export default router;
