import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemeTogglePreview } from './ThemeToggle';

interface NavLink {
  path: string;
  label: string;
}

interface MobileMenuProps {
  navLinks: NavLink[];
  isActive: (path: string) => boolean;
  onClose: () => void;
}

export function MobileMenu({ navLinks, isActive, onClose }: MobileMenuProps) {
  const { user } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="lg:hidden border-t-2 border-outline-variant/50 bg-gradient-to-b from-surface/95 to-surface-container/95 backdrop-blur-md">
      <nav className="flex flex-col">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center justify-between border-b border-outline-variant/30 px-margin-mobile py-3 text-left text-label-md font-semibold text-on-surface transition-colors hover:bg-primary/5 hover:text-primary sm:hidden"
        >
          <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
          <ThemeTogglePreview className="pointer-events-none h-10 w-9" />
        </button>
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            onClick={onClose}
            className={`px-margin-mobile py-3 text-label-md font-inter transition-all duration-200 border-b border-outline-variant/30 ${
              isActive(link.path)
                ? 'text-primary font-bold bg-primary/10 border-l-4 border-l-primary'
                : 'text-on-surface-variant hover:text-primary hover:bg-primary/5'
            }`}
          >
            {link.label}
          </Link>
        ))}
        {user && (
          <Link
            to="/profile"
            onClick={onClose}
            className={`px-margin-mobile py-3 text-label-md font-inter transition-all duration-200 border-b border-outline-variant/30 ${
              isActive('/profile')
                ? 'text-primary font-bold bg-primary/10 border-l-4 border-l-primary'
                : 'text-on-surface-variant hover:text-primary hover:bg-primary/5'
            }`}
          >
            Profile
          </Link>
        )}
        {!user && (
          <>
            <Link
              to="/login"
              onClick={onClose}
              className="px-margin-mobile py-3 text-label-md font-inter text-primary hover:bg-primary/10 transition-colors border-t-2 border-outline-variant/30 text-left font-semibold"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              onClick={onClose}
              className="px-margin-mobile py-3 text-label-md font-inter bg-primary text-on-primary hover:shadow-lg hover:shadow-primary/20 transition-all text-left font-semibold rounded-b-lg"
            >
              Sign Up
            </Link>
          </>
        )}
      </nav>
    </div>
  );
}
