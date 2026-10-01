import React from 'react';
import { ShoppingBag, Search, X, LogIn, LogOut, User as UserIcon, Heart } from 'lucide-react';
import { User } from 'firebase/auth';

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenAccount: () => void;
  onOpenWishlist: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectCategory: (category: string) => void;
  currentUser: User | null;
  onLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenAccount,
  onOpenWishlist,
  searchQuery,
  onSearchChange,
  onSelectCategory,
  currentUser,
  onLogin,
  onLogout
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#faf9f6]/95 backdrop-blur-md border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6">
          {/* Top row on mobile: Logo + Controls */}
          <div className="flex items-center justify-between w-full sm:w-auto">
            {/* Logo */}
            <button
              onClick={() => {
                onSelectCategory('All');
                onSearchChange('');
              }}
              className="text-left group cursor-pointer focus:outline-none"
            >
              <span className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-neutral-900 group-hover:text-neutral-700 transition-colors">
                MAISON
              </span>
            </button>

            {/* Mobile Actions: Wishlist, User/Account, Cart */}
            <div className="sm:hidden flex items-center gap-2">
              {currentUser ? (
                <>
                  <button
                    onClick={onOpenWishlist}
                    aria-label={`View wishlist with ${wishlistCount} items`}
                    className="p-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 cursor-pointer relative"
                  >
                    <Heart className="h-4 w-4" />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                        {wishlistCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={onOpenAccount}
                    title="Open My Account"
                    className="p-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                  >
                    <UserIcon className="h-4 w-4 text-emerald-600" />
                  </button>
                </>
              ) : (
                <button
                  onClick={onLogin}
                  title="Sign In / Register"
                  className="p-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                >
                  <LogIn className="h-4 w-4" />
                </button>
              )}

              <button
                onClick={onOpenCart}
                aria-label={`View cart with ${cartCount} items`}
                className="flex items-center gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 px-3 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm cursor-pointer"
              >
                <ShoppingBag className="h-4 w-4" />
                <span className="bg-white text-neutral-900 font-bold text-xs px-1.5 py-0.5 rounded">
                  {cartCount}
                </span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="w-full sm:flex-1 sm:max-w-md">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search products or categories..."
                className="w-full bg-white border border-neutral-300 rounded-lg pl-11 pr-10 py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Desktop Right Controls: Wishlist + Auth / Account + Cart */}
          <div className="hidden sm:flex items-center gap-3">
            {currentUser ? (
              <>
                <button
                  onClick={onOpenWishlist}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-100 text-sm font-semibold cursor-pointer relative"
                  title="Wishlist"
                >
                  <Heart className="h-4 w-4 text-neutral-600" />
                  <span>Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="bg-neutral-900 text-white font-bold text-xs px-1.5 py-0.2 rounded-full">
                      {wishlistCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={onOpenAccount}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 text-neutral-800 hover:bg-neutral-100 text-sm font-semibold cursor-pointer"
                  title="Open My Account"
                >
                  <UserIcon className="h-4 w-4 text-emerald-600" />
                  <span className="max-w-[120px] truncate">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </span>
                </button>

                <button
                  onClick={onLogout}
                  className="p-2 rounded-lg border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 text-sm font-semibold cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </button>
            )}

            <button
              onClick={onOpenCart}
              aria-label={`View cart with ${cartCount} items`}
              className="flex items-center gap-2.5 bg-neutral-900 text-white hover:bg-neutral-800 px-4 py-2.5 rounded-lg font-medium text-base transition-colors shadow-sm cursor-pointer active:scale-95"
            >
              <ShoppingBag className="h-5 w-5" />
              <span>Cart</span>
              <span className="bg-white text-neutral-900 font-bold text-sm px-2 py-0.5 rounded">
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
