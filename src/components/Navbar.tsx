import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingBag,
  LogOut,
  User as UserIcon,
  Heart,
  Package,
  ChevronDown
} from 'lucide-react';
import { User } from 'firebase/auth';
import { CategoryData } from '../types';
import { Logo } from './Logo';

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
  categories: CategoryData[];
  onOpenCart: () => void;
  onOpenAccount: (tab?: 'profile' | 'wishlist' | 'orders') => void;
  onNavigateToHome: () => void;
  onNavigateToCategory: (categoryName: string) => void;
  onNavigateToAbout: () => void;
  onNavigateToContact: () => void;
  currentPage: string;
  selectedCategory?: string;
  currentUser: User | null;
  logoUrl?: string;
  onLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  wishlistCount,
  categories = [],
  onOpenCart,
  onOpenAccount,
  onNavigateToHome,
  onNavigateToCategory,
  onNavigateToAbout,
  onNavigateToContact,
  currentPage,
  selectedCategory,
  currentUser,
  logoUrl,
  onLogin,
  onLogout
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCleanUserName = () => {
    if (!currentUser) return '';
    if (currentUser.displayName && currentUser.displayName.trim()) {
      return currentUser.displayName.trim();
    }
    if (currentUser.email) {
      const emailUser = currentUser.email.split('@')[0];
      return emailUser.charAt(0).toUpperCase() + emailUser.slice(1);
    }
    return 'User';
  };

  const userName = getCleanUserName();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Brand Logo & Navigation Links */}
          <div className="flex items-center gap-6 lg:gap-8">
            <button
              onClick={onNavigateToHome}
              className="text-left group cursor-pointer focus:outline-none"
              aria-label="Go to ANIQ Homepage"
            >
              <Logo variant="light" size="md" customLogoUrl={logoUrl} />
            </button>

            {/* Desktop Navigation Links (Dynamic up to 5 categories) */}
            <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-xs font-semibold uppercase tracking-wider text-stone-600">
              <button
                onClick={onNavigateToHome}
                className={`py-1 transition-colors cursor-pointer ${
                  currentPage === 'home'
                    ? 'text-neutral-900 border-b-2 border-neutral-900 font-bold'
                    : 'hover:text-neutral-900'
                }`}
              >
                Home
              </button>

              {categories.slice(0, 5).map((cat) => {
                const isActive = currentPage === 'category' && selectedCategory === cat.name;
                return (
                  <button
                    key={cat.id}
                    onClick={() => onNavigateToCategory(cat.name)}
                    className={`py-1 transition-colors cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'text-neutral-900 border-b-2 border-neutral-900 font-bold'
                        : 'hover:text-neutral-900'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}

              <button
                onClick={onNavigateToAbout}
                className={`py-1 transition-colors cursor-pointer ${
                  currentPage === 'about'
                    ? 'text-neutral-900 border-b-2 border-neutral-900 font-bold'
                    : 'hover:text-neutral-900'
                }`}
              >
                About
              </button>
              <button
                onClick={onNavigateToContact}
                className={`py-1 transition-colors cursor-pointer ${
                  currentPage === 'contact'
                    ? 'text-neutral-900 border-b-2 border-neutral-900 font-bold'
                    : 'hover:text-neutral-900'
                }`}
              >
                Contact
              </button>
            </nav>
          </div>

          {/* Right Side: User Profile & Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-1.5 text-neutral-900 hover:text-black px-2.5 py-1.5 rounded-lg hover:bg-stone-100 text-xs sm:text-sm font-medium cursor-pointer transition-colors"
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="true"
                  title={`Signed in as ${userName}`}
                >
                  <span className="max-w-[110px] sm:max-w-[160px] truncate">
                    {userName}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                </button>

                {/* Profile Dropdown */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 border border-stone-200">
                    <div className="px-4 py-2 border-b border-stone-100 bg-stone-50/50">
                      <p className="text-xs font-bold text-neutral-900 truncate">
                        {userName}
                      </p>
                      {currentUser.email && (
                        <p className="text-[11px] text-stone-500 truncate">
                          {currentUser.email}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenAccount('profile');
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-neutral-900 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <UserIcon className="h-3.5 w-3.5 text-stone-500" />
                      <span>Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenAccount('wishlist');
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-neutral-900 flex items-center gap-2.5 transition-colors cursor-pointer justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <Heart className="h-3.5 w-3.5 text-stone-500" />
                        <span>Wishlist</span>
                      </div>
                      {wishlistCount > 0 && (
                        <span className="text-[11px] font-bold text-stone-500 tabular-nums">
                          {wishlistCount}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenAccount('orders');
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-neutral-900 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Package className="h-3.5 w-3.5 text-stone-500" />
                      <span>Orders</span>
                    </button>

                    <div className="h-px bg-stone-100 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="text-stone-700 hover:text-neutral-900 px-3 py-1.5 rounded-lg hover:bg-stone-100 text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors"
              >
                Sign In
              </button>
            )}

            {/* Shopping Bag / Cart */}
            <button
              onClick={onOpenCart}
              aria-label={`View shopping bag with ${cartCount} items`}
              className="flex items-center gap-1.5 text-neutral-900 hover:text-black px-2.5 py-1.5 rounded-lg hover:bg-stone-100 text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors"
            >
              <ShoppingBag className="h-4 w-4 text-stone-800 stroke-[1.8]" />
              <span className="hidden sm:inline">Bag</span>
              <span className="text-xs font-bold text-neutral-900 tabular-nums">
                ({cartCount})
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar (Dynamic up to 5 categories) */}
        <div className="md:hidden flex items-center pt-2.5 mt-2 border-t border-stone-100 text-[11px] font-semibold uppercase tracking-wider text-stone-600 overflow-x-auto scrollbar-none gap-3">
          <button
            onClick={onNavigateToHome}
            className={`py-1 px-1 shrink-0 ${currentPage === 'home' ? 'text-neutral-900 border-b-2 border-neutral-900 font-bold' : ''}`}
          >
            Home
          </button>
          {categories.slice(0, 5).map((cat) => {
            const isActive = currentPage === 'category' && selectedCategory === cat.name;
            return (
              <button
                key={cat.id}
                onClick={() => onNavigateToCategory(cat.name)}
                className={`py-1 px-1 shrink-0 whitespace-nowrap ${isActive ? 'text-neutral-900 border-b-2 border-neutral-900 font-bold' : ''}`}
              >
                {cat.name}
              </button>
            );
          })}
          <button
            onClick={onNavigateToAbout}
            className={`py-1 px-1 shrink-0 ${currentPage === 'about' ? 'text-neutral-900 border-b-2 border-neutral-900 font-bold' : ''}`}
          >
            About
          </button>
          <button
            onClick={onNavigateToContact}
            className={`py-1 px-1 shrink-0 ${currentPage === 'contact' ? 'text-neutral-900 border-b-2 border-neutral-900 font-bold' : ''}`}
          >
            Contact
          </button>
        </div>
      </div>
    </header>
  );
};
