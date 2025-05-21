import express from 'express';
import db from '../db/database.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/profile', authMiddleware, (req, res) => {
  const userId = req.user.id;

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const preferences = db.prepare('SELECT preference FROM user_dietary_preferences WHERE user_id = ?').all(userId).map(p => p.preference);
    const allergies = db.prepare('SELECT allergy FROM user_allergies WHERE user_id = ?').all(userId).map(a => a.allergy);
    const intolerances = db.prepare('SELECT food FROM user_food_preferences WHERE user_id = ?').all(userId).map(i => i.food);

    const heightM = user.height_cm / 100;
    const bmi = user.current_weight / (heightM * heightM);

    res.json({
      name: user.name,
      email: user.email,
      age: user.age,
      height: user.height_cm,
      weight: user.current_weight,
      activityLevel: user.activity_level,
      calorieGoal: user.calorie_goal,
      bmi: parseFloat(bmi.toFixed(2)),
      preferences,
      allergies,
      intolerances,
      isPremium: !!user.is_premium
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile data' });
  }
});

router.put('/profile', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const {
    weight,
    calorieGoal,
    preferences,
    allergies,
    intolerances,
  } = req.body;

  try {
    db.prepare('UPDATE users SET current_weight = ?, calorie_goal = ? WHERE id = ?')
      .run(weight, calorieGoal, userId);

    db.prepare('DELETE FROM user_dietary_preferences WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM user_allergies WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM user_food_preferences WHERE user_id = ?').run(userId);

    const insert = (table, column, list) => {
      const stmt = db.prepare(`INSERT INTO ${table} (user_id, ${column}) VALUES (?, ?)`);
      list.forEach(item => stmt.run(userId, item));
    };

    insert('user_dietary_preferences', 'preference', preferences || []);
    insert('user_allergies', 'allergy', allergies || []);
    insert('user_food_preferences', 'food', intolerances || []);

    res.json({ message: 'Profile updated successfully.' });
  } catch (err) {
    console.error('Error updating profile:', err.message);
    res.status(500).json({ message: 'Server error updating profile.' });
  }
});

// Get all ingredient substitutions for the user
router.get('/substitutions', authMiddleware, (req, res) => {
  const userId = req.user.id;
  try {
    const substitutions = db.prepare('SELECT id, original_ingredient_name, preferred_ingredient_name FROM user_ingredient_substitutions WHERE user_id = ?').all(userId);
    res.json(substitutions);
  } catch (err) {
    console.error('Error fetching substitutions:', err.message);
    res.status(500).json({ message: 'Error fetching substitutions' });
  }
});

// Add a new ingredient substitution for the user
router.post('/substitutions', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { original_ingredient_name, preferred_ingredient_name } = req.body;

  if (!original_ingredient_name || !preferred_ingredient_name) {
    return res.status(400).json({ message: 'Missing original_ingredient_name or preferred_ingredient_name' });
  }

  try {
    const stmt = db.prepare('INSERT INTO user_ingredient_substitutions (user_id, original_ingredient_name, preferred_ingredient_name) VALUES (?, ?, ?)');
    const info = stmt.run(userId, original_ingredient_name, preferred_ingredient_name);
    res.status(201).json({ message: 'Substitution added successfully', substitutionId: info.lastInsertRowid });
  } catch (err) {
    console.error('Error adding substitution:', err.message);
    res.status(500).json({ message: 'Error adding substitution' });
  }
});

// Delete an ingredient substitution for the user
router.delete('/substitutions/:id', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const substitutionId = req.params.id;

  try {
    const stmt = db.prepare('DELETE FROM user_ingredient_substitutions WHERE id = ? AND user_id = ?');
    const info = stmt.run(substitutionId, userId);

    if (info.changes === 0) {
      return res.status(404).json({ message: 'Substitution not found or not owned by user' });
    }

    res.json({ message: 'Substitution deleted successfully' });
  } catch (err) {
    console.error('Error deleting substitution:', err.message);
    res.status(500).json({ message: 'Error deleting substitution' });
  }
});

export default router;
