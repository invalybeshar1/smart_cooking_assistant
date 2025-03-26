import { useState } from 'react';

const dummyRecipes = [
  'Grilled Salmon Bowl',
  'Avocado Smoothie',
  'Vegan Tacos',
];

const recipeIngredientsMap = {
  'Grilled Salmon Bowl': [
    { name: 'Salmon fillet', category: 'Protein' },
    { name: 'Brown rice', category: 'Grains' },
    { name: 'Spinach', category: 'Vegetables' },
    { name: 'Lemon', category: 'Produce' },
  ],
  'Avocado Smoothie': [
    { name: 'Avocado', category: 'Produce' },
    { name: 'Banana', category: 'Produce' },
    { name: 'Almond milk', category: 'Dairy Alternatives' },
    { name: 'Honey', category: 'Pantry' },
  ],
  'Vegan Tacos': [
    { name: 'Tortillas', category: 'Grains' },
    { name: 'Black beans', category: 'Canned Goods' },
    { name: 'Corn', category: 'Vegetables' },
    { name: 'Avocado', category: 'Produce' },
    { name: 'Salsa', category: 'Condiments' },
  ],
};

export default function ShoppingList() {
  const [selectedRecipes, setSelectedRecipes] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [checkedItems, setCheckedItems] = useState([]);

  const handleAddRecipe = (recipe) => {
    if (!selectedRecipes.includes(recipe)) {
      const ingredients = recipeIngredientsMap[recipe] || [];
      const updatedList = [...shoppingList];
      ingredients.forEach((item) => {
        if (!updatedList.some((i) => i.name === item.name)) {
          updatedList.push(item);
        }
      });
      setSelectedRecipes([...selectedRecipes, recipe]);
      setShoppingList(updatedList);
    }
  };

  const handleRemoveItem = (itemName) => {
    setShoppingList(shoppingList.filter((i) => i.name !== itemName));
    setCheckedItems(checkedItems.filter((i) => i !== itemName));
  };

  const toggleCheck = (itemName) => {
    setCheckedItems((prev) =>
      prev.includes(itemName) ? prev.filter((i) => i !== itemName) : [...prev, itemName]
    );
  };

  const categorizedList = shoppingList.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-orange-50 p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Your Shopping List</h2>

      {/* Recipe Selector */}
      <div className="mb-6">
        <label className="block mb-2 font-medium">Select a recipe to cook:</label>
        <div className="flex gap-3 flex-wrap">
          {dummyRecipes.map((recipe) => (
            <button
              key={recipe}
              onClick={() => handleAddRecipe(recipe)}
              className={`px-4 py-2 rounded-full border text-sm ${
                selectedRecipes.includes(recipe)
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-white border-zinc-300 text-zinc-700'
              }`}
            >
              {recipe}
            </button>
          ))}
        </div>
      </div>

      {/* Shopping List Items */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="text-lg font-semibold mb-3">Ingredients Needed</h3>
        {shoppingList.length === 0 ? (
          <p className="text-zinc-500 text-sm">No items in your shopping list yet.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(categorizedList).map(([category, items]) => (
              <div key={category}>
                <h4 className="text-md font-semibold mb-2 border-b pb-1">{category}</h4>
                <ul className="space-y-2">
                  {items.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checkedItems.includes(item.name)}
                          onChange={() => toggleCheck(item.name)}
                        />
                        <span className={checkedItems.includes(item.name) ? 'line-through text-zinc-400' : ''}>
                          {item.name}
                        </span>
                      </label>
                      <button
                        onClick={() => handleRemoveItem(item.name)}
                        className="text-red-500 hover:underline text-xs"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}