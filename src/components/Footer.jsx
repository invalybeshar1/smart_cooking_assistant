export default function Footer() {
    return (
      <footer className="text-center py-4 border-t border-zinc-300 dark:border-zinc-700 text-sm">
        &copy; {new Date().getFullYear()} Smart Cooking Assistant. All rights reserved.
      </footer>
    );
  }
  