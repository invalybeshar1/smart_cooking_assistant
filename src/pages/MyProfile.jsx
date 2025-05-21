import { useEffect, useState } from 'react';
import { FaUserAlt, FaLeaf, FaAllergies, FaExclamationTriangle, FaExchangeAlt } from 'react-icons/fa'; // Added FaExchangeAlt

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

  // Substitution states
  const [substitutions, setSubstitutions] = useState([]);
  const [newSubstitutionOriginal, setNewSubstitutionOriginal] = useState('');
  const [newSubstitutionPreferred, setNewSubstitutionPreferred] = useState('');
  const [loadingSubstitutions, setLoadingSubstitutions] = useState(false);
  const [errorSubstitutions, setErrorSubstitutions] = useState('');

  const dietaryOptions = ['Vegetarian', 'Vegan', 'Low-Carb', 'High-Protein', 'Keto', 'Pescatarian'];
  const allergyOptions = ['Nuts', 'Shellfish', 'Gluten', 'Dairy', 'Eggs'];
  const intoleranceOptions = ['Lactose', 'Fructose', 'Gluten'];

  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

  const fetchSubstitutions = async () => {
    const token = getToken();
    if (!token) return;
    setLoadingSubstitutions(true);
    setErrorSubstitutions('');
    try {
      const res = await fetch('http://localhost:5001/api/user/substitutions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to fetch substitutions: ${res.status}`);
      }
      const data = await res.json();
      setSubstitutions(data);
    } catch (err) {
      setErrorSubstitutions(err.message);
      console.error('Error fetching substitutions:', err);
    } finally {
      setLoadingSubstitutions(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    fetch('http://localhost:5001/api/user/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.message && data.message.includes('User not found')) { // Handle case where profile might not exist yet
          setUser({ name: 'New User', email: '', age: '', height: '', weight: '', bmi: '' }); // Provide default structure
          setFormData({
            weight: '', calorieGoal: '', preferences: [], allergies: [], intolerances: [], profilePicture: null,
          });
        } else {
          setUser(data);
          setFormData({
            weight: data.weight || '',
            calorieGoal: data.calorieGoal || '',
            preferences: data.preferences || [],
            allergies: data.allergies || [],
            intolerances: data.intolerances || [],
            profilePicture: null,
          });
        }
      })
      .catch(err => {
        console.error("Error fetching profile:", err);
        setUser({ name: 'Error Loading Profile', email: '', age: '', height: '', weight: '', bmi: '' }); // Display error state
      });
    
    fetchSubstitutions();
  }, []);

  const handleAddSubstitution = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token || !newSubstitutionOriginal.trim() || !newSubstitutionPreferred.trim()) {
      setErrorSubstitutions('Both original and preferred ingredient fields are required.');
      return;
    }
    setLoadingSubstitutions(true);
    setErrorSubstitutions('');
    try {
      const res = await fetch('http://localhost:5001/api/user/substitutions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          original_ingredient_name: newSubstitutionOriginal,
          preferred_ingredient_name: newSubstitutionPreferred,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to add substitution: ${res.status}`);
      }
      setNewSubstitutionOriginal('');
      setNewSubstitutionPreferred('');
      fetchSubstitutions(); // Refresh list
    } catch (err) {
      setErrorSubstitutions(err.message);
      console.error('Error adding substitution:', err);
    } finally {
      setLoadingSubstitutions(false);
    }
  };

  const handleDeleteSubstitution = async (id) => {
    const token = getToken();
    if (!token) return;
    setLoadingSubstitutions(true);
    setErrorSubstitutions('');
    try {
      const res = await fetch(`http://localhost:5001/api/user/substitutions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to delete substitution: ${res.status}`);
      }
      fetchSubstitutions(); // Refresh list
    } catch (err) {
      setErrorSubstitutions(err.message);
      console.error('Error deleting substitution:', err);
    } finally {
      setLoadingSubstitutions(false);
    }
  };

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
    const token = getToken();
  
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
  const currentCalories = 1250; // This seems static, consider if it should be dynamic

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
            <input name="weight" type="number" value={formData.weight} onChange={handleChange} className="w-full px-2 py-1 border rounded dark:bg-zinc-700 dark:text-white" />
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
                className="w-full px-3 py-1 rounded border dark:bg-zinc-700 dark:text-white"
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

        {/* Ingredient Substitution Preferences Section */}
        <section className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-md mt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FaExchangeAlt className="mr-2 text-[#F4A261]" /> Ingredient Substitution Preferences
          </h3>

          {errorSubstitutions && <p className="text-red-500 text-sm mb-4">{errorSubstitutions}</p>}

          <form onSubmit={handleAddSubstitution} className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <label htmlFor="originalIngredient" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Original Ingredient
                </label>
                <input
                  type="text"
                  id="originalIngredient"
                  value={newSubstitutionOriginal}
                  onChange={(e) => setNewSubstitutionOriginal(e.target.value)}
                  placeholder="e.g., White Sugar"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-[#F4A261] focus:border-[#F4A261] dark:bg-zinc-700 dark:text-white"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="preferredIngredient" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Preferred Ingredient
                </label>
                <input
                  type="text"
                  id="preferredIngredient"
                  value={newSubstitutionPreferred}
                  onChange={(e) => setNewSubstitutionPreferred(e.target.value)}
                  placeholder="e.g., Coconut Sugar"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-[#F4A261] focus:border-[#F4A261] dark:bg-zinc-700 dark:text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loadingSubstitutions}
              className="px-4 py-2 bg-[#F4A261] hover:bg-[#E76F51] text-white rounded-md text-sm disabled:opacity-50"
            >
              {loadingSubstitutions ? 'Adding...' : 'Add Substitution'}
            </button>
          </form>

          {loadingSubstitutions && substitutions.length === 0 && <p>Loading substitutions...</p>}
          
          {substitutions.length > 0 ? (
            <ul className="space-y-3">
              {substitutions.map((sub) => (
                <li key={sub.id} className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-900 rounded-md shadow-sm">
                  <div>
                    <p className="text-sm">
                      <span className="font-semibold">Original:</span> {sub.original_ingredient_name}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Preferred:</span> {sub.preferred_ingredient_name}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteSubstitution(sub.id)}
                    disabled={loadingSubstitutions}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs disabled:opacity-50"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            !loadingSubstitutions && <p className="text-sm text-zinc-500 dark:text-zinc-400">No substitutions added yet.</p>
          )}
        </section>

        {/* Subscription Section */}
        <section className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-md mt-6">
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
