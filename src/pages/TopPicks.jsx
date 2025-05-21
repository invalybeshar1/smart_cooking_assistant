import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { FaSearch, FaSpinner, FaChevronLeft, FaChevronRight, FaFilter } from 'react-icons/fa';

const MEAL_TYPES = ["Any", "Breakfast", "Lunch", "Dinner", "Snack", "Dessert"];
const DIETARY_PREFERENCES_OPTIONS = [
  { label: "Vegan", value: "vegan" },
  { label: "Vegetarian", value: "vegetarian" },
  { label: "Gluten-Free", value: "gluten-free" },
  { label: "Dairy-Free", value: "dairy-free" },
  { label: "Low Carb", value: "low-carb" },
];
const TIME_OPTIONS = [
  { label: "Any", value: "" },
  { label: "< 15 min", value: "15" },
  { label: "< 30 min", value: "30" },
  { label: "< 60 min", value: "60" },
  { label: "60+ min", value: "999" }, // Assuming 999 is a high enough "no limit" or adjust API
];

export default function TopPicks() {
  const [recipes, setRecipes] = useState([]);
  const [filters, setFilters] = useState({
    mealType: '',
    dietaryPreferences: [],
    maxTotalTime: '',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters); // To trigger fetch on apply
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecipes, setTotalRecipes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate(); // For clicking on recipe cards

  const fetchTopPicks = useCallback(async () => {
    setLoading(true);
    setError(null);
    let queryParams = new URLSearchParams();

    if (appliedFilters.mealType && appliedFilters.mealType !== "Any") {
      queryParams.append('mealType', appliedFilters.mealType.toLowerCase());
    }
    if (appliedFilters.dietaryPreferences.length > 0) {
      queryParams.append('dietaryPreferences', appliedFilters.dietaryPreferences.join(','));
    }
    if (appliedFilters.maxTotalTime) {
      queryParams.append('maxTotalTime', appliedFilters.maxTotalTime);
    }
    queryParams.append('page', currentPage.toString());
    queryParams.append('limit', '8'); // Fetch 8 recipes per page

    try {
      const response = await fetch(`/api/recipes/toppicks?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRecipes(data.recipes || []);
      setTotalPages(data.totalPages || 0);
      setTotalRecipes(data.totalRecipes || 0);
      // setCurrentPage(data.currentPage || 1); // API response includes currentPage
    } catch (err) {
      console.error("Error fetching top picks:", err);
      setError(err.message || "Failed to fetch recipes. Please try again later.");
      setRecipes([]); // Clear recipes on error
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, currentPage]);

  useEffect(() => {
    fetchTopPicks();
  }, [fetchTopPicks]); // Will run on mount and when appliedFilters or currentPage changes

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFilters(prev => {
      const newDietaryPreferences = checked
        ? [...prev.dietaryPreferences, value]
        : prev.dietaryPreferences.filter(pref => pref !== value);
      return { ...prev, dietaryPreferences: newDietaryPreferences };
    });
  };

  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to first page when filters change
    setAppliedFilters(filters); // This will trigger useEffect -> fetchTopPicks
  };
  
  const handleRecipeClick = (recipeId) => {
    navigate(`/recipe/${recipeId}`);
  };

  const renderPagination = () => (
    <div className="flex justify-center items-center space-x-4 my-8">
      <button
        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
        disabled={currentPage === 1 || loading}
        className="px-4 py-2 bg-[#F4A261] hover:bg-[#E76F51] text-white rounded-full text-sm disabled:opacity-50 flex items-center"
      >
        <FaChevronLeft className="mr-2" /> Previous
      </button>
      <span className="text-sm">
        Page {currentPage} of {totalPages || 1}
      </span>
      <button
        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
        disabled={currentPage === totalPages || totalPages === 0 || loading}
        className="px-4 py-2 bg-[#F4A261] hover:bg-[#E76F51] text-white rounded-full text-sm disabled:opacity-50 flex items-center"
      >
        Next <FaChevronRight className="ml-2" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDF6EC] dark:bg-[#1E1E1E] text-zinc-800 dark:text-white p-4 md:p-6">
      <h2 className="text-3xl font-bold mb-8 text-center text-[#E76F51]">Top Picks For You</h2>

      {/* Filters Section */}
      <div className="mb-8 p-4 sm:p-6 bg-white dark:bg-zinc-800 rounded-xl shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-end">
          {/* Meal Type */}
          <div>
            <label htmlFor="mealType" className="block text-sm font-medium mb-1">Meal Type</label>
            <select
              id="mealType"
              name="mealType"
              value={filters.mealType}
              onChange={handleFilterChange}
              className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-[#F4A261] focus:border-[#F4A261] dark:bg-zinc-700"
            >
              {MEAL_TYPES.map(type => <option key={type} value={type === "Any" ? "" : type.toLowerCase()}>{type}</option>)}
            </select>
          </div>

          {/* Max Total Time */}
          <div>
            <label htmlFor="maxTotalTime" className="block text-sm font-medium mb-1">Max Preparation Time</label>
            <select
              id="maxTotalTime"
              name="maxTotalTime"
              value={filters.maxTotalTime}
              onChange={handleFilterChange}
              className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-[#F4A261] focus:border-[#F4A261] dark:bg-zinc-700"
            >
              {TIME_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          
          {/* Dietary Preferences */}
          <div className="md:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium mb-1">Dietary Preferences</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DIETARY_PREFERENCES_OPTIONS.map(opt => (
                <label key={opt.value} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    value={opt.value}
                    checked={filters.dietaryPreferences.includes(opt.value)}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-[#F4A261] focus:ring-[#E76F51] border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 checked:bg-[#F4A261]"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 text-center">
          <button
            onClick={handleApplyFilters}
            disabled={loading}
            className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-md text-base font-medium shadow-md disabled:opacity-70 flex items-center justify-center mx-auto"
          >
            <FaFilter className="mr-2" /> Apply Filters
          </button>
        </div>
      </div>
      
      {/* Results Info */}
       <div className="mb-4 text-sm text-center text-zinc-600 dark:text-zinc-400">
        {totalRecipes > 0 && !loading && <span>Showing {recipes.length} of {totalRecipes} recipes.</span>}
      </div>


      {/* Content Area */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-4xl text-[#F4A261]" />
          <p className="ml-3 text-lg">Finding your top picks...</p>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 bg-red-100 dark:bg-red-900 dark:text-red-300 p-4 rounded-md">
          <p>Error: {error}</p>
          <button onClick={() => fetchTopPicks()} className="mt-2 px-3 py-1 bg-red-500 text-white rounded">Try Again</button>
        </div>
      ) : recipes.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => handleRecipeClick(recipe.id)} // Updated onClick
                className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg overflow-hidden flex flex-col justify-between cursor-pointer hover:shadow-xl transition-shadow duration-300"
              >
                <img
                  src={recipe.image_url || `https://via.placeholder.com/300x180?text=${encodeURIComponent(recipe.title)}`}
                  alt={recipe.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4 flex-grow">
                  <h3 className="text-lg font-semibold mb-1 text-[#E76F51] dark:text-[#F4A261]">{recipe.title}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 truncate">{recipe.description || "No description available."}</p>
                  <div className="text-xs space-y-0.5">
                    <p><strong>Calories:</strong> {recipe.calories || 'N/A'} kcal</p>
                    <p><strong>Prep:</strong> {recipe.prep_time_minutes || 'N/A'} min</p>
                    <p><strong>Cook:</strong> {recipe.cook_time_minutes || 'N/A'} min</p>
                    <p><strong>Total:</strong> {recipe.total_time_minutes || 'N/A'} min</p>
                  </div>
                </div>
                {/* Removed Enhance with AI button as it's not part of this page's core functionality */}
              </div>
            ))}
          </div>
          {renderPagination()}
        </>
      ) : (
        <p className="text-center text-lg text-zinc-500 dark:text-zinc-400 mt-10">
          No recipes found matching your criteria. Try adjusting your filters!
        </p>
      )}
    </div>
  );
}
