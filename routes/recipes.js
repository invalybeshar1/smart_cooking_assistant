import express from 'express';
import { askGemini } from './geminiService.js'; // Corrected path
import authMiddleware from '../middlewares/authMiddleware.js';
import db from '../db/database.js';

const router = express.Router();

// Helper function to parse ingredient strings
const parseIngredientString = (ingredientStr) => {
    if (!ingredientStr || typeof ingredientStr !== 'string') {
        return { name: null, quantity: null };
    }
    const regex = /^(\d+\s*\d*\/\d+|\d+)\s*([a-zA-Zμµ]*\.?)\s*(.*)/i;
    const match = ingredientStr.match(regex);
    if (match && match[3]) {
        const quantity = `${match[1]}${match[2] ? ' ' + match[2].trim() : ''}`.trim();
        return { name: match[3].trim(), quantity: quantity };
    }
    return { name: ingredientStr.trim(), quantity: null };
};

// POST /api/recipes (Create/Save Recipe)
router.post('/', authMiddleware, (req, res) => {
  const {
    title, description, image_url, ingredients, equipment,
    servings, instructions, prep_time_minutes,
    cook_time_minutes, total_time_minutes,
  } = req.body;
  const author_id = req.user.id;

  if (!title || !ingredients || !instructions || !author_id) {
    return res.status(400).json({ message: 'Missing required fields: title, ingredients, instructions, author_id.' });
  }
  if (!Array.isArray(ingredients) || !Array.isArray(instructions)) {
    return res.status(400).json({ message: 'Ingredients and instructions must be arrays.' });
  }

  try {
    const recipeInsertStmt = db.prepare(
      `INSERT INTO recipes (
        title, description, image_url, is_user_generated, status, author_id,
        prep_time_minutes, cook_time_minutes, total_time_minutes,
        created_at, ingredients, equipment, instructions, servings
      ) VALUES (?, ?, ?, 1, 'approved', ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?)`
    );
    const result = recipeInsertStmt.run(
      title, description || null, image_url || null, author_id,
      prep_time_minutes || null, cook_time_minutes || null, total_time_minutes || null,
      JSON.stringify(ingredients), JSON.stringify(equipment || []),
      JSON.stringify(instructions), servings || null
    );
    const recipeId = result.lastInsertRowid;

    if (ingredients.length > 0) {
      const ingredientInsertStmt = db.prepare(
        'INSERT INTO recipe_ingredients (recipe_id, name, quantity) VALUES (?, ?, ?)'
      );
      for (const ingStr of ingredients) {
        const parsedIng = parseIngredientString(ingStr);
        if (parsedIng.name) {
          ingredientInsertStmt.run(recipeId, parsedIng.name, parsedIng.quantity);
        }
      }
    }
    db.prepare(
        `INSERT INTO recipe_nutrition (recipe_id, calories, protein, carbs, fats)
         VALUES (?, NULL, NULL, NULL, NULL)`
      ).run(recipeId);

    const newRecipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
    const recipeIngredientsData = db.prepare('SELECT name, quantity FROM recipe_ingredients WHERE recipe_id = ?').all(recipeId);
    res.status(201).json({ ...newRecipe, recipe_ingredients: recipeIngredientsData });
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({ message: 'Failed to create recipe.' });
  }
});

