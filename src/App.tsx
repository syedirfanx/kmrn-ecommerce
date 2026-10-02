/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowUpDown, Search, X, ArrowRight } from 'lucide-react';
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
  subscribeGuestOrders,
  subscribeBannerSlides,
  subscribeAnnouncements,
  subscribeStoreSettings,
  subscribeFeaturedProductIds,
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
type AppPage = 'home' | 'category' | 'admin' | 'account' | 'about' | 'contact';

const CART_STORAGE_KEY = 'maison_ecommerce_cart_v1';
const WISHLIST_STORAGE_KEY = 'maison_ecommerce_wishlist_v1';

const getInitialRoute = (): { page: AppPage; categoryName?: string } => {
  if (typeof window === 'undefined') return { page: 'home' };
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();

  if (path === '/admin' || hash === '#admin' || search.includes('admin=true')) {
    return { page: 'admin' };
  }
  if (path === '/account' || hash === '#account') {
    return { page: 'account' };
  }
  if (path === '/about' || hash === '#about') {
    return { page: 'about' };
  }
  if (path === '/contact' || hash === '#contact') {
    return { page: 'contact' };
  }
  if (path === '/womens-wear' || hash === '#womens-wear' || hash.includes('women')) {
    return { page: 'category', categoryName: "Elegant Women's Wear" };
  }
  if (path === '/home-decor' || hash === '#home-decor' || hash.includes('decor')) {
    return { page: 'category', categoryName: "Home Decor" };
  }
  return { page: 'home' };
};

