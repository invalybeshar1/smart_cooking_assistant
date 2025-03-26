import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function Header() {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
  };

  return (
    <header className="flex justify-between items-center px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
      <h1 className="text-xl font-semibold">Smart Cooking</h1>
      <nav className="flex gap-6">
        {['/', '/my-profile', '/my-recipes', '/top-picks', '/shopping-list', '/contact-us'].map((path, i) => {
          const names = ['Home', 'My Profile', 'My Recipes', 'Top Picks', 'Shopping List', 'Contact Us'];
          return (
            <Link
              key={path}
              to={path}
              className="hover:text-orange-600 dark:hover:text-orange-300 transition-colors"
            >
              {names[i]}
            </Link>
          );
        })}
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
