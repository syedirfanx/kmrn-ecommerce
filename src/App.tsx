/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { User, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db, auth } from './lib/firebase';
import { PRODUCTS } from './data/products';
import { Product, CategoryData, CartItem, OrderConfirmation, UserProfile } from './types';
import {
  seedInitialDataIfEmpty,
  subscribeProducts,
  subscribeCategories,
  subscribeUserCart,
  saveCartItemToDb,
  removeCartItemFromDb,
  clearUserCartInDb,
  subscribeUserProfile,
  subscribeUserWishlist,
  toggleWishlistItemInDb,
  saveUserOrderToDb,
  subscribeUserOrders,
  subscribeBannerSettings
} from './services/storeService';
import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { Toast } from './components/Toast';
import { FeaturedBanner } from './components/FeaturedBanner';
import { AdminPortal } from './components/AdminPortal';
import { AuthModal } from './components/AuthModal';
import { AccountPage } from './components/AccountPage';

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating-desc';

const CART_STORAGE_KEY = 'maison_ecommerce_cart_v1';
const WISHLIST_STORAGE_KEY = 'maison_ecommerce_wishlist_v1';

const getInitialPage = (): 'store' | 'admin' | 'account' => {
  if (typeof window === 'undefined') return 'store';
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();
  if (path === '/admin' || hash === '#admin' || search.includes('admin=true')) {
    return 'admin';
  }
  if (path === '/account' || hash === '#account') {
    return 'account';
  }
  return 'store';
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<'store' | 'admin' | 'account'>(getInitialPage);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [categories, setCategories] = useState<CategoryData[]>([
    { id: 'cat-audio', name: 'Audio', subcategories: ['Headphones', 'Earphones', 'Speakers'] },
    { id: 'cat-timepieces', name: 'Timepieces', subcategories: ['Automatic', 'Chronograph', 'Field Watches'] },
    { id: 'cat-kitchen', name: 'Kitchen & Dining', subcategories: ['Coffee & Tea', 'Ceramics', 'Barware'] },
    { id: 'cat-apparel', name: 'Apparel', subcategories: ['Overshirts', 'Knitwear', 'Outerwear'] },
    { id: 'cat-leather', name: 'Leather Goods', subcategories: ['Bags', 'Wallets', 'Accessories'] }
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [bannerProductIds, setBannerProductIds] = useState<string[]>([]);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  // Wishlist state
  const [wishlistProductIds, setWishlistProductIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  // Orders state
  const [orders, setOrders] = useState<OrderConfirmation[]>([]);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string>('');
  const [isToastOpen, setIsToastOpen] = useState(false);

  // Synchronize route changes for /admin, #admin, /account, #account
  useEffect(() => {
    const handleUrlChange = () => {
      setCurrentPage(getInitialPage());
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const navigateToStore = () => {
    setCurrentPage('store');
    if (window.location.hash) {
      window.location.hash = '';
    }
    if (window.location.pathname === '/admin' || window.location.pathname === '/account') {
      window.history.pushState(null, '', '/');
    }
  };

  // 1. Initial connection verification & seed
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error('Please check your Firebase configuration.');
        }
      }
    };
    testConnection();
    seedInitialDataIfEmpty();
  }, []);

  // 2. Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 3. Live database subscriptions for products, categories, and banner settings
  useEffect(() => {
    const unsubProducts = subscribeProducts((liveProducts) => {
      if (liveProducts.length > 0) {
        setProducts(liveProducts);
      }
    });

    const unsubCategories = subscribeCategories((liveCategories) => {
      if (liveCategories.length > 0) {
        setCategories(liveCategories);
      }
    });

    const unsubBanner = subscribeBannerSettings((liveBannerIds) => {
      if (liveBannerIds.length > 0) {
        setBannerProductIds(liveBannerIds);
      }
    });

    return () => {
      unsubProducts();
      unsubCategories();
      unsubBanner();
    };
  }, []);

  // 4. Live database user profile, cart, wishlist, and orders subscription
  useEffect(() => {
    if (!currentUser) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      } catch {
        // fallback
      }
      return;
    }

    // Subscribe to profile
    const unsubProfile = subscribeUserProfile(currentUser.uid, (profile) => {
      setUserProfile(profile);
    });

    // Subscribe to wishlist
    const unsubWishlist = subscribeUserWishlist(currentUser.uid, (ids) => {
      setWishlistProductIds(ids);
      try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
      } catch {
        // fallback
      }
    });

    // Subscribe to orders
    const unsubOrders = subscribeUserOrders(currentUser.uid, (userOrdersList) => {
      setOrders(userOrdersList);
    });

    // Subscribe to cart
    const unsubCart = subscribeUserCart(currentUser.uid, (cartItems) => {
      setCart((prevCart) => {
        const productMap = new Map<string, Product>();
        for (const p of products) {
          productMap.set(p.id, p);
        }

        const newCart: CartItem[] = [];
        for (const item of cartItems) {
          const product = productMap.get(item.productId);
          if (product) {
            newCart.push({ product, quantity: item.quantity });
          } else {
            const existing = prevCart.find((it) => it.product.id === item.productId);
            if (existing) {
              newCart.push({ product: existing.product, quantity: item.quantity });
            }
          }
        }
        return newCart;
      });
    });

    return () => {
      unsubProfile();
      unsubWishlist();
      unsubOrders();
      unsubCart();
    };
  }, [currentUser, products]);

  // Auth actions
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      setCurrentPage('store');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Cart operations
  const handleAddToCart = async (product: Product, quantity: number = 1) => {
    const existing = cart.find((item) => item.product.id === product.id);
    const newQuantity = (existing ? existing.quantity : 0) + quantity;

    if (currentUser) {
      try {
        await saveCartItemToDb(currentUser.uid, product.id, newQuantity);
      } catch (err) {
        console.error('Cart sync error:', err);
      }
    } else {
      setCart((prev) => {
        if (existing) {
          return prev.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [...prev, { product, quantity }];
      });
    }

    setToastMessage(`Added ${product.name} to cart`);
    setIsToastOpen(true);
  };

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    if (currentUser) {
      if (quantity <= 0) {
        await removeCartItemFromDb(currentUser.uid, productId);
      } else {
        await saveCartItemToDb(currentUser.uid, productId, quantity);
      }
    } else {
      if (quantity <= 0) {
        handleRemoveItem(productId);
        return;
      }
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const handleRemoveItem = async (productId: string) => {
    if (currentUser) {
      await removeCartItemFromDb(currentUser.uid, productId);
    } else {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
    }
  };

  const handleToggleWishlist = async (productId: string) => {
    const isCurrentlyWishlisted = wishlistProductIds.includes(productId);
    const updated = isCurrentlyWishlisted
      ? wishlistProductIds.filter((id) => id !== productId)
      : [...wishlistProductIds, productId];

    setWishlistProductIds(updated);
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // fallback
    }

    if (currentUser) {
      await toggleWishlistItemInDb(currentUser.uid, productId, isCurrentlyWishlisted);
    }

    const prod = products.find((p) => p.id === productId);
    setToastMessage(
      isCurrentlyWishlisted
        ? `Removed ${prod?.name || 'item'} from wishlist`
        : `Added ${prod?.name || 'item'} to wishlist`
    );
    setIsToastOpen(true);
  };

  const handleOrderComplete = async (order: OrderConfirmation) => {
    if (currentUser) {
      const pids = cart.map((c) => c.product.id);
      await clearUserCartInDb(currentUser.uid, pids);
      await saveUserOrderToDb(currentUser.uid, order);
    }
    setOrders((prev) => [order, ...prev]);
    setCart([]);
  };

  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const currentCategoryData = useMemo(() => {
    return categories.find((c) => c.name === selectedCategory);
  }, [categories, selectedCategory]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'All' || product.category === selectedCategory;

      const matchesSubcategory =
        selectedSubcategory === 'All' || product.subcategory === selectedSubcategory;

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        (product.subcategory && product.subcategory.toLowerCase().includes(query)) ||
        product.description.toLowerCase().includes(query);

      return matchesCategory && matchesSubcategory && matchesSearch;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating-desc') return b.rating - a.rating;
      return 0;
    });
  }, [products, selectedCategory, selectedSubcategory, searchQuery, sortBy]);

  const handleProductSavedLocally = (product: Product) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === product.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = product;
        return updated;
      }
      return [product, ...prev];
    });
  };

  const handleProductDeletedLocally = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleCategorySavedLocally = (category: CategoryData) => {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === category.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = category;
        return updated;
      }
      return [...prev, category];
    });
  };

  const handleCategoryDeletedLocally = (categoryId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
  };

  // Dedicated separate Admin Portal Page
  if (currentPage === 'admin') {
    return (
      <AdminPortal
        onNavigateToStore={navigateToStore}
        products={products}
        categories={categories}
        bannerProductIds={bannerProductIds}
        onBannerProductIdsChange={setBannerProductIds}
        onProductSavedLocally={handleProductSavedLocally}
        onProductDeletedLocally={handleProductDeletedLocally}
        onCategorySavedLocally={handleCategorySavedLocally}
        onCategoryDeletedLocally={handleCategoryDeletedLocally}
      />
    );
  }

  // Dedicated separate Account Page
  if (currentPage === 'account') {
    if (!currentUser) {
      // If not logged in, route back to store and open auth modal
      return (
        <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-4">
          <div className="text-center bg-white p-8 rounded-2xl border border-neutral-200 max-w-md w-full shadow-sm">
            <h2 className="font-heading font-extrabold text-2xl text-neutral-900 mb-2">
              Sign In Required
            </h2>
            <p className="text-sm text-neutral-600 mb-6">
              Please sign in to access your account profile, cart, and wishlist.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={navigateToStore}
                className="px-4 py-2 border border-neutral-300 rounded-xl font-bold text-sm text-neutral-700 hover:bg-neutral-100 cursor-pointer"
              >
                Back to Store
              </button>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-5 py-2 bg-neutral-900 text-white rounded-xl font-bold text-sm hover:bg-neutral-800 cursor-pointer shadow-xs"
              >
                Sign In
              </button>
            </div>
            <AuthModal
              isOpen={isAuthModalOpen}
              onClose={() => setIsAuthModalOpen(false)}
            />
          </div>
        </div>
      );
    }

    return (
      <>
        <AccountPage
          currentUser={currentUser}
          userProfile={userProfile}
          cart={cart}
          wishlistProductIds={wishlistProductIds}
          products={products}
          orders={orders}
          onNavigateToStore={navigateToStore}
          onLogout={handleLogout}
          onUpdateCartQuantity={handleUpdateQuantity}
          onRemoveFromCart={handleRemoveItem}
          onProceedToCheckout={() => setIsCheckoutOpen(true)}
          onToggleWishlist={handleToggleWishlist}
          onAddToCart={handleAddToCart}
          onViewProductDetails={(p) => setActiveProduct(p)}
        />
        <ProductModal
          product={activeProduct}
          currentUser={currentUser}
          onClose={() => setActiveProduct(null)}
          onAddToCart={handleAddToCart}
          isWishlisted={activeProduct ? wishlistProductIds.includes(activeProduct.id) : false}
          onToggleWishlist={handleToggleWishlist}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          items={cart}
          onOrderComplete={handleOrderComplete}
        />
      </>
    );
  }

  // Pure customer website view
  return (
    <div className="min-h-screen bg-[#faf9f6] text-neutral-900 flex flex-col font-sans">
      {/* Top Navigation for Customers */}
      <Navbar
        cartCount={totalCartCount}
        wishlistCount={wishlistProductIds.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAccount={() => {
          if (!currentUser) {
            setIsAuthModalOpen(true);
          } else {
            setCurrentPage('account');
          }
        }}
        onOpenWishlist={() => {
          if (!currentUser) {
            setIsAuthModalOpen(true);
          } else {
            setCurrentPage('account');
          }
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setSelectedSubcategory('All');
        }}
        currentUser={currentUser}
        onLogin={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Cover Photo Advertisement Banner */}
        <FeaturedBanner
          products={products}
          bannerProductIds={bannerProductIds}
          onAddToCart={(p) => handleAddToCart(p, 1)}
          onViewDetails={(p) => setActiveProduct(p)}
        />

        {/* Controls Section: Categories and Sorting */}
        <section aria-label="Product filters and sorting" className="mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
            {/* Interactive Category Filter Controls */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedSubcategory('All');
                }}
                className={`px-4 py-2.5 rounded-xl text-base font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  selectedCategory === 'All'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-white text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 border border-neutral-200'
                }`}
              >
                <span>All</span>
                <span
                  className={`ml-2 text-xs font-bold ${
                    selectedCategory === 'All' ? 'text-neutral-300' : 'text-neutral-400'
                  }`}
                >
                  ({products.length})
                </span>
              </button>

              {categories.map((cat) => {
                const isActive = selectedCategory === cat.name;
                const count = products.filter((p) => p.category === cat.name).length;

                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.name);
                      setSelectedSubcategory('All');
                    }}
                    className={`px-4 py-2.5 rounded-xl text-base font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'bg-white text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 border border-neutral-200'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span
                      className={`ml-2 text-xs font-bold ${
                        isActive ? 'text-neutral-300' : 'text-neutral-400'
                      }`}
                    >
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sort & Results Count */}
            <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
              <span className="text-base text-neutral-600 font-medium">
                <span className="font-heading font-bold text-neutral-900">{filteredProducts.length}</span>{' '}
                {filteredProducts.length === 1 ? 'Product' : 'Products'}
              </span>

              <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-3 py-2 shadow-xs">
                <ArrowUpDown className="h-4 w-4 text-neutral-400" />
                <label htmlFor="sort-select" className="sr-only">
                  Sort products
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-base text-neutral-900 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="featured">Featured Order</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating-desc">Highest Rated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Subcategories Filter Bar */}
          {currentCategoryData && currentCategoryData.subcategories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedSubcategory('All')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  selectedSubcategory === 'All'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200'
                }`}
              >
                All Subcategories
              </button>
              {currentCategoryData.subcategories.map((sub, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedSubcategory(sub)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                    selectedSubcategory === sub
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}

          {/* Active Search indicator */}
          {searchQuery && (
            <div className="flex items-center justify-between bg-neutral-100 px-4 py-3 rounded-xl text-sm sm:text-base text-neutral-700">
              <span>
                Search results for: <strong className="text-neutral-900">&quot;{searchQuery}&quot;</strong>
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="font-bold underline hover:text-neutral-900 cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          )}
        </section>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <section
            aria-label="Products catalog"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          >
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={(p) => handleAddToCart(p, 1)}
                onViewDetails={(p) => setActiveProduct(p)}
                isWishlisted={wishlistProductIds.includes(product.id)}
                onToggleWishlist={handleToggleWishlist}
              />
            ))}
          </section>
        ) : (
          <div className="py-16 sm:py-20 text-center bg-white rounded-2xl border border-neutral-200 max-w-lg mx-auto p-6 sm:p-8 shadow-xs">
            <div className="h-14 w-14 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mx-auto mb-4">
              <SlidersHorizontal className="h-6 w-6" />
            </div>
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-neutral-900 mb-2">No matching products found</h2>
            <p className="text-base text-neutral-600 mb-6">
              Try changing your search query or selecting another category filter.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedSubcategory('All');
                setSearchQuery('');
              }}
              className="bg-neutral-900 text-white hover:bg-neutral-800 px-6 py-3 rounded-xl font-bold text-base transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>

      {/* Clean Customer Footer */}
      <footer className="border-t border-neutral-200 bg-white mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-base text-neutral-600">
          <span className="font-heading font-extrabold text-neutral-900 text-lg">MAISON</span>
          <span className="text-sm text-neutral-400">All rights reserved</span>
        </div>
      </footer>

      {/* Modals and Drawers */}
      <ProductModal
        product={activeProduct}
        currentUser={currentUser}
        onClose={() => setActiveProduct(null)}
        onAddToCart={handleAddToCart}
        isWishlisted={activeProduct ? wishlistProductIds.includes(activeProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        onOrderComplete={handleOrderComplete}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <Toast
        isOpen={isToastOpen}
        message={toastMessage}
        onClose={() => setIsToastOpen(false)}
        onOpenCart={() => {
          setIsToastOpen(false);
          setIsCartOpen(true);
        }}
      />
    </div>
  );
}
