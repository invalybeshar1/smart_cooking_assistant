import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart } from 'react-icons/fa'; // For the button

export default function MyRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedRecipes, setSelectedRecipes] = useState(new Set());
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [generateSuccess, setGenerateSuccess] = useState('');

  const user = JSON.parse(localStorage.getItem('user')); // Assuming user object has id
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecipes = async () => {
      // Ensure user and user.id are available
      const currentUser = JSON.parse(localStorage.getItem('user'));
      if (!currentUser || !currentUser.id) {
        console.log("User or user ID not found, skipping recipe fetch.");
        // Optionally, redirect to login or show a message
        // navigate('/login'); 
        return;
      }

      try {
        // Using a more robust way to get token, assuming it's stored
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            console.error('Authentication token not found.');
            setGenerateError('You need to be logged in to see your recipes.'); // Or navigate to login
            return;
        }
        // Fetch user-specific or saved recipes. The endpoint might differ based on API design.
        // This example assumes an endpoint that can filter by user_id or fetches user's saved recipes directly.
        const res = await fetch(`http://localhost:5001/api/recipes?user_id=${currentUser.id}`, {
             headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || `Failed to fetch recipes: ${res.status}`);
        }
        const data = await res.json();
        setRecipes(data);
      } catch (err) {
        console.error('Failed to fetch saved recipes:', err);
        setGenerateError(err.message || 'Could not load your recipes.');
      }
    };

    fetchRecipes();
  }, []); // Removed user from dependency array if it's not expected to change reactively here or fetched inside

  const handleRecipeSelect = (recipeId, event) => {
    event.stopPropagation(); // Prevent navigation when clicking checkbox
    setSelectedRecipes(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(recipeId)) {
        newSelected.delete(recipeId);
      } else {
        newSelected.add(recipeId);
      }
      return newSelected;
    });
  };

  const handleGenerateShoppingList = async () => {
    if (selectedRecipes.size === 0) {
      setGenerateError('Please select at least one recipe.');
      return;
    }
    setLoadingGenerate(true);
    setGenerateError('');
    setGenerateSuccess('');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (!token) {
      setGenerateError('Authentication token not found. Please log in again.');
      setLoadingGenerate(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5001/api/shopping-list/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ recipeIds: Array.from(selectedRecipes) }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Failed to generate shopping list: ${res.status}`);
      }
      
      setGenerateSuccess(`${data.message || 'Shopping list generated!'} (${data.itemCount} items). Navigating...`);
      setSelectedRecipes(new Set()); // Clear selection
      setTimeout(() => {
        navigate('/shopping-list');
      }, 2000); // Navigate after a short delay to show message

    } catch (err) {
      console.error('Error generating shopping list:', err);
      setGenerateError(err.message || 'An error occurred while generating the list.');
    } finally {
      setLoadingGenerate(false);
    }
  };

  const getFilteredRecipes = () => {
    const today = new Date();
    return recipes.filter((recipe) => {
      const savedDate = new Date(recipe.created_at); // Assuming created_at exists
      const diffDays = Math.floor((today - savedDate) / (1000 * 60 * 60 * 24));
      if (filter === 'day') return diffDays === 0;
      if (filter === 'week') return diffDays <= 7;
      if (filter === 'month') return diffDays <= 30;
      return true;
    });
  };
  
  const displayedRecipes = getFilteredRecipes();

  return (
    <div className="min-h-screen bg-[#FDF6EC] dark:bg-[#1E1E1E] text-zinc-800 dark:text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">My Recipes</h2>
        <button
          onClick={handleGenerateShoppingList}
          disabled={selectedRecipes.size === 0 || loadingGenerate}
          className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaShoppingCart className="mr-2" />
          {loadingGenerate ? 'Generating...' : `Generate List (${selectedRecipes.size})`}
        </button>
      </div>
      
      {generateError && <p className="text-red-500 bg-red-100 dark:bg-red-900 dark:text-red-300 p-3 rounded-md mb-4 text-sm">{generateError}</p>}
      {generateSuccess && <p className="text-green-500 bg-green-100 dark:bg-green-900 dark:text-green-300 p-3 rounded-md mb-4 text-sm">{generateSuccess}</p>}

      {/* Filter Controls */}
      <div className="mb-6 flex flex-wrap gap-3">
        {['all', 'day', 'week', 'month'].map((time) => (
          <button
            key={time}
            onClick={() => setFilter(time)}
            className={`px-4 py-1 rounded-full text-sm capitalize border ${
              filter === time
                ? 'bg-[#F4A261] text-white border-[#F4A261]'
                : 'bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-600'
            }`}
          >
            {time === 'all' ? 'All Time' : `Past ${time}`}
          </button>
        ))}
      </div>

      {/* Recipe List */}
      {recipes.length === 0 && !generateError && <p className="text-center text-zinc-500 dark:text-zinc-300 mt-10">You haven't saved any recipes yet.</p>}
      
      <div className="space-y-4">
        {displayedRecipes.map((recipe) => (
          <div
            key={recipe.id}
            onClick={() => navigate(`/recipe/${recipe.id}`)} // Main click navigates
            className="cursor-pointer flex justify-between items-center bg-white dark:bg-zinc-800 rounded-lg shadow-md px-4 py-3 hover:shadow-lg transition group"
          >
            <div className="flex items-center flex-grow">
              <input
                type="checkbox"
                checked={selectedRecipes.has(recipe.id)}
                onChange={(e) => handleRecipeSelect(recipe.id, e)}
                onClick={(e) => e.stopPropagation()} // Stop propagation for checkbox click too
                className="mr-4 h-5 w-5 text-[#F4A261] focus:ring-[#E76F51] border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 checked:bg-[#F4A261]"
              />
              <div className="flex-grow">
                <h3 className="text-lg font-semibold group-hover:text-[#F4A261]">{recipe.title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-300">
                  Saved on: {new Date(recipe.created_at || Date.now()).toLocaleDateString()} {/* Fallback for created_at */}
                </p>
              </div>
            </div>
            <img
              src={recipe.image_url || `https://via.placeholder.com/80x80?text=${encodeURIComponent(recipe.title.split(' ')[0])}`}
              alt={recipe.title}
              className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-md border border-zinc-200 dark:border-zinc-600 ml-4"
            />
          </div>
        ))}

        {recipes.length > 0 && displayedRecipes.length === 0 && (
          <p className="text-center text-zinc-500 dark:text-zinc-300 mt-6">
            No recipes found for this filter. Try selecting "All Time".
          </p>
        )}
      </div>
    </div>
  );
}
