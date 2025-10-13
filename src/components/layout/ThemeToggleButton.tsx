// src/components/ThemeToggle.tsx
import { useTheme } from "../../app/providers/ThemeProvider/ThemeContext";
import { Sun, Moon } from "lucide-react";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="w-8 h-8 bg-primary-xl rounded-full border border-primary-md flex items-center justify-center"
      title="Toggle Theme"
    >
      <span className="text-text hover:text-primary-lt">{theme === "theme-1" ? <Moon size={16} /> : <Sun size={16} />}</span>
    </button>
  );
};

export default ThemeToggle;
