import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/auth');
  };

  return (
    <section className="relative h-screen flex items-center justify-center bg-[url('/hero-bg.jpg')] bg-cover bg-center">
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-6 font-serif text-white drop-shadow-lg">
          Welcome to the Smart Cooking Assistant
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
