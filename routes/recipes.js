import express from 'express';
import { askGemini } from './geminiService.js'; // Assuming geminiService.js is in the same /routes directory
import authMiddleware from '../middlewares/authMiddleware.js';
import db from '../db/database.js';

const router = express.Router();

// Helper function to format ingredients for the prompt
const formatIngredientsForPrompt = (recipeIngredients) => {
  if (!recipeIngredients || recipeIngredients.length === 0) {
    return "No specific ingredients listed.";
  }
  return recipeIngredients.map(ing => {
    if (typeof ing === 'string') return ing; // From recipes.ingredients JSON
    return `${ing.name}${ing.quantity ? ` (${ing.quantity})` : ''}`; // From recipe_ingredients table
  }).join(', ');
};

// POST /api/recipes/:id/modify
router.post('/:id/modify', authMiddleware, async (req, res) => {
  const recipeId = req.params.id;
  const userId = req.user.id;
  const { modification_prompt } = req.body;

  if (!modification_prompt) {
    return res.status(400).json({ message: 'Modification prompt is required.' });
  }

  try {
    // 1. Fetch Original Recipe
    const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: 'Original recipe not found.' });
    }

    let originalIngredientsList = [];
    if (recipe.ingredients && typeof recipe.ingredients === 'string') {
      try {
        const parsedIngredients = JSON.parse(recipe.ingredients);
        if (Array.isArray(parsedIngredients)) {
          originalIngredientsList = parsedIngredients.map(name => ({ name, quantity: null })); // Adapt to common structure
        }
      } catch (e) {
        console.error(`Error parsing recipe.ingredients JSON for recipe ${recipeId}: ${e.message}`);
        // Fallback or continue, depending on whether recipe_ingredients is always populated as an alternative
      }
    }

    if (originalIngredientsList.length === 0) {
      const ingredientsFromTable = db.prepare('SELECT name, quantity FROM recipe_ingredients WHERE recipe_id = ?').all(recipeId);
      originalIngredientsList = ingredientsFromTable.map(ing => ({ name: ing.name, quantity: ing.quantity }));
    }
    
    const originalIngredientsText = formatIngredientsForPrompt(originalIngredientsList);

    // 2. Fetch User Substitution Preferences
    const substitutionsRaw = db.prepare('SELECT original_ingredient_name, preferred_ingredient_name FROM user_ingredient_substitutions WHERE user_id = ?').all(userId);
    let substitutionsText = "User has no specific ingredient substitution preferences.";
    if (substitutionsRaw.length > 0) {
      substitutionsText = "User's ingredient preferences: " + substitutionsRaw.map(s => `Prefers '${s.preferred_ingredient_name}' instead of '${s.original_ingredient_name}'`).join('. ') + ".";
    }

    // 3. Construct Gemini Prompt
    const prompt = `
You are an AI chef assistant. The user wants to modify an existing recipe.
The original recipe is:
Title: ${recipe.title}
Description: ${recipe.description || 'No description provided.'}
Current Ingredients: ${originalIngredientsText}
Current Instructions: ${recipe.instructions || 'No instructions provided.'} 
${recipe.servings ? `Servings: ${recipe.servings}` : ''}
${recipe.prep_time ? `Prep Time: ${recipe.prep_time}` : ''}
${recipe.cook_time ? `Cook Time: ${recipe.cook_time}` : ''}

User's modification request: "${modification_prompt}"

${substitutionsText} Please take these general preferences into account if applicable to the ingredients.

Based on this, provide a complete, modified recipe.
Respond ONLY with a valid JSON object using the following format. Ensure all fields are filled appropriately:
{
  "title": "Modified Recipe Title",
  "description": "Brief description of the modified recipe",
  "ingredients": [ "ingredient 1 (include quantity if applicable, e.g., '1 cup flour')", "ingredient 2 (e.g., '100g chocolate')", ... ],
  "equipment": [ "equipment item 1", "equipment item 2", ... ],
  "servings": "e.g. 1-2 people",
  "time": {
    "prep": "e.g. 10 minutes",
    "cook": "e.g. 15 minutes",
    "total": "e.g. 25 minutes"
  },
  "instructions": [
    "Step 1: Detailed description...",
    "Step 2: Detailed description...",
    ...
  ],
  "notes": "Optional: any extra notes or tips for the modified recipe."
}

Ensure the ingredients list in the JSON includes quantities where appropriate.
Make each instruction step clear, friendly, and detailed.
Respond ONLY in JSON. No markdown. No explanations before or after the JSON.
    `;

    // 4. Call Gemini API
    const geminiResponse = await askGemini(prompt);
    
    // 5. Parse Response
    const cleanedResponse = geminiResponse.trim().replace(/^```json\n?|```$/g, '');
    let modifiedRecipeJson;
    try {
      modifiedRecipeJson = JSON.parse(cleanedResponse);
    } catch (err) {
      console.error('Invalid JSON from Gemini for recipe modification:', cleanedResponse);
      // Log this problematic response for debugging
      db.prepare('INSERT INTO ai_interactions (user_id, query, response, type, rating, feedback) VALUES (?, ?, ?, ?, ?, ?)')
        .run(userId, `Modification Request: ${modification_prompt} (Original Recipe ID: ${recipeId})`, cleanedResponse, 'recipe_modification_error', null, 'Gemini JSON parsing failed');
      return res.status(502).json({ message: 'AI failed to return valid recipe format. Please try again.' });
    }

    // 6. Log Interaction (Successful Interaction)
    db.prepare('INSERT INTO ai_interactions (user_id, query, response, type) VALUES (?, ?, ?, ?)')
      .run(userId, `Modification Request: ${modification_prompt} (Original Recipe ID: ${recipeId}, Title: ${recipe.title})`, cleanedResponse, 'recipe_modification');

    // 7. Return Modified Recipe
    res.status(200).json(modifiedRecipeJson);

  } catch (error) {
    console.error('Error modifying recipe with AI:', error);
    // Log generic error to ai_interactions as well? Maybe not if it's not a Gemini response issue.
    res.status(500).json({ message: 'Failed to modify recipe due to an internal server error.' });
  }
});

// It's good practice to also include the GET /api/recipes and GET /api/recipes/:id endpoints here
// For now, focusing on the modify endpoint as per the task.
// Example:
router.get('/', (req, res) => {
    const { user_id, search } = req.query;
    let query = 'SELECT id, title, description, image_url, is_user_generated, status, author_id, created_at FROM recipes WHERE status = ?';
    const params = ['approved'];

    if (user_id) {
        query += ' AND author_id = ?';
        params.push(user_id);
    }
    if (search) {
        query += ' AND (title LIKE ? OR description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY created_at DESC';

    try {
        const recipes = db.prepare(query).all(...params);
        res.json(recipes);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching recipes', error: err.message });
    }
});

router.get('/:id', (req, res) => {
    const recipeId = req.params.id;
    try {
        const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }
        // Fetch ingredients separately if needed, especially if not in JSON format or for detailed view
        const ingredients = db.prepare('SELECT name, quantity FROM recipe_ingredients WHERE recipe_id = ?').all(recipeId);
        // For user-generated recipes, ingredients might be in recipe.ingredients (JSON string)
        let parsedIngredients = [];
        if (recipe.ingredients && typeof recipe.ingredients === 'string') {
            try {
                parsedIngredients = JSON.parse(recipe.ingredients);
            } catch (e) {
                console.error("Error parsing recipe.ingredients JSON", e);
            }
        }
        
        res.json({ ...recipe, ingredients_detail: ingredients, ingredients_json: parsedIngredients });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching recipe details', error: err.message });
    }
});


export default router;
