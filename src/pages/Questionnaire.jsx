import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const dietaryOptions = ['Vegetarian', 'Vegan', 'Low-Carb', 'High-Protein', 'Keto', 'Pescatarian'];
const commonAllergies = ['Nuts', 'Shellfish', 'Gluten', 'Dairy', 'Eggs'];
const intolerances = ['Lactose', 'Fructose', 'Gluten'];

export default function Questionnaire() {
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [selectedIntolerances, setSelectedIntolerances] = useState([]);
  const [calorieGoal, setCalorieGoal] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const toggleSelection = (value, list, setList) => {
    if (list.includes(value)) {
      setList(list.filter((item) => item !== value));
    } else {
      setList([...list, value]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!calorieGoal) {
      setError('Please enter a calorie goal.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('User not authenticated.');
      return;
    }

    try {
      const res = await fetch('/api/questionnaire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          preferences: selectedPreferences,
          allergies: selectedAllergies,
          intolerances: selectedIntolerances,
          calorieGoal,
        }),
      });

      if (!res.ok) throw new Error('Failed to save preferences');

      navigate('/home');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF6EC] dark:bg-[#1E1E1E] text-zinc-800 dark:text-white p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Tell Us About Your Preferences</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dietary Preferences */}
        <section>
          <h3 className="font-semibold mb-2">Dietary Preferences</h3>
          <div className="flex flex-wrap gap-3">
            {dietaryOptions.map((pref) => (
              <button
                key={pref}
                type="button"
                onClick={() => toggleSelection(pref, selectedPreferences, setSelectedPreferences)}
                className={`px-4 py-2 rounded-full text-sm border ${
                  selectedPreferences.includes(pref)
                    ? 'bg-[#F4A261] text-white border-[#F4A261]'
                    : 'bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-500 text-zinc-700 dark:text-white'
                }`}
              >
                {pref}
              </button>
            ))}
          </div>
        </section>

        {/* Allergies */}
        <section>
          <h3 className="font-semibold mb-2">Allergies</h3>
          <div className="flex flex-wrap gap-3">
            {commonAllergies.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggleSelection(item, selectedAllergies, setSelectedAllergies)}
                className={`px-4 py-2 rounded-full text-sm border ${
                  selectedAllergies.includes(item)
                    ? 'bg-red-500 text-white border-red-500'
                    : 'bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-500 text-zinc-700 dark:text-white'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {/* Intolerances */}
        <section>
          <h3 className="font-semibold mb-2">Intolerances</h3>
          <div className="flex flex-wrap gap-3">
            {intolerances.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggleSelection(item, selectedIntolerances, setSelectedIntolerances)}
                className={`px-4 py-2 rounded-full text-sm border ${
                  selectedIntolerances.includes(item)
                    ? 'bg-yellow-500 text-white border-yellow-500'
                    : 'bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-500 text-zinc-700 dark:text-white'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {/* Calorie Goal */}
        <section>
          <h3 className="font-semibold mb-2">Calorie Goal (kcal/day)</h3>
          <input
            type="number"
            value={calorieGoal}
            onChange={(e) => setCalorieGoal(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 dark:bg-zinc-900 dark:text-white"
            required
          />
        </section>

        {/* Submit */}
        <div className="text-center">
          <button
            type="submit"
            className="bg-[#F4A261] hover:bg-[#E76F51] text-white px-6 py-2 rounded-full text-sm"
          >
            Save Preferences
          </button>
        </div>

        {error && (
          <p className="text-center text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</p>
        )}
      </form>
    </div>
  );
}