// POST /api/recipes/:id/modify (AI Recipe Modification)
router.post('/:id/modify', authMiddleware, async (req, res) => {
  const recipeId = req.params.id;
  const userId = req.user.id;
  const { modification_prompt } = req.body;

  if (!modification_prompt) {
    return res.status(400).json({ message: 'Modification prompt is required.' });
  }
  try {
    const originalRecipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
    if (!originalRecipe) {
      return res.status(404).json({ message: 'Original recipe not found.' });
    }
    let originalIngredientsList = [];
    if (originalRecipe.ingredients && typeof originalRecipe.ingredients === 'string') {
        try {
            const parsed = JSON.parse(originalRecipe.ingredients);
            if (Array.isArray(parsed)) {
                originalIngredientsList = parsed.map(ingStr => parseIngredientString(ingStr));
            }
        } catch (e) { console.warn(`Could not parse recipes.ingredients JSON for recipe ${recipeId}: ${e.message}`); }
    }
    if (originalIngredientsList.length === 0) {
        originalIngredientsList = db.prepare('SELECT name, quantity FROM recipe_ingredients WHERE recipe_id = ?').all(recipeId);
    }
    const originalIngredientsText = originalIngredientsList.map(ing => `${ing.name}${ing.quantity ? ` (${ing.quantity})` : ''}`).join(', ') || "No ingredients listed.";
    const originalInstructionsText = Array.isArray(originalRecipe.instructions) ? originalRecipe.instructions.join('; ') : (typeof originalRecipe.instructions === 'string' ? originalRecipe.instructions : "No instructions provided.");

    const substitutionsRaw = db.prepare('SELECT original_ingredient_name, preferred_ingredient_name FROM user_ingredient_substitutions WHERE user_id = ?').all(userId);
    let substitutionsText = "User has no specific ingredient substitution preferences.";
    if (substitutionsRaw.length > 0) {
      substitutionsText = "User's ingredient preferences: " + substitutionsRaw.map(s => `Prefers '${s.preferred_ingredient_name}' instead of '${s.original_ingredient_name}'`).join('. ') + ".";
    }
    const prompt = `
You are an AI chef assistant. The user wants to modify an existing recipe.
Original recipe: Title: ${originalRecipe.title}, Desc: ${originalRecipe.description || 'N/A'}, Ingredients: ${originalIngredientsText}, Instructions: ${originalInstructionsText}, Servings: ${originalRecipe.servings || 'N/A'}, Prep Time: ${originalRecipe.prep_time_minutes || 'N/A'} min, Cook Time: ${originalRecipe.cook_time_minutes || 'N/A'} min, Total Time: ${originalRecipe.total_time_minutes || 'N/A'} min.
User's modification request: "${modification_prompt}"
${substitutionsText}
Respond ONLY with a valid JSON object using the format:
{
  "title": "Modified Title", "description": "Modified Desc",
  "ingredients": ["qty unit ingredient", ...], "equipment": ["item1", ...],
  "servings": "x people", "prep_time_minutes": INTEGER, "cook_time_minutes": INTEGER, "total_time_minutes": INTEGER,
  "instructions": ["Step 1...", ...], "notes": "Optional notes."
}
Ensure times are integers. Respond ONLY in JSON. No markdown.`;

    const geminiResponse = await askGemini(prompt);
    const cleanedResponse = geminiResponse.trim().replace(/^```json\n?|```$/g, '');
    let modifiedRecipeJson;
    try {
      modifiedRecipeJson = JSON.parse(cleanedResponse);
    } catch (err) {
      console.error('Invalid JSON from Gemini:', cleanedResponse);
      db.prepare('INSERT INTO ai_interactions (user_id, query, response, type, feedback) VALUES (?, ?, ?, ?, ?)')
        .run(userId, `Mod Prompt: ${modification_prompt} (Orig ID: ${recipeId})`, cleanedResponse, 'recipe_modification_error', 'Gemini JSON parsing failed');
      return res.status(502).json({ message: 'AI response format error.' });
    }
    db.prepare('INSERT INTO ai_interactions (user_id, query, response, type) VALUES (?, ?, ?, ?)')
      .run(userId, `Mod Prompt: ${modification_prompt} (Orig ID: ${recipeId})`, cleanedResponse, 'recipe_modification');
    res.status(200).json(modifiedRecipeJson);
  } catch (error) {
    console.error('Error modifying recipe with AI:', error);
    res.status(500).json({ message: 'Failed to modify recipe.' });
  }
});

// GET /api/recipes (Get All Recipes - existing)
router.get('/', (req, res) => {
  const { search, author_id } = req.query;
  let query = 'SELECT id, title, description, image_url, is_user_generated, status, author_id, created_at, prep_time_minutes, cook_time_minutes, total_time_minutes, servings FROM recipes WHERE status = ?';
  const params = ['approved'];
  if (author_id) {
      query += ' AND author_id = ?';
      params.push(author_id);
  }
  if (search) {
      query += ' AND (LOWER(title) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?))';
      params.push(`%${search}%`, `%${search}%`);
  }
  query += ' ORDER BY created_at DESC';
  try {
    const recipes = db.prepare(query).all(...params);
    res.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ message: 'Failed to fetch recipes.' });
  }
});

