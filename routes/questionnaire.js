import express from 'express';
import db from '../db/database.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, (req, res) => {
  const { preferences, allergies, intolerances, calorieGoal } = req.body;
  const userId = req.user.id;

  try {
    const insertMany = (table, column, items) => {
      const stmt = db.prepare(`INSERT INTO ${table} (user_id, ${column}) VALUES (?, ?)`);
      for (const item of items) {
        stmt.run(userId, item);
      }
    };

    // Clear old preferences (in case user updates later)
    db.prepare('DELETE FROM user_dietary_preferences WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM user_allergies WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM user_food_preferences WHERE user_id = ?').run(userId);

    insertMany('user_dietary_preferences', 'preference', preferences);
    insertMany('user_allergies', 'allergy', allergies);
    insertMany('user_food_preferences', 'food', intolerances);

    db.prepare('UPDATE users SET calorie_goal = ? WHERE id = ?').run(calorieGoal, userId);

    res.json({ message: 'Preferences saved successfully.' });
  } catch (err) {
    console.error('❌ Error saving preferences:', err.message);
    res.status(500).json({ message: 'Server error saving preferences.' });
  }
});

export default router;
