import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleAuth = (e) => {
    e.preventDefault();
    // Simulate login/register success
    navigate('/home');
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
            <input
              type="text"
              placeholder="Full Name"
              className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 dark:bg-zinc-900 dark:text-white"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 dark:bg-zinc-900 dark:text-white"
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 dark:bg-zinc-900 dark:text-white"
            required
          />
          <button
            type="submit"
            className="bg-[#F4A261] hover:bg-[#E76F51] text-white px-4 py-2 rounded-lg mt-2"
          >
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}
