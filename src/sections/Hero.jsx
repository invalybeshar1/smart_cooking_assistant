export default function Hero({ onStartClick }) {
    return (
      <section id = "home" className="relative h-[90vh] flex items-center justify-center bg-[url('/hero-bg.jpg')] bg-cover bg-center">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-6 font-serif">
            Welcome to the Smart Cooking Assistant
          </h2>
          <button
            onClick={onStartClick}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-base transition"
          >
            Start Cooking
          </button>
        </div>
      </section>
    );
  }
  