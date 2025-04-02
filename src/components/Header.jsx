import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function Header() {
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
  };

  const paths = ['/', '/my-profile', '/my-recipes', '/top-picks', '/shopping-list', '/contact-us'];
  const names = ['Home', 'My Profile', 'My Recipes', 'Top Picks', 'Shopping List', 'Contact Us'];

  return (
    <header className="flex justify-between items-center px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 bg-[#FDEBD0] dark:bg-[#2D2D2D] text-zinc-800 dark:text-white">
      <h1 className="text-xl font-semibold">Smart Cooking</h1>
      <nav className="flex gap-6">
        {paths.map((path, i) => (
          <Link
            key={path}
            to={path}
            className={`px-3 py-1 rounded-full transition-colors ${
              location.pathname === path
                ? 'bg-[#F4A261] text-white'
                : 'hover:text-orange-600 dark:hover:text-orange-300'
            }`}
          >
            {names[i]}
          </Link>
        ))}
      </nav>
      <button
        onClick={toggleDarkMode}
        className="text-sm px-3 py-1 border rounded-full dark:border-white border-zinc-800"
      >
        {darkMode ? 'Light Mode' : 'Dark Mode'}
      </button>
    </header>
  );
}
