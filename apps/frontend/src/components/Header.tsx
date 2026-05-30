import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SearchBar, NavigationMenu, UserMenu, MobileMenu, AuthActions } from './header/';

export function Header() {
  const location = useLocation();
  const { user } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isActive = (path: string) => {
    const from = (location.state as any)?.from;
    if (from) {
      return from === path;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/courses', label: 'My learning' },
    { path: '/explore', label: 'Explore' },
    { path: '/flashcards', label: 'Flashcards' },
    { path: '/tests', label: 'Tests' },
    ...(user?.role === 'admin' || user?.role === 'owner' ? [{ path: '/admin', label: 'Dashboard' }] : []),
  ];

  return (
    <header
      data-app-header
      className="bg-gradient-to-b from-surface/95 to-surface-container/90 backdrop-blur-md sticky top-0 z-50 border-b-2 border-outline-variant/30"
    >
      <div className="flex justify-between items-center max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-4 gap-2 md:gap-4">
        {/* Logo */}
        <Link
          to="/"
          className="text-headline-md font-headline-md bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-bold tracking-tight hover:opacity-80 transition-opacity flex-shrink-0"
        >
          JPMaster
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu navLinks={navLinks} isActive={isActive} />

        {/* Search Bar */}
        <SearchBar />

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {user ? (
            <>
              <UserMenu />
              {/* Mobile Menu Toggle - handled in AuthActions equivalent */}
              <div className="lg:hidden">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 hover:bg-surface-container rounded-lg text-on-surface transition-colors"
                >
                  {showMobileMenu ? '✕' : '☰'}
                </button>
              </div>
            </>
          ) : (
            <AuthActions showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {showMobileMenu && <MobileMenu navLinks={navLinks} isActive={isActive} onClose={() => setShowMobileMenu(false)} />}
    </header>
  );
}
