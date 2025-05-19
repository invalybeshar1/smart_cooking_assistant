import express from 'express';
import db from '../db/database.js';

const router = express.Router();

router.post('/save', async (req, res) => {
  const {
    user_id,
    title,
    ingredients,
    equipment,
    servings,
    time,
    instructions
  } = req.body;

  console.log('Incoming save request with body:', req.body);

  if (!user_id || !title || !ingredients || !instructions) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const existing = await db.get('SELECT id FROM recipes WHERE title = ?', [title]);

    let recipeId;
    if (existing) {
      recipeId = existing.id;
    } else {
      const insert = await db.run(
        `INSERT INTO recipes (
          title, description, image_url, is_user_generated, status, author_id,
          ingredients, equipment, instructions, servings,
          prep_time, cook_time, total_time
        ) VALUES (?, ?, ?, 1, 'approved', ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title,
          '', '',
          user_id,
          JSON.stringify(ingredients),
          JSON.stringify(equipment),
          JSON.stringify(instructions),
          servings || 'N/A',
          time?.prep || 'N/A',
          time?.cook || 'N/A',
          time?.total || 'N/A'
        ]
      );
      recipeId = insert.lastID;

      await db.run(
        `INSERT INTO recipe_nutrition (recipe_id, calories, protein, carbs, fats)
         VALUES (?, NULL, NULL, NULL, NULL)`,
        [recipeId]
      );
    }

    await db.run(
      `INSERT OR IGNORE INTO user_saved_recipes (user_id, recipe_id)
       VALUES (?, ?)`,
      [user_id, recipeId]
    );

    res.json({ success: true, recipeId });
  } catch (err) {
    console.error('Error saving recipe:', err.message);
    res.status(500).json({ error: 'Failed to save recipe' });
  }
});

router.get('/', async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) return res.status(400).json({ error: 'Missing user_id' });

  try {
    const rows = await db.all(`
      SELECT r.id, r.title, r.description, r.created_at,
             json_group_array(DISTINCT ri.name || ' ' || IFNULL(ri.quantity, '')) AS ingredients
      FROM user_saved_recipes usr
      JOIN recipes r ON usr.recipe_id = r.id
      LEFT JOIN recipe_ingredients ri ON ri.recipe_id = r.id
      WHERE usr.user_id = ?
      GROUP BY r.id
      ORDER BY usr.saved_at DESC
    `, [user_id]);

    res.json(rows);
  } catch (err) {
    console.error('Error fetching recipes:', err.message);
    res.status(500).json({ error: 'Failed to fetch saved recipes' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const recipe = await db.get('SELECT * FROM recipes WHERE id = ?', [id]);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    res.json(recipe);
  } catch (err) {
    console.error('Error fetching recipe by ID:', err.message);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

export default router;
