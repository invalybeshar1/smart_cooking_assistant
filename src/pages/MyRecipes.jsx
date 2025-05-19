import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MyRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [filter, setFilter] = useState('all');
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecipes = async () => {
      if (!user || !user.id) return;

      try {
        const res = await fetch(`http://localhost:5001/api/recipes?user_id=${user.id}`);
        const data = await res.json();
        setRecipes(data);
      } catch (err) {
        console.error('Failed to fetch saved recipes:', err);
      }
    };

    fetchRecipes();
  }, [user]);

  const getFilteredRecipes = () => {
    const today = new Date();
    return recipes.filter((recipe) => {
      const savedDate = new Date(recipe.created_at);
      const diffDays = Math.floor((today - savedDate) / (1000 * 60 * 60 * 24));
      if (filter === 'day') return diffDays === 0;
      if (filter === 'week') return diffDays <= 7;
      if (filter === 'month') return diffDays <= 30;
      return true;
    });
  };

  return (
    <div className="min-h-screen bg-[#FDF6EC] dark:bg-[#1E1E1E] text-zinc-800 dark:text-white p-6">
      <h2 className="text-2xl font-bold mb-6">My Recipes</h2>

      {/* Filter Controls */}
      <div className="mb-6 flex gap-3">
        {['all', 'day', 'week', 'month'].map((time) => (
          <button
            key={time}
            onClick={() => setFilter(time)}
            className={`px-4 py-1 rounded-full text-sm capitalize border ${
              filter === time
                ? 'bg-[#F4A261] text-white border-[#F4A261]'
                : 'bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-white'
            }`}
          >
            {time === 'all' ? 'All Time' : `Past ${time}`}
          </button>
        ))}
      </div>

      {/* Recipe List */}
      <div className="space-y-4">
        {getFilteredRecipes().map((recipe) => (
          <div
            key={recipe.id}
            onClick={() => navigate(`/recipe/${recipe.id}`)}
            className="cursor-pointer flex justify-between items-center bg-white dark:bg-zinc-800 rounded-full shadow-md px-6 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
          >
            <div>
              <h3 className="text-lg font-semibold">{recipe.title}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-300">
                Saved on: {new Date(recipe.created_at).toLocaleDateString()}
              </p>
            </div>
            <img
              src={`https://via.placeholder.com/100x100?text=${encodeURIComponent(
                recipe.title.split(' ')[0]
              )}`}
              alt={recipe.title}
              className="w-16 h-16 object-cover rounded-full border border-zinc-200 dark:border-zinc-600"
            />
          </div>
        ))}

        {getFilteredRecipes().length === 0 && (
          <p className="text-center text-zinc-500 dark:text-zinc-300 mt-6">
            No recipes found for this filter.
          </p>
        )}
      </div>
    </div>
  );
}
