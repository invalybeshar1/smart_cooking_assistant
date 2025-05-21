import express from 'express';
import db from '../db/database.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// GET /api/shopping-list - Fetch all shopping list items for the user
router.get('/', authMiddleware, (req, res) => {
  const userId = req.user.id;
  try {
    const items = db.prepare(
      'SELECT id, name, quantity, category, source_recipe_id, is_purchased FROM shopping_list_items WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId);
    res.json(items);
  } catch (error) {
    console.error('Error fetching shopping list items:', error);
    res.status(500).json({ message: 'Failed to fetch shopping list items.' });
  }
});

// PUT /api/shopping-list/items/:itemId - Update is_purchased status
router.put('/items/:itemId', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { itemId } = req.params;
  const { is_purchased } = req.body;

  if (typeof is_purchased !== 'boolean') {
    return res.status(400).json({ message: 'is_purchased must be a boolean.' });
  }

  try {
    const stmt = db.prepare(
      'UPDATE shopping_list_items SET is_purchased = ? WHERE id = ? AND user_id = ?'
    );
    const info = stmt.run(is_purchased ? 1 : 0, itemId, userId);

    if (info.changes === 0) {
      return res.status(404).json({ message: 'Item not found or not owned by user.' });
    }
    res.json({ message: 'Item updated successfully.' });
  } catch (error) {
    console.error('Error updating shopping list item:', error);
    res.status(500).json({ message: 'Failed to update item.' });
  }
});

// DELETE /api/shopping-list/items/:itemId - Delete an item
router.delete('/items/:itemId', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { itemId } = req.params;

  try {
    const stmt = db.prepare(
      'DELETE FROM shopping_list_items WHERE id = ? AND user_id = ?'
    );
    const info = stmt.run(itemId, userId);

    if (info.changes === 0) {
      return res.status(404).json({ message: 'Item not found or not owned by user.' });
    }
    res.json({ message: 'Item deleted successfully.' });
  } catch (error) {
    console.error('Error deleting shopping list item:', error);
    res.status(500).json({ message: 'Failed to delete item.' });
  }
});


// POST /api/shopping-list/generate
router.post('/generate', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { recipeIds } = req.body;

  if (!Array.isArray(recipeIds) || recipeIds.length === 0) {
    return res.status(400).json({ message: 'recipeIds must be a non-empty array.' });
  }

  try {
    const allIngredients = [];

    // Fetch ingredients for each recipe
    for (const recipeId of recipeIds) {
      const recipe = db.prepare('SELECT id, title, ingredients FROM recipes WHERE id = ?').get(recipeId);
      if (!recipe) {
        console.warn(`Recipe with id ${recipeId} not found. Skipping.`);
        continue; 
      }

      let recipeSpecificIngredients = [];
      if (recipe.ingredients && typeof recipe.ingredients === 'string') {
        try {
          const parsedIngredients = JSON.parse(recipe.ingredients);
          if (Array.isArray(parsedIngredients)) {
            parsedIngredients.forEach(name => {
              if (typeof name === 'string' && name.trim() !== '') { // Ensure name is a non-empty string
                recipeSpecificIngredients.push({ name: name.trim(), quantity: null, source_recipe_id: recipe.id });
              }
            });
          }
        } catch (parseError) {
          console.error(`Error parsing ingredients JSON for recipe ${recipeId}: ${parseError.message}. Falling back to recipe_ingredients table.`);
        }
      }
      
      if (recipeSpecificIngredients.length === 0) {
        const ingredientsFromTable = db.prepare('SELECT name, quantity FROM recipe_ingredients WHERE recipe_id = ?').all(recipeId);
        ingredientsFromTable.forEach(ing => {
          if (typeof ing.name === 'string' && ing.name.trim() !== '') { // Ensure name is a non-empty string
             recipeSpecificIngredients.push({ name: ing.name.trim(), quantity: ing.quantity, source_recipe_id: recipe.id });
          }
        });
      }
      allIngredients.push(...recipeSpecificIngredients);
    }

    if (allIngredients.length === 0) {
      // It's possible that recipes exist but have no ingredients listed, or ingredients were empty strings.
      // In this case, we should inform the user no items were added.
      // We can either delete old list and return empty, or just return a message.
      // For consistency, let's proceed to clear the old list and effectively generate an empty one.
      db.prepare('DELETE FROM shopping_list_items WHERE user_id = ?').run(userId);
      return res.status(200).json({ message: 'No ingredients found for the selected recipes. Shopping list is empty.', itemCount: 0 });
    }

    // Fetch user substitutions
    const userSubstitutionsRaw = db.prepare('SELECT original_ingredient_name, preferred_ingredient_name FROM user_ingredient_substitutions WHERE user_id = ?').all(userId);
    const substitutionsMap = {};
    userSubstitutionsRaw.forEach(sub => {
      substitutionsMap[sub.original_ingredient_name.toLowerCase()] = sub.preferred_ingredient_name;
    });

    const processedIngredientsMap = new Map(); 

    for (const ingredient of allIngredients) {
      let currentName = ingredient.name; // Already trimmed
      const preferredName = substitutionsMap[currentName.toLowerCase()];
      if (preferredName) {
        currentName = preferredName;
      }

      if (!processedIngredientsMap.has(currentName)) {
        processedIngredientsMap.set(currentName, {
          name: currentName,
          quantity: ingredient.quantity, 
          category: 'Uncategorized', 
          source_recipe_id: ingredient.source_recipe_id 
        });
      }
    }
    
    const finalIngredientsList = Array.from(processedIngredientsMap.values());

    const populateShoppingList = db.transaction(() => {
      db.prepare('DELETE FROM shopping_list_items WHERE user_id = ?').run(userId);

      if (finalIngredientsList.length === 0) {
        // This should ideally be caught by the allIngredients.length === 0 check earlier,
        // but as a safeguard for the transaction.
        return { itemCount: 0 };
      }

      const insertStmt = db.prepare(
        'INSERT INTO shopping_list_items (user_id, name, quantity, category, source_recipe_id, is_purchased, created_at) VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)'
      );
      for (const item of finalIngredientsList) {
        insertStmt.run(userId, item.name, item.quantity, item.category, item.source_recipe_id);
      }
      return { itemCount: finalIngredientsList.length };
    });

    const result = populateShoppingList();
    
    if (result.itemCount === 0) {
        // This means finalIngredientsList was empty, perhaps due to all names being empty strings after processing.
        return res.status(200).json({ message: 'No valid ingredients to add. Shopping list is empty.', itemCount: 0 });
    }

    res.status(201).json({ message: 'Shopping list generated successfully.', itemCount: result.itemCount });

  } catch (error) {
    console.error('Error generating shopping list:', error);
    res.status(500).json({ message: 'Failed to generate shopping list.' });
  }
});

export default router;
