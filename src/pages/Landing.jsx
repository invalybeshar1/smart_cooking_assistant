import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/auth');
  };

  return (
    <section className="h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat bg-[url('/banner.jpg')]">
      <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg text-center">
        <h2 className="text-4xl font-bold mb-6 font-serif text-zinc-900 dark:text-white">
          Welcome to the Smart Cooking Assistant!
        </h2>
        <button
          onClick={handleStart}
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-lg transition"
        >
          Start Cooking
        </button>
      </div>
    </section>
  );
}
