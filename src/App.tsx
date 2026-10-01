/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { SlidersHorizontal, ArrowUpDown, Search, X } from 'lucide-react';
import { User, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { PRODUCTS } from './data/products';
import {
  Product,
  CategoryData,
  CartItem,
  OrderConfirmation,
  UserProfile,
  BannerSlide,
  AnnouncementItem,
  StoreSettings
} from './types';
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
  subscribeBannerSlides,
  subscribeAnnouncements,
  subscribeStoreSettings,
  DEFAULT_BANNER_SLIDES,
  DEFAULT_ANNOUNCEMENTS
} from './services/storeService';
import { AnnouncementBar } from './components/AnnouncementBar';
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
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { Footer } from './components/Footer';

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating-desc';
type AppPage = 'store' | 'admin' | 'account' | 'about' | 'contact';

const CART_STORAGE_KEY = 'maison_ecommerce_cart_v1';
const WISHLIST_STORAGE_KEY = 'maison_ecommerce_wishlist_v1';

const getInitialPage = (): AppPage => {
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
  if (path === '/about' || hash === '#about') {
    return 'about';
  }
  if (path === '/contact' || hash === '#contact') {
    return 'contact';
  }
  return 'store';
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>(getInitialPage);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [accountInitialTab, setAccountInitialTab] = useState<'profile' | 'cart' | 'wishlist' | 'orders'>('profile');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [categories, setCategories] = useState<CategoryData[]>([
    {
      id: 'cat-womens-wear',
      name: "Elegant Women's Wear",
      subcategories: ['Original Pakistani Lawn', 'Luxury Chiffon', 'Festive Embroidered', 'Ready to Wear']
    },
    {
      id: 'cat-home-decor',
      name: 'Home Decor',
      subcategories: ['Bedsheets', 'Comforters', 'Duvet Sets', 'Quilt Sets']
    }
  ]);
  const [bannerSlides, setBannerSlides] = useState<BannerSlide[]>(DEFAULT_BANNER_SLIDES);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(DEFAULT_ANNOUNCEMENTS);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({});

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

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

  // Synchronize route changes for /admin, #admin, /account, #account, etc.
  useEffect(() => {
    const handleUrlChange = () => {
      setCurrentPage(getInitialPage());
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      // Secret admin shortcut: Ctrl+Shift+A or Alt+A
      if ((e.altKey && e.key.toLowerCase() === 'a') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        navigateTo('admin');
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Update hash when currentPage changes
  const navigateTo = (page: AppPage) => {
    setCurrentPage(page);
    try {
      if (page === 'store') {
        window.history.pushState(null, '', '/');
      } else {
        window.history.pushState(null, '', `#${page}`);
      }
    } catch {
      // fallback
    }
  };

  // 1. Initial database seeding
  useEffect(() => {
    seedInitialDataIfEmpty();
  }, []);

  // 2. Authentication state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 3. Live database subscriptions for products, categories, banner, and announcements
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

    const unsubBanner = subscribeBannerSlides((liveSlides) => {
      if (liveSlides.length > 0) {
        setBannerSlides(liveSlides);
      }
    });

    const unsubAnnouncements = subscribeAnnouncements((liveAnnouncements) => {
      if (liveAnnouncements.length > 0) {
        setAnnouncements(liveAnnouncements);
      }
    });

    const unsubSettings = subscribeStoreSettings((liveSettings) => {
      setStoreSettings(liveSettings || {});
    });

    return () => {
      unsubProducts();
      unsubCategories();
      unsubBanner();
      unsubAnnouncements();
      unsubSettings();
    };
  }, []);

  // 4. User data subscriptions
  useEffect(() => {
    if (!currentUser) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      } catch {
        // fallback
      }
      return;
    }

    const unsubProfile = subscribeUserProfile(currentUser.uid, (profile) => {
      setUserProfile(profile);
    });

    const unsubWishlist = subscribeUserWishlist(currentUser.uid, (ids) => {
      setWishlistProductIds(ids);
      try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
      } catch {
        // fallback
      }
    });

    const unsubOrders = subscribeUserOrders(currentUser.uid, (userOrdersList) => {
      setOrders(userOrdersList);
    });

    const unsubCart = subscribeUserCart(currentUser.uid, (remoteCartItems) => {
      if (remoteCartItems.length > 0) {
        setCart(remoteCartItems);
      }
    });

    return () => {
      unsubProfile();
      unsubWishlist();
      unsubOrders();
      unsubCart();
    };
  }, [currentUser]);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // fallback
    }
  }, [cart]);

  // Wishlist handler
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

    setToastMessage(isCurrentlyWishlisted ? 'Removed from wishlist' : 'Saved to wishlist');
    setIsToastOpen(true);

    if (currentUser) {
      await toggleWishlistItemInDb(currentUser.uid, productId, !isCurrentlyWishlisted);
    }
  };

  // Cart handlers
  const handleAddToCart = async (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });

    setToastMessage(`Added ${quantity} ${product.name} to cart`);
    setIsToastOpen(true);

    if (currentUser) {
      const existing = cart.find((item) => item.product.id === product.id);
      const newQty = (existing?.quantity || 0) + quantity;
      await saveCartItemToDb(currentUser.uid, product, newQty);
    }
  };

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );

    if (currentUser) {
      const item = cart.find((i) => i.product.id === productId);
      if (item) {
        await saveCartItemToDb(currentUser.uid, item.product, newQuantity);
      }
    }
  };

  const handleRemoveItem = async (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    if (currentUser) {
      await removeCartItemFromDb(currentUser.uid, productId);
    }
  };

  const handleOrderComplete = async (order: OrderConfirmation) => {
    setOrders((prev) => [order, ...prev]);
    setCart([]);

    if (currentUser) {
      await saveUserOrderToDb(currentUser.uid, order);
      await clearUserCartInDb(currentUser.uid);
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setToastMessage('Signed out successfully');
    setIsToastOpen(true);
  };

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesCategory =
          selectedCategory === 'All' || product.category === selectedCategory;
        const matchesSubcategory =
          selectedSubcategory === 'All' || product.subcategory === selectedSubcategory;
        const matchesSearch =
          !searchQuery.trim() ||
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.subcategory &&
            product.subcategory.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesCategory && matchesSubcategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'rating-desc') return b.rating - a.rating;
        return 0;
      });
  }, [products, selectedCategory, selectedSubcategory, searchQuery, sortBy]);

  const currentCategoryData = categories.find((c) => c.name === selectedCategory);
  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Dedicated Admin Portal Page
  if (currentPage === 'admin') {
    return (
      <AdminPortal
        onNavigateToStore={() => navigateTo('store')}
        products={products}
        categories={categories}
        bannerSlides={bannerSlides}
        onBannerSlidesChange={setBannerSlides}
        announcements={announcements}
        onAnnouncementsChange={setAnnouncements}
        storeSettings={storeSettings}
        onStoreSettingsChange={setStoreSettings}
        onProductSavedLocally={(p) => setProducts((prev) => [p, ...prev.filter((i) => i.id !== p.id)])}
        onProductDeletedLocally={(id) => setProducts((prev) => prev.filter((i) => i.id !== id))}
        onCategorySavedLocally={(c) => setCategories((prev) => [c, ...prev.filter((i) => i.id !== c.id)])}
        onCategoryDeletedLocally={(id) => setCategories((prev) => prev.filter((i) => i.id !== id))}
      />
    );
  }

  // Dedicated Account Page
  if (currentPage === 'account') {
    if (!currentUser) {
      return (
        <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-4">
          <div className="text-center bg-white p-8 rounded-3xl max-w-md w-full shadow-sm">
            <h2 className="font-heading font-extrabold text-2xl text-neutral-900 mb-2">
              Sign In Required
            </h2>
            <p className="text-sm text-neutral-600 mb-6">
              Please sign in to access your account profile, cart, and wishlist.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigateTo('store')}
                className="px-4 py-2 bg-neutral-100 rounded-xl font-bold text-xs text-neutral-700 hover:bg-neutral-200 cursor-pointer"
              >
                Back to Store
              </button>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-5 py-2 bg-neutral-900 text-white rounded-xl font-bold text-xs hover:bg-neutral-800 cursor-pointer shadow-xs"
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
      <div className="min-h-screen bg-[#faf9f6] flex flex-col">
        <AnnouncementBar
          announcements={announcements}
          onNavigateToShop={() => navigateTo('store')}
        />
        <Navbar
          cartCount={totalCartCount}
          wishlistCount={wishlistProductIds.length}
          logoUrl={storeSettings.logoUrl}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenAccount={(tab) => {
            if (tab) setAccountInitialTab(tab);
            navigateTo('account');
          }}
          onNavigateToShop={() => navigateTo('store')}
          onNavigateToAbout={() => navigateTo('about')}
          onNavigateToContact={() => navigateTo('contact')}
          currentPage={currentPage}
          currentUser={currentUser}
          onLogin={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
        />
        <AccountPage
          currentUser={currentUser}
          userProfile={userProfile}
          cart={cart}
          wishlistProductIds={wishlistProductIds}
          products={products}
          orders={orders}
          initialTab={accountInitialTab}
          logoUrl={storeSettings.logoUrl}
          onNavigateToStore={() => navigateTo('store')}
          onLogout={handleLogout}
          onUpdateCartQuantity={handleUpdateQuantity}
          onRemoveFromCart={handleRemoveItem}
          onProceedToCheckout={() => setIsCheckoutOpen(true)}
          onToggleWishlist={handleToggleWishlist}
          onAddToCart={handleAddToCart}
          onViewProductDetails={(p) => setActiveProduct(p)}
        />
        <Footer
          logoUrl={storeSettings.logoUrl}
          onNavigateToShop={() => navigateTo('store')}
          onNavigateToAbout={() => navigateTo('about')}
          onNavigateToContact={() => navigateTo('contact')}
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
        <ProductModal
          product={activeProduct}
          currentUser={currentUser}
          onClose={() => setActiveProduct(null)}
          onAddToCart={handleAddToCart}
          isWishlisted={activeProduct ? wishlistProductIds.includes(activeProduct.id) : false}
          onToggleWishlist={handleToggleWishlist}
          onOpenAuth={() => setIsAuthModalOpen(true)}
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

  // Dedicated About Page
  if (currentPage === 'about') {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col">
        <AnnouncementBar
          announcements={announcements}
          onNavigateToShop={() => navigateTo('store')}
        />
        <Navbar
          cartCount={totalCartCount}
          wishlistCount={wishlistProductIds.length}
          logoUrl={storeSettings.logoUrl}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenAccount={(tab) => {
            if (!currentUser) {
              setIsAuthModalOpen(true);
            } else {
              setAccountInitialTab(tab || 'profile');
              navigateTo('account');
            }
          }}
          onNavigateToShop={() => navigateTo('store')}
          onNavigateToAbout={() => navigateTo('about')}
          onNavigateToContact={() => navigateTo('contact')}
          currentPage={currentPage}
          currentUser={currentUser}
          onLogin={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
        />
        <AboutPage onNavigateToStore={() => navigateTo('store')} />
        <Footer
          logoUrl={storeSettings.logoUrl}
          onNavigateToShop={() => navigateTo('store')}
          onNavigateToAbout={() => navigateTo('about')}
          onNavigateToContact={() => navigateTo('contact')}
        />
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onProceedToCheckout={() => setIsCheckoutOpen(true)}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </div>
    );
  }

  // Dedicated Contact Page
  if (currentPage === 'contact') {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col">
        <AnnouncementBar
          announcements={announcements}
          onNavigateToShop={() => navigateTo('store')}
        />
        <Navbar
          cartCount={totalCartCount}
          wishlistCount={wishlistProductIds.length}
          logoUrl={storeSettings.logoUrl}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenAccount={(tab) => {
            if (!currentUser) {
              setIsAuthModalOpen(true);
            } else {
              setAccountInitialTab(tab || 'profile');
              navigateTo('account');
            }
          }}
          onNavigateToShop={() => navigateTo('store')}
          onNavigateToAbout={() => navigateTo('about')}
          onNavigateToContact={() => navigateTo('contact')}
          currentPage={currentPage}
          currentUser={currentUser}
          onLogin={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
        />
        <ContactPage onNavigateToStore={() => navigateTo('store')} />
        <Footer
          logoUrl={storeSettings.logoUrl}
          onNavigateToShop={() => navigateTo('store')}
          onNavigateToAbout={() => navigateTo('about')}
          onNavigateToContact={() => navigateTo('contact')}
        />
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onProceedToCheckout={() => setIsCheckoutOpen(true)}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </div>
    );
  }

  // Pure Storefront Customer Website
  return (
    <div className="min-h-screen bg-[#faf9f6] text-neutral-900 flex flex-col font-sans">
      {/* Running News / Offers Bar */}
      <AnnouncementBar
        announcements={announcements}
        onNavigateToShop={() => navigateTo('store')}
      />

      {/* Top Navbar */}
      <Navbar
        cartCount={totalCartCount}
        wishlistCount={wishlistProductIds.length}
        logoUrl={storeSettings.logoUrl}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAccount={(tab) => {
          if (!currentUser) {
            setIsAuthModalOpen(true);
          } else {
            setAccountInitialTab(tab || 'profile');
            navigateTo('account');
          }
        }}
        onNavigateToShop={() => navigateTo('store')}
        onNavigateToAbout={() => navigateTo('about')}
        onNavigateToContact={() => navigateTo('contact')}
        currentPage={currentPage}
        currentUser={currentUser}
        onLogin={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Cover Photo Advertisement Carousel Banner */}
        <FeaturedBanner
          slides={bannerSlides}
          products={products}
          onAddToCart={(p) => handleAddToCart(p, 1)}
          onViewDetails={(p) => setActiveProduct(p)}
          onNavigateToShop={() => {
            const el = document.getElementById('shop-catalog-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Search Bar & Filters Section (Positioned Directly After Banner) */}
        <section id="shop-catalog-section" aria-label="Product search and filters" className="mb-8 space-y-4">
          {/* Search Bar & Sorting Controls Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search input */}
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products or categories..."
                className="w-full bg-white border border-stone-300 rounded-2xl pl-11 pr-10 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
              <span className="text-xs text-neutral-500 font-medium">
                <strong className="text-neutral-900 font-bold">{filteredProducts.length}</strong> Products
              </span>

              <div className="flex items-center gap-2 bg-white border border-stone-300 rounded-2xl px-4 py-2.5 shadow-xs">
                <ArrowUpDown className="h-3.5 w-3.5 text-neutral-400" />
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-xs sm:text-sm text-neutral-900 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="featured">Featured Order</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating-desc">Highest Rated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedSubcategory('All');
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
                selectedCategory === 'All'
                  ? 'bg-[#283618] text-white border-[#445837] shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-stone-50 border-stone-200/90 shadow-xs'
              }`}
            >
              <span>All</span>
              <span className={`ml-1.5 text-xs ${selectedCategory === 'All' ? 'text-stone-300' : 'text-stone-400'}`}>
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
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
                    isActive
                      ? 'bg-[#283618] text-white border-[#445837] shadow-xs'
                      : 'bg-white text-stone-700 hover:bg-stone-50 border-stone-200/90 shadow-xs'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`ml-1.5 text-xs ${isActive ? 'text-stone-300' : 'text-stone-400'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Subcategories Filter Bar */}
          {currentCategoryData && currentCategoryData.subcategories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedSubcategory('All')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  selectedSubcategory === 'All'
                    ? 'bg-[#283618] text-white'
                    : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200/70'
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
                      ? 'bg-[#283618] text-white'
                      : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200/70'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}

          {/* Active Search Result Tag */}
          {searchQuery && (
            <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl text-xs sm:text-sm text-neutral-700 shadow-xs">
              <span>
                Search results for: <strong className="text-neutral-900">&quot;{searchQuery}&quot;</strong>
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="font-bold underline text-neutral-900 cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          )}
        </section>

        {/* Compact Product Grid: 4 in desktop, 3 in tablet, 2 in mobile */}
        {filteredProducts.length > 0 ? (
          <section
            aria-label="Products catalog"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5"
          >
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={(p, q) => handleAddToCart(p, q || 1)}
                onViewDetails={(p) => setActiveProduct(p)}
                isWishlisted={wishlistProductIds.includes(product.id)}
                onToggleWishlist={handleToggleWishlist}
              />
            ))}
          </section>
        ) : (
          <div className="py-16 text-center bg-white rounded-3xl max-w-md mx-auto p-6 sm:p-8 shadow-xs">
            <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mx-auto mb-3">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <h2 className="font-heading font-extrabold text-xl text-neutral-900 mb-2">
              No matching products found
            </h2>
            <p className="text-sm text-neutral-500 mb-5">
              Try adjusting your search query or selecting another category filter.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedSubcategory('All');
                setSearchQuery('');
              }}
              className="bg-neutral-900 text-white hover:bg-neutral-800 px-5 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-xs"
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>

      {/* Global Footer */}
      <Footer
        logoUrl={storeSettings.logoUrl}
        onNavigateToShop={() => navigateTo('store')}
        onNavigateToAbout={() => navigateTo('about')}
        onNavigateToContact={() => navigateTo('contact')}
      />

      {/* Modals & Drawers */}
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
