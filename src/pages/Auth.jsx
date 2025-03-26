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
    <div className="flex flex-col items-center justify-center min-h-screen bg-orange-50 px-4">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md">
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`px-4 py-2 rounded-full ${isLogin ? 'bg-orange-500 text-white' : 'bg-zinc-100'}`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`px-4 py-2 rounded-full ${!isLogin ? 'bg-orange-500 text-white' : 'bg-zinc-100'}`}
          >
            Register
          </button>
        </div>
        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              className="px-4 py-2 rounded-lg border"
              required
            />
          )}
          <input type="email" placeholder="Email" className="px-4 py-2 rounded-lg border" required />
          <input type="password" placeholder="Password" className="px-4 py-2 rounded-lg border" required />
          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg mt-2"
          >
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}
