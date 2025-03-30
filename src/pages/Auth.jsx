import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    height: '',
    weight: '',
    activityLevel: '',
    phone: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isValidPassword = (password) => {
    return /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');

    if (!isLogin && !isValidPassword(formData.password)) {
      setError(
        'Password must be at least 8 characters and include an uppercase letter, number, and special character.'
      );
      return;
    }

    const payload = isLogin
      ? { email: formData.email, password: formData.password }
      : {
          ...formData,
          bmi:
            (formData.weight / ((formData.height / 100) * (formData.height / 100))).toFixed(2),
        };

    const url = isLogin ? '/api/login' : '/api/register';

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Something went wrong.');

      // Save token (optional - localStorage for now)
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect
      navigate(isLogin ? '/home' : '/questionnaire');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDF6EC] dark:bg-[#1E1E1E] text-zinc-800 dark:text-white px-4">
      <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-md w-full max-w-md">
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`px-4 py-2 rounded-full text-sm ${
              isLogin ? 'bg-[#F4A261] text-white' : 'bg-zinc-100 dark:bg-zinc-700 dark:text-white'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`px-4 py-2 rounded-full text-sm ${
              !isLogin ? 'bg-[#F4A261] text-white' : 'bg-zinc-100 dark:bg-zinc-700 dark:text-white'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          {!isLogin && (
            <>
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                onChange={handleChange}
                required
                className="px-4 py-2 rounded-lg border dark:border-zinc-600 dark:bg-zinc-900 dark:text-white"
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                onChange={handleChange}
                required
                className="px-4 py-2 rounded-lg border dark:border-zinc-600 dark:bg-zinc-900 dark:text-white"
              />
              <input
                type="number"
                name="age"
                placeholder="Age"
                onChange={handleChange}
                required
                className="px-4 py-2 rounded-lg border dark:border-zinc-600 dark:bg-zinc-900 dark:text-white"
              />
              <input
                type="number"
                name="height"
                placeholder="Height (cm)"
                onChange={handleChange}
                required
                className="px-4 py-2 rounded-lg border dark:border-zinc-600 dark:bg-zinc-900 dark:text-white"
              />
              <input
                type="number"
                name="weight"
                placeholder="Weight (kg)"
                onChange={handleChange}
                required
                className="px-4 py-2 rounded-lg border dark:border-zinc-600 dark:bg-zinc-900 dark:text-white"
              />
              <input
                type="text"
                name="activityLevel"
                placeholder="Activity Level"
                onChange={handleChange}
                required
                className="px-4 py-2 rounded-lg border dark:border-zinc-600 dark:bg-zinc-900 dark:text-white"
              />
              <input
                type="text"
                name="phone"
                placeholder="Phone Number"
                onChange={handleChange}
                required
                className="px-4 py-2 rounded-lg border dark:border-zinc-600 dark:bg-zinc-900 dark:text-white"
              />
            </>
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            required
            className="px-4 py-2 rounded-lg border dark:border-zinc-600 dark:bg-zinc-900 dark:text-white"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            required
            className="px-4 py-2 rounded-lg border dark:border-zinc-600 dark:bg-zinc-900 dark:text-white"
          />

          <button
            type="submit"
            className="bg-[#F4A261] hover:bg-[#E76F51] text-white px-4 py-2 rounded-lg mt-2"
          >
            {isLogin ? 'Login' : 'Register'}
          </button>

          {error && (
            <div className="mt-2 text-sm text-red-600 text-center bg-red-100 p-2 rounded-lg">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