export default function App() {
  const initialRoute = getInitialRoute();
  const [currentPage, setCurrentPage] = useState<AppPage>(initialRoute.page);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [accountInitialTab, setAccountInitialTab] = useState<'profile' | 'cart' | 'wishlist' | 'orders'>('profile');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem('aniq_cached_products');
      if (cached) return JSON.parse(cached);
    } catch {
      // storage fallback
    }
    return PRODUCTS;
  });
  const [categories, setCategories] = useState<CategoryData[]>(() => {
    try {
      const cached = localStorage.getItem('aniq_cached_categories');
      if (cached) return JSON.parse(cached);
    } catch {
      // storage fallback
    }
    return [
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
    ];
  });
  const [bannerSlides, setBannerSlides] = useState<BannerSlide[]>(() => {
    try {
      const cached = localStorage.getItem('aniq_cached_banner_slides');
      if (cached) return JSON.parse(cached);
    } catch {
      // storage fallback
    }
    return DEFAULT_BANNER_SLIDES;
  });
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(() => {
    try {
      const cached = localStorage.getItem('aniq_cached_announcements');
      if (cached) return JSON.parse(cached);
    } catch {
      // storage fallback
    }
    return DEFAULT_ANNOUNCEMENTS;
  });
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({});
  const [featuredProductIds, setFeaturedProductIds] = useState<string[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialRoute.categoryName || "Elegant Women's Wear"
  );
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
  const [toastShowCart, setToastShowCart] = useState(false);

  // Synchronize route changes
  useEffect(() => {
    const handleUrlChange = () => {
      const route = getInitialRoute();
      setCurrentPage(route.page);
      if (route.categoryName) {
        setSelectedCategory(route.categoryName);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
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

  const navigateTo = (page: AppPage) => {
    setCurrentPage(page);
    setSelectedSubcategory('All');
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      if (page === 'home') {
        window.history.pushState(null, '', '/');
      } else {
        window.history.pushState(null, '', `#${page}`);
      }
    } catch {
      // fallback
    }
  };

  const navigateToCategory = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setSelectedSubcategory('All');
    setSearchQuery('');
    setCurrentPage('category');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const slug = categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      window.history.pushState(null, '', `#${slug}`);
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

  // 3. Live database subscriptions
  useEffect(() => {
    const unsubProducts = subscribeProducts((liveProducts) => {
      setProducts(liveProducts);
      try {
        localStorage.setItem('aniq_cached_products', JSON.stringify(liveProducts));
      } catch {
        // fallback
      }
    });

    const unsubCategories = subscribeCategories((liveCategories) => {
      setCategories(liveCategories);
      try {
        localStorage.setItem('aniq_cached_categories', JSON.stringify(liveCategories));
      } catch {
        // fallback
      }
      if (liveCategories.length > 0) {
        // Ensure selected category is valid
        setSelectedCategory((prev) => {
          if (liveCategories.some((c) => c.name === prev)) return prev;
          return liveCategories[0]?.name || "Elegant Women's Wear";
        });
      }
    });

    const unsubBanner = subscribeBannerSlides((liveSlides) => {
      if (liveSlides && liveSlides.length > 0) {
        setBannerSlides(liveSlides);
        try {
          localStorage.setItem('aniq_cached_banner_slides', JSON.stringify(liveSlides));
        } catch {
          // fallback
        }
      }
    });

    const unsubAnnouncements = subscribeAnnouncements((liveAnnouncements) => {
      setAnnouncements(liveAnnouncements);
      try {
        localStorage.setItem('aniq_cached_announcements', JSON.stringify(liveAnnouncements));
      } catch {
        // fallback
      }
    });

    const unsubSettings = subscribeStoreSettings((liveSettings) => {
      setStoreSettings(liveSettings || {});
    });

    const unsubFeatured = subscribeFeaturedProductIds((liveIds) => {
      setFeaturedProductIds(liveIds || []);
    });

    return () => {
      unsubProducts();
      unsubCategories();
      unsubBanner();
      unsubAnnouncements();
      unsubSettings();
      unsubFeatured();
    };
  }, []);

  // 4. User / Guest data subscriptions
  useEffect(() => {
    if (!currentUser) {
      setUserProfile(null);
      // Guest mode: Subscribe live to guest orders from Firestore!
      const unsubGuestOrders = subscribeGuestOrders((guestOrders) => {
        setOrders(guestOrders);
      });
      return () => {
        unsubGuestOrders();
      };
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

    const unsubCart = subscribeUserCart(currentUser.uid, (cartItems) => {
      setCart(cartItems);
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      } catch {
        // fallback
      }
    });

    const unsubOrders = subscribeUserOrders(currentUser.uid, (orderList) => {
      setOrders(orderList);
    });

    return () => {
      unsubProfile();
      unsubWishlist();
      unsubCart();
      unsubOrders();
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

  // Wishlist handler - requires user to sign in
  const handleToggleWishlist = async (productId: string) => {
    if (!currentUser) {
      setToastShowCart(false);
      setToastMessage('Please sign in to save items to your wishlist');
      setIsToastOpen(true);
      setIsAuthModalOpen(true);
      return;
    }

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

    setToastShowCart(false);
    setToastMessage(isCurrentlyWishlisted ? 'Removed from wishlist' : 'Saved to wishlist');
    setIsToastOpen(true);

    await toggleWishlistItemInDb(currentUser.uid, productId, !isCurrentlyWishlisted);
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

    setToastShowCart(true);
    setToastMessage(`Added ${product.name} to cart`);
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
    setToastShowCart(false);
    setToastMessage('Signed out successfully');
    setIsToastOpen(true);
  };

  // Homepage Featured Products (Requirements 7: strictly only featured products, do NOT fill what are not featured)
  const featuredProducts = useMemo(() => {
    if (featuredProductIds && featuredProductIds.length > 0) {
      return featuredProductIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => p !== undefined);
    }
    return products.filter((p) => p.featured);
  }, [products, featuredProductIds]);

  // Category products
  const categoryProducts = useMemo(() => {
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  // Current category data
  const currentCategoryData = useMemo(() => {
    return categories.find((c) => c.name === selectedCategory);
  }, [categories, selectedCategory]);

  // Filtered and sorted products for active category
  const filteredProducts = useMemo(() => {
    return categoryProducts
      .filter((product) => {
        const matchesSubcategory =
          selectedSubcategory === 'All' || product.subcategory === selectedSubcategory;
        const matchesSearch =
          !searchQuery.trim() ||
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.subcategory &&
            product.subcategory.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesSubcategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'rating-desc') return b.rating - a.rating;
        return 0;
      });
  }, [categoryProducts, selectedSubcategory, searchQuery, sortBy]);

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Dedicated Admin Portal Page
  if (currentPage === 'admin') {
    return (
      <AdminPortal
        onNavigateToStore={() => navigateTo('home')}
        products={products}
        categories={categories}
        featuredProductIds={featuredProductIds}
        onFeaturedProductIdsChange={setFeaturedProductIds}
        bannerSlides={bannerSlides}
        onBannerSlidesChange={setBannerSlides}
        announcements={announcements}
        onAnnouncementsChange={setAnnouncements}
        onProductSavedLocally={(p) => setProducts((prev) => [p, ...prev.filter((i) => i.id !== p.id)])}
        onProductDeletedLocally={(id) => setProducts((prev) => prev.filter((i) => i.id !== id))}
        onCategorySavedLocally={(c) => setCategories((prev) => [c, ...prev.filter((i) => i.id !== c.id)])}
        onCategoryDeletedLocally={(id) => setCategories((prev) => prev.filter((i) => i.id !== id))}
      />
    );
  }

  // Dedicated Account Page (Supports both registered accounts and guest checkout tracking)
  if (currentPage === 'account') {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col">
        <AnnouncementBar
          announcements={announcements}
          onNavigateToShop={() => navigateToCategory(categories[0]?.name || "Elegant Women's Wear")}
        />
        <Navbar
          cartCount={totalCartCount}
          wishlistCount={wishlistProductIds.length}
          categories={categories}
          logoUrl={storeSettings.logoUrl}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenAccount={(tab) => {
            if (tab) setAccountInitialTab(tab);
            navigateTo('account');
          }}
          onNavigateToHome={() => navigateTo('home')}
          onNavigateToCategory={navigateToCategory}
          onNavigateToAbout={() => navigateTo('about')}
          onNavigateToContact={() => navigateTo('contact')}
          currentPage={currentPage}
          selectedCategory={selectedCategory}
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
          onNavigateToStore={() => navigateTo('home')}
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
          categories={categories}
          onNavigateToCategory={navigateToCategory}
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
          showCartButton={toastShowCart}
          onClose={() => setIsToastOpen(false)}
          onOpenCart={() => {
            setIsToastOpen(false);
            setIsCartOpen(true);
          }}
        />
      </div>
    );
  }

  // Dedicated About Page (Back to Store button removed per instruction 1)
  if (currentPage === 'about') {
    return (
      <div className="min-h-screen bg-[#faf9f6] text-neutral-900 flex flex-col font-sans">
        <AnnouncementBar
          announcements={announcements}
          onNavigateToShop={() => navigateToCategory(categories[0]?.name || "Elegant Women's Wear")}
        />
        <Navbar
          cartCount={totalCartCount}
          wishlistCount={wishlistProductIds.length}
          categories={categories}
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
          onNavigateToHome={() => navigateTo('home')}
          onNavigateToCategory={navigateToCategory}
          onNavigateToAbout={() => navigateTo('about')}
          onNavigateToContact={() => navigateTo('contact')}
          currentPage={currentPage}
          selectedCategory={selectedCategory}
          currentUser={currentUser}
          onLogin={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
        />
        <AboutPage onNavigateToCategory={navigateToCategory} />
        <Footer
          logoUrl={storeSettings.logoUrl}
          categories={categories}
          onNavigateToCategory={navigateToCategory}
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

  // Dedicated Contact Page (Back to Store button removed per instruction 1)
  if (currentPage === 'contact') {
    return (
      <div className="min-h-screen bg-[#faf9f6] text-neutral-900 flex flex-col font-sans">
        <AnnouncementBar
          announcements={announcements}
          onNavigateToShop={() => navigateToCategory(categories[0]?.name || "Elegant Women's Wear")}
        />
        <Navbar
          cartCount={totalCartCount}
          wishlistCount={wishlistProductIds.length}
          categories={categories}
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
          onNavigateToHome={() => navigateTo('home')}
          onNavigateToCategory={navigateToCategory}
          onNavigateToAbout={() => navigateTo('about')}
          onNavigateToContact={() => navigateTo('contact')}
          currentPage={currentPage}
          selectedCategory={selectedCategory}
          currentUser={currentUser}
          onLogin={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
        />
        <ContactPage />
        <Footer
          logoUrl={storeSettings.logoUrl}
          categories={categories}
          onNavigateToCategory={navigateToCategory}
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

  // Customer Storefront: Home Page or Dynamic Category Page
  return (
    <div className="min-h-screen bg-[#faf9f6] text-neutral-900 flex flex-col font-sans">
      {/* Running News / Offers Bar */}
      <AnnouncementBar
        announcements={announcements}
        onNavigateToShop={() => navigateToCategory(categories[0]?.name || "Elegant Women's Wear")}
      />

      {/* Top Navbar */}
      <Navbar
        cartCount={totalCartCount}
        wishlistCount={wishlistProductIds.length}
        categories={categories}
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
        onNavigateToHome={() => navigateTo('home')}
        onNavigateToCategory={navigateToCategory}
        onNavigateToAbout={() => navigateTo('about')}
        onNavigateToContact={() => navigateTo('contact')}
        currentPage={currentPage}
        selectedCategory={selectedCategory}
        currentUser={currentUser}
        onLogin={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Full-bleed Home Hero Banner (fit full on left, top, and right) */}
      {currentPage === 'home' && (
        <FeaturedBanner
          slides={bannerSlides}
          products={products}
          onAddToCart={(p) => handleAddToCart(p, 1)}
          onViewDetails={(p) => setActiveProduct(p)}
          onNavigateToShop={() => navigateToCategory(categories[0]?.name || "Elegant Women's Wear")}
          onNavigateToCategory={navigateToCategory}
          onNavigateToPage={navigateTo}
        />
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* VIEW 1: Home Page */}
        {currentPage === 'home' && (
          <div className="space-y-12">
            {/* Featured Collection: (Requirements 7: Hide if 0, show exact count if 1, 2, etc.) */}
            {featuredProducts.length > 0 && (
              <section aria-label="Featured Collection" className="pt-2">
                <div className="flex items-center justify-between gap-3 mb-6 pb-3 border-b border-stone-200/80">
                  <h2 className="font-heading font-medium text-2xl sm:text-3xl text-neutral-900 tracking-tight">
                    Featured Collection
                  </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                  {featuredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={(p, q) => handleAddToCart(p, q || 1)}
                      onViewDetails={(p) => setActiveProduct(p)}
                      isWishlisted={wishlistProductIds.includes(product.id)}
                      onToggleWishlist={handleToggleWishlist}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Dynamic Collection Showcase Cards for Categories in Database */}
            <section aria-label="Explore Categories" className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {categories.slice(0, 4).map((cat, idx) => {
                const sampleProduct = products.find((p) => p.category === cat.name);
                const bgImage =
                  sampleProduct?.image ||
                  (idx === 0
                    ? 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80'
                    : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80');

                return (
                  <div
                    key={cat.id}
                    className="relative rounded-2xl overflow-hidden bg-neutral-900 text-white min-h-[320px] flex flex-col justify-end p-6 sm:p-8 group shadow-sm"
                  >
                    <img
                      src={bgImage}
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover brightness-[0.72] group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                    <div className="relative z-10">
                      <h3 className="font-heading font-medium text-2xl sm:text-3xl text-white mb-2">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-stone-300 mb-5 max-w-md leading-relaxed">
                        {(cat.subcategories || []).slice(0, 4).join(', ')}
                      </p>
                      <button
                        onClick={() => navigateToCategory(cat.name)}
                        className="bg-white hover:bg-stone-100 text-neutral-900 text-xs font-semibold uppercase tracking-wider py-2.5 px-5 rounded-lg transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                      >
                        <span>Explore {cat.name}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </section>
          </div>
        )}

        {/* VIEW 2: Dynamic Category Page (e.g. Women's Wear, Home Decor, or any admin added category) */}
        {currentPage === 'category' && (
          <div className="space-y-6">
            {/* Editorial Header */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs text-stone-400 mb-2">
                  <button
                    onClick={() => navigateTo('home')}
                    className="hover:text-neutral-900 transition-colors cursor-pointer"
                  >
                    Home
                  </button>
                  <span>/</span>
                  <span className="text-neutral-900 font-semibold">
                    {selectedCategory}
                  </span>
                </div>

                <h1 className="font-heading font-medium text-2xl sm:text-3xl text-neutral-900 mb-2 tracking-tight">
                  {selectedCategory}
                </h1>

                <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
                  {selectedCategory.toLowerCase().includes('women') || selectedCategory.toLowerCase().includes('lawn') || selectedCategory.toLowerCase().includes('wear')
                    ? 'Authentic Pakistani stitched and unstitched collections. Crafted with premium lawn, luxury chiffon, and intricate festive embellishments.'
                    : selectedCategory.toLowerCase().includes('decor') || selectedCategory.toLowerCase().includes('home') || selectedCategory.toLowerCase().includes('bed')
                      ? 'Elevated living and bedroom comfort. 1000 thread count Egyptian cotton bedsheets, quilted velvet comforters, and timeless essentials.'
                      : `Explore our collection of authentic ${selectedCategory} products.`}
                </p>
              </div>

              {/* Right side category logo badge preserving original shape */}
              {(selectedCategory.toLowerCase().includes('women') || selectedCategory.toLowerCase().includes('lawn') || selectedCategory.toLowerCase().includes('wear')) && (
                <div className="shrink-0 flex items-center justify-center p-2 max-w-[260px] sm:max-w-[340px]">
                  <img
                    src="/images/aniq-1.png"
                    alt="ANIQ Women's Wear"
                    className="w-full h-auto aspect-auto object-contain max-h-36 sm:max-h-48 mix-blend-multiply transition-transform duration-300 hover:scale-105"
                  />
                </div>
              )}

              {(selectedCategory.toLowerCase().includes('decor') || selectedCategory.toLowerCase().includes('home') || selectedCategory.toLowerCase().includes('bed')) && (
                <div className="shrink-0 flex items-center justify-center p-2 max-w-[260px] sm:max-w-[340px]">
                  <img
                    src="/images/aniq-2.png"
                    alt="ANIQ Home Decor"
                    className="w-full h-auto aspect-auto object-contain max-h-36 sm:max-h-48 mix-blend-multiply transition-transform duration-300 hover:scale-105"
                  />
                </div>
              )}
            </div>

            {/* Search Bar & Sorting Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 sm:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search in ${selectedCategory}...`}
                  className="w-full bg-white border border-stone-300 rounded-xl pl-11 pr-10 py-2.5 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs transition-all"
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

              {/* Sort Dropdown & Count */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <span className="text-xs text-stone-500 font-medium">
                  <strong className="text-neutral-900 font-bold">{filteredProducts.length}</strong> Products
                </span>

                <div className="flex items-center gap-2 bg-white border border-stone-300 rounded-xl px-3.5 py-2 shadow-xs">
                  <ArrowUpDown className="h-3.5 w-3.5 text-neutral-400" />
                  <select
                    id="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="bg-transparent text-xs text-neutral-900 font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="featured">Featured Order</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating-desc">Highest Rated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Subcategories Filter Bar (Up to 10 subcategories) */}
            {currentCategoryData && (currentCategoryData.subcategories || []).length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedSubcategory('All')}
                  className={`px-3 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                    selectedSubcategory === 'All'
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white text-stone-600 hover:text-neutral-900 border border-stone-200/80'
                  }`}
                >
                  All
                </button>
                {(currentCategoryData.subcategories || []).map((sub, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSubcategory(sub)}
                    className={`px-3 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                      selectedSubcategory === sub
                        ? 'bg-neutral-900 text-white'
                        : 'bg-white text-stone-600 hover:text-neutral-900 border border-stone-200/80'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}

            {/* Active Search Result Tag */}
            {searchQuery && (
              <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl text-xs sm:text-sm text-neutral-700 shadow-xs border border-stone-200/70">
                <span>
                  Search results for: <strong className="text-neutral-900">&quot;{searchQuery}&quot;</strong>
                </span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="font-semibold underline text-neutral-900 cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            )}

            {/* Product Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
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
              </div>
            ) : (
              <div className="py-20 text-center bg-white rounded-3xl border border-stone-200/80 shadow-xs px-4">
                <p className="font-heading font-medium text-lg text-neutral-900 mb-1">
                  No products found
                </p>
                <p className="text-xs text-stone-500 mb-4">
                  Try adjusting your search query or subcategory filter.
                </p>
                <button
                  onClick={() => {
                    setSelectedSubcategory('All');
                    setSearchQuery('');
                  }}
                  className="bg-neutral-900 text-white font-semibold text-xs uppercase tracking-wider px-4 py-2 rounded-lg cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer
        logoUrl={storeSettings.logoUrl}
        categories={categories}
        onNavigateToCategory={navigateToCategory}
        onNavigateToAbout={() => navigateTo('about')}
        onNavigateToContact={() => navigateTo('contact')}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        currentUser={currentUser}
        userProfile={userProfile}
        onOrderComplete={handleOrderComplete}
      />

      {/* Detailed Product Modal */}
      <ProductModal
        product={activeProduct}
        currentUser={currentUser}
        onClose={() => setActiveProduct(null)}
        onAddToCart={handleAddToCart}
        isWishlisted={activeProduct ? wishlistProductIds.includes(activeProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Toast Feedback Notification (No cart link on logout) */}
      <Toast
        isOpen={isToastOpen}
        message={toastMessage}
        showCartButton={toastShowCart}
        onClose={() => setIsToastOpen(false)}
        onOpenCart={() => {
          setIsToastOpen(false);
          setIsCartOpen(true);
        }}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
