import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  X,
  ShoppingBag,
  Heart,
  User as UserIcon,
  LogOut,
  Package,
  Search,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { User } from 'firebase/auth';
import { CategoryData, Product } from '../types';
import { Logo } from './Logo';
import { formatBDT } from '../utils/format';

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
  categories: CategoryData[];
  products?: Product[];
  onSelectProduct?: (product: Product) => void;
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
  products = [],
  onSelectProduct,
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Scroll listener for sticky contrast background transition
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDrawerOpen(false);
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
  const isContrastActive =
    currentPage !== 'home' || isScrolled || isHovered || isDrawerOpen;

  const handleCategoryClick = (catName: string) => {
    onNavigateToCategory(catName);
    setIsDrawerOpen(false);
  };

  return (
    <>
      <header
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`w-full transition-all duration-300 ease-in-out border-0 border-none outline-none ${
          currentPage === 'home'
            ? isScrolled
              ? 'fixed top-0 left-0 right-0 z-40 bg-white shadow-md text-neutral-900'
              : isHovered || isDrawerOpen
                ? 'w-full bg-white shadow-md text-neutral-900'
                : 'w-full bg-gradient-to-b from-black/80 via-black/30 to-transparent text-white shadow-none'
            : 'sticky top-0 z-40 bg-white shadow-xs text-neutral-900'
        }`}
      >
        <div className="w-full px-4 sm:px-8 lg:px-12 py-3.5 sm:py-4">
          <div className="relative flex items-center justify-between">
            {/* Left: 3-line Menu Icon & Search (Far left edge) */}
            <div className="flex items-center gap-3 sm:gap-4 z-10">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className={`p-1.5 -ml-1.5 rounded-lg transition-colors cursor-pointer ${
                  isContrastActive
                    ? 'text-neutral-900 hover:text-stone-600'
                    : 'text-white hover:text-stone-200'
                }`}
                aria-label="Open Navigation Menu"
              >
                <Menu className="h-6 w-6 stroke-[1.8]" />
              </button>

              <button
                type="button"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isContrastActive
                    ? 'text-neutral-900 hover:text-stone-600'
                    : 'text-white hover:text-stone-200'
                }`}
                aria-label="Toggle Search"
              >
                <Search className="h-5 w-5 stroke-[1.8]" />
              </button>
            </div>

            {/* Center: Brand Logo (Switches contrast) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <button
                type="button"
                onClick={onNavigateToHome}
                className="group cursor-pointer focus:outline-none flex items-center justify-center"
                aria-label="Go to ANIQ Homepage"
              >
                <Logo
                  variant={isContrastActive ? 'light' : 'dark'}
                  size="md"
                  customLogoUrl={logoUrl}
                  className="transition-transform duration-300 group-hover:scale-105"
                />
              </button>
            </div>

            {/* Right: User Icon & Bag Icon (Far right edge, No Text, No Wishlist) */}
            <div className="flex items-center gap-2 sm:gap-3 z-10">
              {/* User Icon */}
              {currentUser ? (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isContrastActive
                        ? 'text-neutral-900 hover:text-stone-600'
                        : 'text-white hover:text-stone-200'
                    }`}
                    aria-expanded={isProfileMenuOpen}
                    aria-haspopup="true"
                    aria-label="User Account Menu"
                    title={`Signed in as ${userName}`}
                  >
                    <UserIcon className="h-5 w-5 stroke-[1.8]" />
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-1.5 z-50 border border-stone-200 text-neutral-900">
                      <div className="px-4 py-2.5 border-b border-stone-100 bg-stone-50/50">
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
                        className="w-full px-4 py-2 text-left text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-neutral-900 flex items-center justify-between transition-colors cursor-pointer"
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
                          setIsLogoutConfirmOpen(true);
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
                  type="button"
                  onClick={onLogin}
                  className={`p-1.5 transition-colors cursor-pointer ${
                    isContrastActive
                      ? 'text-neutral-900 hover:text-stone-600'
                      : 'text-white hover:text-stone-200'
                  }`}
                  aria-label="Sign In"
                >
                  <UserIcon className="h-5 w-5 stroke-[1.8]" />
                </button>
              )}

              {/* Bag Icon (No Text) */}
              <button
                type="button"
                onClick={onOpenCart}
                className={`relative p-1.5 transition-colors cursor-pointer ${
                  isContrastActive
                    ? 'text-neutral-900 hover:text-stone-600'
                    : 'text-white hover:text-stone-200'
                }`}
                aria-label={`Shopping Bag with ${cartCount} items`}
              >
                <ShoppingBag className="h-5 w-5 stroke-[1.8]" />
                {cartCount > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 text-[10px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center tabular-nums ${
                      isContrastActive
                        ? 'bg-neutral-900 text-white'
                        : 'bg-white text-neutral-900'
                    }`}
                  >
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* In-Place Live Product Search Bar Overlay */}
          {isSearchOpen && (
            <div className="pt-3 pb-2 border-t border-stone-200/60 mt-3 animate-in fade-in duration-200">
              <div className="relative max-w-xl mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search lawn, chiffon, comforters, luxury suites..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-stone-100/90 text-neutral-900 text-xs sm:text-sm pl-10 pr-9 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-900 shadow-inner"
                    autoFocus
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-neutral-900 p-1 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Real-time Search Results Box */}
                {searchQuery.trim() && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-stone-200/80 p-3 max-h-[380px] overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-150">
                    {(() => {
                      const q = searchQuery.toLowerCase().trim();
                      const matched = products.filter(
                        (p) =>
                          p.name.toLowerCase().includes(q) ||
                          p.category.toLowerCase().includes(q) ||
                          (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
                          (p.catalogueName && p.catalogueName.toLowerCase().includes(q)) ||
                          p.description.toLowerCase().includes(q)
                      ).slice(0, 8);

                      if (matched.length === 0) {
                        return (
                          <div className="py-8 text-center text-xs text-stone-400">
                            No products found matching "{searchQuery}"
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-1.5">
                          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center justify-between">
                            <span>Found Products ({matched.length})</span>
                            <span className="text-[10px] text-stone-400 font-normal">Click item to view</span>
                          </div>
                          {matched.map((prod) => (
                            <div
                              key={prod.id}
                              onClick={() => {
                                onSelectProduct?.(prod);
                                setIsSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="flex items-center gap-3 p-2 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer group"
                            >
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="w-11 h-14 object-cover rounded-lg bg-stone-100 shrink-0 border border-stone-200"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-neutral-900 truncate group-hover:text-stone-600 transition-colors">
                                  {prod.name}
                                </h4>
                                <p className="text-[11px] text-stone-400 truncate">
                                  {prod.category} {prod.catalogueName ? `• ${prod.catalogueName}` : ''}
                                </p>
                              </div>
                              <span className="font-sans font-semibold text-xs text-neutral-900 tabular-nums shrink-0">
                                {formatBDT(prod.price)}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Left Slide-Out Navigation Drawer (Roheenaz Pattern) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Side Drawer Panel */}
          <aside className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl z-50 flex flex-col justify-between animate-in slide-in-from-left duration-300">
            <div>
              {/* Drawer Header */}
              <div className="p-5 border-b border-stone-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onNavigateToHome();
                  }}
                  className="cursor-pointer"
                >
                  <Logo variant="light" size="sm" customLogoUrl={logoUrl} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 text-stone-500 hover:text-neutral-900 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Links */}
              <nav className="p-5 space-y-1 font-heading">
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onNavigateToHome();
                  }}
                  className={`w-full text-left py-3 px-3.5 rounded-xl text-xs font-category font-semibold uppercase tracking-wider flex items-center justify-between transition-colors ${
                    currentPage === 'home'
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-900 hover:bg-stone-100'
                  }`}
                >
                  <span>Home</span>
                  <ChevronRight className="h-4 w-4 opacity-60" />
                </button>

                {/* Clean Category Links without subcategories or Collections header */}
                {categories.map((cat) => {
                  const isActive = currentPage === 'category' && selectedCategory === cat.name;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryClick(cat.name)}
                      className={`w-full text-left py-3 px-3.5 rounded-xl text-xs font-category font-semibold uppercase tracking-wider flex items-center justify-between transition-colors ${
                        isActive
                          ? 'bg-stone-100 text-neutral-900 font-extrabold'
                          : 'text-stone-700 hover:bg-stone-50 hover:text-neutral-900'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onNavigateToAbout();
                  }}
                  className={`w-full text-left py-3 px-3.5 rounded-xl text-xs font-category font-semibold uppercase tracking-wider flex items-center justify-between transition-colors ${
                    currentPage === 'about'
                      ? 'bg-stone-100 text-neutral-900 font-bold'
                      : 'text-stone-700 hover:bg-stone-50 hover:text-neutral-900'
                  }`}
                >
                  <span>About Us</span>
                  <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onNavigateToContact();
                  }}
                  className={`w-full text-left py-3 px-3.5 rounded-xl text-xs font-category font-semibold uppercase tracking-wider flex items-center justify-between transition-colors ${
                    currentPage === 'contact'
                      ? 'bg-stone-100 text-neutral-900 font-bold'
                      : 'text-stone-700 hover:bg-stone-50 hover:text-neutral-900'
                  }`}
                >
                  <span>Contact Us</span>
                  <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
                </button>
              </nav>
            </div>

            {/* Drawer Footer */}
            <div className="p-5 border-t border-stone-100 bg-stone-50/60">
              {currentUser ? (
                <div className="flex items-center justify-between">
                  <div className="truncate pr-2">
                    <p className="text-xs font-bold text-neutral-900 truncate">{userName}</p>
                    <p className="text-[11px] text-stone-500 truncate">{currentUser.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDrawerOpen(false);
                      setIsLogoutConfirmOpen(true);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onLogin();
                  }}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Sign In
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Logout Confirmation Pop-up Modal */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-heading text-lg font-bold text-neutral-900 mb-2">
              Sign Out
            </h3>
            <p className="font-paragraph text-sm text-stone-600 mb-6 leading-relaxed">
              Are you sure you want to sign out of your account?
            </p>
            <div className="flex items-center justify-end gap-3 font-category">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogoutConfirmOpen(false);
                  onLogout();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
