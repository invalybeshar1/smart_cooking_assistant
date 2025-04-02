export default function Footer() {
  return (
    <footer className="mt-auto bg-[#FDEBD0] dark:bg-[#2D2D2D] text-zinc-800 dark:text-white border-t border-zinc-200 dark:border-zinc-700 py-4 px-6 text-center text-sm">
      <p>© {new Date().getFullYear()} Smart Cooking Assistant. All rights reserved.</p>
    </footer>
  );
}
