import express from 'express';
import db from '../db/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/', async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    age,
    height,
    weight,
    activityLevel,
    phone,
    bmi
  } = req.body;

  try {
    // Check if user already exists
    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const stmt = db.prepare(`
      INSERT INTO users (name, last_name, email, password, calorie_goal, current_weight, goal_weight, height_cm, activity_level, is_premium, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const calorieGoal = null; // Will be updated in questionnaire

    const result = stmt.run(
      firstName,
      lastName,
      email,
      hashedPassword,
      calorieGoal,
      weight,
      weight,
      height,
      activityLevel
    );

    const userId = result.lastInsertRowid;

    // Create JWT token
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        name: firstName,
        email,
        bmi
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error registering user.' });
  }
});

export default router;
