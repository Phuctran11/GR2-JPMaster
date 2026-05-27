import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { useToastMessages } from '../../hooks/useToastMessages';

export function UserMenu() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const toastMessages = useToastMessages();

  const handleLogout = () => {
    logout();
    toastMessages.logoutSuccess();
    navigate('/login');
  };

  useEffect(() => {
    if (!showUserMenu) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (target instanceof Node && menuRef.current?.contains(target)) return;
      setShowUserMenu(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="flex items-center hover:opacity-80 transition-all group"
      >
        {user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={`${user.username} avatar`}
            className="h-10 w-10 rounded-full border border-outline-variant object-cover transition-all group-hover:shadow-lg group-hover:shadow-primary/30"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-on-primary font-bold text-sm group-hover:shadow-lg group-hover:shadow-primary/30 transition-all">
            {user?.username.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {showUserMenu && (
        <div className="absolute right-0 mt-2 w-56 bg-surface border-2 border-outline-variant/50 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b-2 border-outline-variant/30 bg-gradient-to-r from-surface-container/50 to-surface-container-high/50">
            <p className="font-semibold text-on-surface text-sm">{user?.username}</p>
            <p className="text-xs text-on-surface-variant break-all">{user?.email}</p>
          </div>
          <button
            onClick={() => {
              setShowUserMenu(false);
              navigate('/profile');
            }}
            className="block w-full text-left px-4 py-3 text-label-md text-on-surface hover:bg-primary/10 transition-all duration-200 flex items-center gap-2 group"
          >
            <div className="text-on-surface-variant group-hover:text-primary transition-colors">
              <Icon name="person" size="md" />
            </div>
            <span className="group-hover:text-primary transition-colors">Profile</span>
          </button>
          <button
            onClick={() => {
              setShowUserMenu(false);
              handleLogout();
            }}
            className="block w-full text-left px-4 py-3 text-label-md text-error hover:bg-error/10 transition-all duration-200 flex items-center gap-2 border-t border-outline-variant/30 group"
          >
            <div className="text-error group-hover:text-error transition-colors">
              <Icon name="logout" size="md" />
            </div>
            <span className="group-hover:text-error transition-colors">Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
