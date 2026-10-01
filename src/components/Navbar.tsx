import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingBag,
  LogIn,
  LogOut,
  User as UserIcon,
  Heart,
  Package,
  ChevronDown
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Logo } from './Logo';

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenAccount: (tab?: 'profile' | 'wishlist' | 'orders') => void;
  onNavigateToShop: () => void;
  onNavigateToAbout: () => void;
  onNavigateToContact: () => void;
  currentPage: 'store' | 'admin' | 'account' | 'about' | 'contact';
  currentUser: User | null;
  logoUrl?: string;
  onLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenAccount,
  onNavigateToShop,
  onNavigateToAbout,
  onNavigateToContact,
  currentPage,
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

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* Brand Logo & Main Nav Links */}
          <div className="flex items-center gap-6 sm:gap-8">
            <button
              onClick={onNavigateToShop}
              className="text-left group cursor-pointer focus:outline-none"
              aria-label="Go to Aniq Lifestyle Homepage"
            >
              <Logo variant="light" size="md" customLogoUrl={logoUrl} />
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 font-medium text-sm text-neutral-600">
              <button
                onClick={onNavigateToShop}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  currentPage === 'store'
                    ? 'bg-neutral-100 text-neutral-900 font-semibold'
                    : 'hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                Shop
              </button>
              <button
                onClick={onNavigateToAbout}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  currentPage === 'about'
                    ? 'bg-neutral-100 text-neutral-900 font-semibold'
                    : 'hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                About
              </button>
              <button
                onClick={onNavigateToContact}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  currentPage === 'contact'
                    ? 'bg-neutral-100 text-neutral-900 font-semibold'
                    : 'hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                Contact
              </button>
            </nav>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Profile Menu or Sign In */}
            {currentUser ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2.5 bg-[#283618] hover:bg-[#1f2b12] text-white px-3.5 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all shadow-sm border border-[#445837] active:scale-95"
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="true"
                >
                  <span className="max-w-[140px] truncate font-medium text-stone-100">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-stone-300" />
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 border border-stone-200">
                    <div className="px-4 py-2.5 bg-[#283618]/10 mb-1 border-b border-stone-100">
                      <p className="text-[11px] text-[#495f33] font-semibold uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-bold text-neutral-900 truncate">
                        {currentUser.displayName || currentUser.email}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenAccount('profile');
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-stone-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <UserIcon className="h-4 w-4 text-[#495f33]" />
                      <span>Personal Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenCart();
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-stone-50 flex items-center gap-2.5 transition-colors cursor-pointer justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShoppingBag className="h-4 w-4 text-[#495f33]" />
                        <span>My Cart</span>
                      </div>
                      {cartCount > 0 && (
                        <span className="bg-[#283618] text-white text-xs px-2 py-0.5 rounded-full font-bold">
                          {cartCount}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenAccount('wishlist');
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-stone-50 flex items-center gap-2.5 transition-colors cursor-pointer justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <Heart className="h-4 w-4 text-[#495f33]" />
                        <span>Wishlist</span>
                      </div>
                      {wishlistCount > 0 && (
                        <span className="bg-stone-200 text-neutral-800 text-xs px-2 py-0.5 rounded-full font-bold">
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
                      className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-stone-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Package className="h-4 w-4 text-[#495f33]" />
                      <span>Order History</span>
                    </button>

                    <div className="h-px bg-stone-100 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-2 bg-[#283618] hover:bg-[#1f2b12] text-white px-4.5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all shadow-sm border border-[#445837] active:scale-95"
              >
                <LogIn className="h-4 w-4 text-stone-200" />
                <span>Sign In / Register</span>
              </button>
            )}

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              aria-label={`View cart with ${cartCount} items`}
              className="flex items-center gap-2.5 bg-[#283618] hover:bg-[#1f2b12] text-white px-4.5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm cursor-pointer active:scale-95 border border-[#445837]"
            >
              <ShoppingBag className="h-4 w-4 text-stone-200" />
              <span className="hidden sm:inline">Bag</span>
              <span className="bg-white text-neutral-950 font-bold text-xs px-2 py-0.5 rounded-lg shadow-xs">
                {cartCount}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around pt-2.5 mt-2 border-t border-neutral-100/50 text-xs font-semibold text-neutral-600">
          <button
            onClick={onNavigateToShop}
            className={`py-1.5 px-3 rounded-lg ${currentPage === 'store' ? 'bg-neutral-100 text-neutral-900' : ''}`}
          >
            Shop
          </button>
          <button
            onClick={onNavigateToAbout}
            className={`py-1.5 px-3 rounded-lg ${currentPage === 'about' ? 'bg-neutral-100 text-neutral-900' : ''}`}
          >
            About
          </button>
          <button
            onClick={onNavigateToContact}
            className={`py-1.5 px-3 rounded-lg ${currentPage === 'contact' ? 'bg-neutral-100 text-neutral-900' : ''}`}
          >
            Contact
          </button>
        </div>
      </div>
    </header>
  );
};