// GET /api/recipes/toppicks (New Endpoint)
router.get('/toppicks', (req, res) => {
    const { mealType, dietaryPreferences, maxTotalTime } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    let conditions = [];
    let params = [];
    let countParams = []; // Separate params for count query if structure differs significantly

    let baseSelect = `
        SELECT DISTINCT r.id, r.title, r.description, r.image_url, 
               r.prep_time_minutes, r.cook_time_minutes, r.total_time_minutes,
               rn.calories
        FROM recipes r
        LEFT JOIN recipe_nutrition rn ON r.id = rn.recipe_id
    `;
    let countSelect = `SELECT COUNT(DISTINCT r.id) as totalRecipes FROM recipes r`;
    
    let joins = ` LEFT JOIN recipe_nutrition rn_count ON r.id = rn_count.recipe_id `; // For count query

    if (maxTotalTime) {
        conditions.push('r.total_time_minutes <= ?');
        params.push(parseInt(maxTotalTime, 10));
        countParams.push(parseInt(maxTotalTime, 10));
    }

    if (mealType) {
        // Using EXISTS for mealType
        conditions.push('EXISTS (SELECT 1 FROM recipe_tags rt_meal WHERE rt_meal.recipe_id = r.id AND rt_meal.tag = ?)');
        params.push(mealType);
        countParams.push(mealType);
        // No extra join needed in baseSelect for EXISTS, but might be needed for count if not careful
    }

    const dietaryPrefsArray = dietaryPreferences ? dietaryPreferences.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    if (dietaryPrefsArray.length > 0) {
        // For each dietary preference, ensure a tag exists.
        // This requires joining recipe_tags for each preference or using a subquery with COUNT.
        // For simplicity with dynamic query building for "AND" logic:
        dietaryPrefsArray.forEach((pref, index) => {
            const alias = `rt_diet${index}`;
            baseSelect += ` JOIN recipe_tags ${alias} ON r.id = ${alias}.recipe_id AND ${alias}.tag = ? `;
            countSelect += ` JOIN recipe_tags ${alias}_count ON r.id = ${alias}_count.recipe_id AND ${alias}_count.tag = ? `;
            joins += ` JOIN recipe_tags ${alias}_joins_count ON r.id = ${alias}_joins_count.recipe_id AND ${alias}_joins_count.tag = ? `; // for count query
            params.push(pref);
            countParams.push(pref);
        });
    }
    
    let whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
    
    // Construct and execute count query
    const finalCountQuery = countSelect + (dietaryPrefsArray.length > 0 ? '' : joins) + whereClause; // Adjust join logic for count
    // The join logic for count query with dietary prefs needs to be accurate.
    // If dietaryPrefsArray.length > 0, joins are already added to countSelect. Otherwise, use 'joins'.
    // This is getting complex, let's simplify dietary for count or ensure joins are correctly aliased for count.

    // Simpler count for now, can be refined if performance is an issue
    // This count might be an overestimate if dietary preferences are "ANDed" in the main query via multiple JOINs
    // A more accurate count would fully replicate the join and where structure.
    // For now:
    let simplifiedCountQuery = `SELECT COUNT(DISTINCT r.id) as totalRecipes FROM recipes r `;
    let simplifiedCountJoins = ` LEFT JOIN recipe_nutrition rn ON r.id = rn.recipe_id `; // rn only for consistency, not strictly needed for count
    
    if (dietaryPrefsArray.length > 0) {
      dietaryPrefsArray.forEach((pref, index) => {
        simplifiedCountJoins += ` JOIN recipe_tags rt_diet_count_${index} ON r.id = rt_diet_count_${index}.recipe_id AND rt_diet_count_${index}.tag = ? `;
      });
    }
    simplifiedCountQuery += simplifiedCountJoins + whereClause;


    try {
        const totalResult = db.prepare(simplifiedCountQuery).get(...countParams); // Use countParams
        const totalRecipes = totalResult.totalRecipes;
        const totalPages = Math.ceil(totalRecipes / limit);

        // Construct and execute data query
        const dataQuery = baseSelect + whereClause + ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        const recipes = db.prepare(dataQuery).all(...params);

        res.json({
            recipes,
            currentPage: page,
            totalPages,
            totalRecipes
        });

    } catch (error) {
        console.error('Error fetching top picks recipes:', error);
        res.status(500).json({ message: 'Failed to fetch top picks.' });
    }
});


// GET /api/recipes/:id (Get Single Recipe - existing)
router.get('/:id', (req, res) => {
  const recipeId = req.params.id;
  try {
    const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found.' });
    }
    const ingredientsData = db.prepare('SELECT name, quantity FROM recipe_ingredients WHERE recipe_id = ?').all(recipeId);
    const recipeWithDetails = { ...recipe, ingredients_detail: ingredientsData };
    try {
        if (recipeWithDetails.instructions && typeof recipeWithDetails.instructions === 'string') {
            recipeWithDetails.instructions = JSON.parse(recipeWithDetails.instructions);
        }
        if (recipeWithDetails.equipment && typeof recipeWithDetails.equipment === 'string') {
            recipeWithDetails.equipment = JSON.parse(recipeWithDetails.equipment);
        }
    } catch (e) { console.warn(`Error parsing JSON fields for recipe ${recipeId}: ${e.message}`); }
    res.json(recipeWithDetails);
  } catch (error) {
    console.error(`Error fetching recipe ${recipeId}:`, error);
    res.status(500).json({ message: 'Failed to fetch recipe.' });
  }
});

export default router;