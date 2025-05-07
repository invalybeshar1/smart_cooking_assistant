import { useEffect, useState } from 'react';
import { FaUserAlt, FaLeaf, FaAllergies, FaExclamationTriangle } from 'react-icons/fa';

export default function MyProfile() {
  const [activeTab, setActiveTab] = useState('preferences');
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    weight: '',
    calorieGoal: '',
    preferences: [],
    allergies: [],
    intolerances: [],
    profilePicture: null,
  });

  const dietaryOptions = ['Vegetarian', 'Vegan', 'Low-Carb', 'High-Protein', 'Keto', 'Pescatarian'];
  const allergyOptions = ['Nuts', 'Shellfish', 'Gluten', 'Dairy', 'Eggs'];
  const intoleranceOptions = ['Lactose', 'Fructose', 'Gluten'];

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:5001/api/user/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setFormData({
          weight: data.weight,
          calorieGoal: data.calorieGoal,
          preferences: data.preferences || [],
          allergies: data.allergies || [],
          intolerances: data.intolerances || [],
          profilePicture: null,
        });
      });
  }, []);

  const toggleSelection = (value, key) => {
    setFormData(prev => {
      const list = prev[key];
      return {
        ...prev,
        [key]: list.includes(value)
          ? list.filter(item => item !== value)
          : [...list, value],
      };
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, profilePicture: e.target.files[0] }));
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
    try {
      const res = await fetch('http://localhost:5001/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          weight: formData.weight,
          calorieGoal: formData.calorieGoal,
          preferences: formData.preferences,
          allergies: formData.allergies,
          intolerances: formData.intolerances,
        }),
      });
  
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Update failed: ${res.status} - ${errorText}`);
      }
  
      const result = await res.json();
      console.log('✅ Profile updated:', result.message);
  
      const profileRes = await fetch('http://localhost:5001/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const updatedData = await profileRes.json();
      setUser(updatedData);
      setEditMode(false);
    } catch (err) {
      console.error('❌ Error updating profile:', err.message);
      alert('Failed to save changes. Please try again.');
    }
  };
  
  if (!user) return <div className="text-center mt-20">Loading...</div>;

  const calorieGoal = formData.calorieGoal || 1800;
  const currentCalories = 1250;

  return (
    <div className="min-h-screen bg-[#FDF6EC] dark:bg-[#1E1E1E] text-zinc-800 dark:text-white flex flex-col md:flex-row p-6 gap-6">
      {/* Side Panel */}
      <aside className="md:w-1/4 w-full bg-white dark:bg-zinc-800 rounded-xl shadow-md p-4 text-center">
        <img
          src={formData.profilePicture ? URL.createObjectURL(formData.profilePicture) : 'https://via.placeholder.com/100'}
          alt="User Avatar"
          className="w-24 h-24 rounded-full mx-auto mb-4"
        />
        {editMode && (
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="text-sm text-zinc-500 dark:text-zinc-300 mt-2"
          />
        )}
        <h2 className="text-xl font-semibold">{user.name}</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-300">{user.email}</p>
        <div className="mt-4 text-sm text-left space-y-1">
          <p><strong>Age:</strong> {user.age}</p>
          <p><strong>Height:</strong> {user.height} cm</p>
          <p><strong>Weight:</strong> {editMode ? (
            <input name="weight" type="number" value={formData.weight} onChange={handleChange} className="w-full px-2 py-1 border rounded" />
          ) : `${user.weight} kg`}</p>
          <p><strong>BMI:</strong> <span className="inline-block bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{user.bmi}</span></p>
        </div>
        <button onClick={() => setEditMode(!editMode)} className="mt-6 px-4 py-2 bg-[#F4A261] hover:bg-[#E76F51] text-white rounded-full text-sm">
          {editMode ? 'Cancel' : 'Edit Profile'}
        </button>
        {editMode && (
          <button onClick={handleSave} className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full text-sm">
            Save Changes
          </button>
        )}
      </aside>

      {/* Main Section */}
      <main className="flex-1 space-y-6">
        <section className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-4">Your Preferences & Goals</h3>

          {/* Calorie Bar */}
          <div className="mb-4">
            <p className="text-sm mb-1">Daily Calorie Goal</p>
            {editMode ? (
              <input
                type="number"
                name="calorieGoal"
                value={formData.calorieGoal}
                onChange={handleChange}
                className="w-full px-3 py-1 rounded border"
              />
            ) : (
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-4">
                <div
                  className="bg-green-500 h-4 rounded-full text-xs text-white text-center"
                  style={{ width: `${(currentCalories / calorieGoal) * 100}%` }}
                >
                  {currentCalories} / {calorieGoal} kcal
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-4">
            <button className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${activeTab === 'preferences' ? 'bg-[#F4A261] text-white' : 'bg-zinc-100 dark:bg-zinc-700 dark:text-white'}`} onClick={() => setActiveTab('preferences')}>
              <FaLeaf /> Dietary Preferences
            </button>
            <button className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${activeTab === 'allergies' ? 'bg-[#F4A261] text-white' : 'bg-zinc-100 dark:bg-zinc-700 dark:text-white'}`} onClick={() => setActiveTab('allergies')}>
              <FaAllergies /> Allergies
            </button>
            <button className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${activeTab === 'intolerances' ? 'bg-[#F4A261] text-white' : 'bg-zinc-100 dark:bg-zinc-700 dark:text-white'}`} onClick={() => setActiveTab('intolerances')}>
              <FaExclamationTriangle /> Intolerances
            </button>
          </div>

          {/* Tab Content */}
          <div className="text-sm bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg">
            {['preferences', 'allergies', 'intolerances'].includes(activeTab) && (
              <div className="flex flex-wrap gap-2">
                {(activeTab === 'preferences' ? dietaryOptions : activeTab === 'allergies' ? allergyOptions : intoleranceOptions).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`px-3 py-1 rounded-full border text-sm ${formData[activeTab].includes(item) ? 'bg-[#F4A261] text-white border-[#F4A261]' : 'bg-white dark:bg-zinc-700 text-zinc-700 dark:text-white border-zinc-300'}`}
                    onClick={() => editMode && toggleSelection(item, activeTab)}
                    disabled={!editMode}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          {editMode && (
            <button onClick={handleSave} className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full text-sm">
              Save Preferences
            </button>
          )}
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
