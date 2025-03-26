const topPicks = [
    {
      id: 1,
      name: 'Grilled Salmon Bowl',
      chef: 'Chef Elena',
      calories: 520,
      image: 'https://via.placeholder.com/300x180?text=Salmon',
    },
    {
      id: 2,
      name: 'Mediterranean Quinoa',
      chef: 'Chef Marco',
      calories: 430,
      image: 'https://via.placeholder.com/300x180?text=Quinoa',
    },
    {
      id: 3,
      name: 'Vegan Tacos',
      chef: 'Chef Rosa',
      calories: 390,
      image: 'https://via.placeholder.com/300x180?text=Tacos',
    },
    {
      id: 4,
      name: 'Avocado Smoothie',
      chef: 'Chef Theo',
      calories: 310,
      image: 'https://via.placeholder.com/300x180?text=Smoothie',
    },
  ];
  
  export default function TopPicks() {
    return (
      <div className="min-h-screen bg-orange-50 p-6">
        <h2 className="text-2xl font-bold mb-6">Top Picks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topPicks.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col justify-between"
            >
              <img
                src={recipe.image}
                alt={recipe.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-1">{recipe.name}</h3>
                <p className="text-sm text-zinc-600">By {recipe.chef}</p>
                <p className="text-sm text-zinc-500 mt-1">{recipe.calories} kcal</p>
                <div className="flex justify-end mt-4">
                  <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full text-sm">
                    Enhance with AI
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  