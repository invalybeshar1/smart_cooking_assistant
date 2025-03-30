import { useState } from 'react';

const dummyRecipes = [
  {
    id: 1,
    name: 'Spaghetti Carbonara',
    date: '2025-03-25',
    image: 'https://via.placeholder.com/100x100?text=Carbonara',
  },
  {
    id: 2,
    name: 'Avocado Toast',
    date: '2025-03-24',
    image: 'https://via.placeholder.com/100x100?text=Toast',
  },
  {
    id: 3,
    name: 'Quinoa Salad',
    date: '2025-03-20',
    image: 'https://via.placeholder.com/100x100?text=Salad',
  },
];

export default function MyRecipes() {
  const [filter, setFilter] = useState('all');

  const getFilteredRecipes = () => {
    const today = new Date();
    return dummyRecipes.filter((recipe) => {
      const recipeDate = new Date(recipe.date);
      const diffDays = Math.floor((today - recipeDate) / (1000 * 60 * 60 * 24));
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
              filter === time ? 'bg-[#F4A261] text-white border-[#F4A261]' : 'bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-white'
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
            className="flex justify-between items-center bg-white dark:bg-zinc-800 rounded-full shadow-md px-6 py-3"
          >
            <div>
              <h3 className="text-lg font-semibold">{recipe.name}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-300">Saved on: {recipe.date}</p>
            </div>
            <img
              src={recipe.image}
              alt={recipe.name}
              className="w-16 h-16 object-cover rounded-full border border-zinc-200 dark:border-zinc-600"
            />
          </div>
        ))}
        {getFilteredRecipes().length === 0 && (
          <p className="text-center text-zinc-500 dark:text-zinc-300 mt-6">No recipes found for this filter.</p>
        )}
      </div>
    </div>
  );
}
