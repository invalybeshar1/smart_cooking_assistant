import { useState } from 'react';
import { FaUserAlt, FaLeaf, FaAllergies, FaExclamationTriangle } from 'react-icons/fa';

export default function MyProfile() {
  const [activeTab, setActiveTab] = useState('preferences');
  const calorieGoal = 1800;
  const currentCalories = 1250;

  return (
    <div className="min-h-screen bg-[#FDF6EC] dark:bg-[#1E1E1E] text-zinc-800 dark:text-white flex flex-col md:flex-row p-6 gap-6">
      {/* Side Panel */}
      <aside className="md:w-1/4 w-full bg-white dark:bg-zinc-800 rounded-xl shadow-md p-4 text-center">
        <img
          src="https://via.placeholder.com/100"
          alt="User Avatar"
          className="w-24 h-24 rounded-full mx-auto mb-4"
        />
        <h2 className="text-xl font-semibold">Jane Doe</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-300">jane@example.com</p>
        <div className="mt-4 text-sm text-left space-y-1">
          <p><strong>Age:</strong> 28</p>
          <p><strong>Height:</strong> 165 cm</p>
          <p><strong>Weight:</strong> 60 kg</p>
          <p><strong>BMI:</strong> <span className="inline-block bg-green-100 text-green-700 px-2 py-0.5 rounded-full">22.0</span></p>
        </div>
        <button className="mt-6 px-4 py-2 bg-[#F4A261] hover:bg-[#E76F51] text-white rounded-full text-sm">
          Edit Profile
        </button>
      </aside>

      {/* Main Section */}
      <main className="flex-1 space-y-6">
        {/* Preferences & Goals */}
        <section className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-4">Your Preferences & Goals</h3>

          {/* Calorie Bar */}
          <div className="mb-4">
            <p className="text-sm mb-1">Daily Calorie Goal</p>
            <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-4">
              <div
                className="bg-green-500 h-4 rounded-full text-xs text-white text-center"
                style={{ width: `${(currentCalories / calorieGoal) * 100}%` }}
              >
                {currentCalories} / {calorieGoal} kcal
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-4">
            <button
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                activeTab === 'preferences' ? 'bg-[#F4A261] text-white' : 'bg-zinc-100 dark:bg-zinc-700 dark:text-white'
              }`}
              onClick={() => setActiveTab('preferences')}
            >
              <FaLeaf /> Dietary Preferences
            </button>
            <button
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                activeTab === 'allergies' ? 'bg-[#F4A261] text-white' : 'bg-zinc-100 dark:bg-zinc-700 dark:text-white'
              }`}
              onClick={() => setActiveTab('allergies')}
            >
              <FaAllergies /> Allergies
            </button>
            <button
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                activeTab === 'intolerances' ? 'bg-[#F4A261] text-white' : 'bg-zinc-100 dark:bg-zinc-700 dark:text-white'
              }`}
              onClick={() => setActiveTab('intolerances')}
            >
              <FaExclamationTriangle /> Intolerances
            </button>
          </div>

          {/* Tab Content */}
          <div className="text-sm bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg">
            {activeTab === 'preferences' && <p>Vegetarian, High-Protein</p>}
            {activeTab === 'allergies' && <p>Nuts, Shellfish</p>}
            {activeTab === 'intolerances' && <p>Lactose</p>}
          </div>

          <button className="mt-4 px-4 py-2 bg-[#F4A261] hover:bg-[#E76F51] text-white rounded-full text-sm">
            Update Preferences
          </button>
        </section>

        {/* Subscription Section */}
        <section className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-4">Subscription</h3>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-sm">You're currently on the <strong className="text-[#F4A261]">Free Plan</strong>.</p>
              <ul className="text-xs text-zinc-600 dark:text-zinc-300 mt-2 list-disc ml-4">
                <li>Access to basic recipes</li>
                <li>Missing ingredient substitutions</li>
                <li>Chatbot support</li>
              </ul>
            </div>
            <button className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full text-sm shadow-md">
              Upgrade to Premium
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
