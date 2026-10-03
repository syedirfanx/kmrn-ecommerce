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
  Catalogue,
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
  subscribeCatalogues,
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
  DEFAULT_ANNOUNCEMENTS,
  DEFAULT_CATALOGUES
} from './services/storeService';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { Toast } from './components/Toast';
import { FeaturedBanner } from './components/FeaturedBanner';
import { CategoryShowcase } from './components/CategoryShowcase';
import { ProductPage } from './components/ProductPage';
import { AdminPortal } from './components/AdminPortal';
import { AuthModal } from './components/AuthModal';
import { AccountPage } from './components/AccountPage';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { Footer } from './components/Footer';

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating-desc';
type AppPage = 'home' | 'category' | 'admin' | 'account' | 'about' | 'contact' | 'product';

const CART_STORAGE_KEY = 'maison_ecommerce_cart_v1';
const WISHLIST_STORAGE_KEY = 'maison_ecommerce_wishlist_v1';

const getInitialRoute = (): { page: AppPage; categoryName?: string; productId?: string } => {
  if (typeof window === 'undefined') return { page: 'home' };
  let path = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();
  const rawHash = window.location.hash;
  const hash = rawHash.replace(/^#\/?/, '').toLowerCase();

  // If a hash was present in the browser URL, sanitize it to a clean path and replace history
  if (rawHash) {
    let cleanPath = '/';
    if (hash === 'admin' || hash === '/admin') cleanPath = '/admin';
    else if (hash === 'account' || hash === '/account') cleanPath = '/account';
    else if (hash === 'about' || hash === '/about') cleanPath = '/about';
    else if (hash === 'contact' || hash === '/contact') cleanPath = '/contact';
    else if (hash.startsWith('product/')) cleanPath = `/${hash}`;
    else if (hash.includes('women') || hash === 'womens-wear') cleanPath = '/category/womens-wear';
    else if (hash.includes('decor') || hash === 'home-decor') cleanPath = '/category/home-decor';
    else if (hash.startsWith('category/')) cleanPath = `/${hash}`;

    try {
      window.history.replaceState(null, '', cleanPath);
      path = cleanPath.toLowerCase();
    } catch {
      // fallback
    }
  }

  if (path === '/admin' || search.includes('admin=true')) {
    return { page: 'admin' };
  }
  if (path === '/account') {
    return { page: 'account' };
  }
  if (path === '/about') {
    return { page: 'about' };
  }
  if (path === '/contact') {
    return { page: 'contact' };
  }

  // Handle dedicated product path: /product/:id or /products/:id
  if (path.startsWith('/product/') || path.startsWith('/products/')) {
    const rawSegments = window.location.pathname.split('/').filter(Boolean);
    const prodId = rawSegments[1];
    if (prodId) {
      return { page: 'product', productId: prodId };
    }
  }

  // Handle category routes
  if (path === '/womens-wear' || path === '/category/womens-wear') {
    return { page: 'category', categoryName: "Elegant Women's Wear" };
  }
  if (path === '/home-decor' || path === '/category/home-decor') {
    return { page: 'category', categoryName: "Home Decor" };
  }
  if (path.startsWith('/category/')) {
    const slug = path.replace('/category/', '').split('/')[0];
    return { page: 'category', categoryName: slug };
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
  const [catalogues, setCatalogues] = useState<Catalogue[]>(DEFAULT_CATALOGUES);

  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialRoute.categoryName || "Elegant Women's Wear"
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
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

  const navigateTo = (page: AppPage) => {
    setCurrentPage(page);
    setSelectedSubcategory('All');
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      if (page === 'home') {
        window.history.pushState(null, '', '/');
      } else {
        window.history.pushState(null, '', `/${page}`);
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
      const lower = categoryName.toLowerCase();
      const slug = lower.includes('women')
        ? 'womens-wear'
        : lower.includes('decor') || lower.includes('home')
        ? 'home-decor'
        : categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      window.history.pushState(null, '', `/category/${slug}`);
    } catch {
      // fallback
    }
  };

  const navigateToProduct = (product: Product) => {
    setActiveProduct(product);
    setCurrentPage('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      window.history.pushState(null, '', `/product/${product.id}`);
    } catch {
      // fallback
    }
  };

  // Synchronize route changes
  useEffect(() => {
    const handleUrlChange = () => {
      const route = getInitialRoute();
      setCurrentPage(route.page);
      if (route.categoryName) {
        const foundCat = categories.find(
          (c) =>
            c.name.toLowerCase() === route.categoryName?.toLowerCase() ||
            c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === route.categoryName?.toLowerCase()
        );
        if (foundCat) {
          setSelectedCategory(foundCat.name);
        } else if (route.categoryName) {
          setSelectedCategory(route.categoryName);
        }
      }
      if (route.productId) {
        const foundProd = products.find((p) => p.id === route.productId);
        if (foundProd) {
          setActiveProduct(foundProd);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === 'a') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        navigateTo('admin');
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [categories, products]);

  // If initial load targeted a product before products loaded from Firestore
  useEffect(() => {
    const route = getInitialRoute();
    if (route.page === 'product' && route.productId && products.length > 0) {
      const found = products.find((p) => p.id === route.productId);
      if (found) {
        setActiveProduct(found);
      }
    }
  }, [products]);

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

    const unsubCatalogues = subscribeCatalogues((liveCatalogues) => {
      if (liveCatalogues && liveCatalogues.length > 0) {
        setCatalogues(liveCatalogues);
      }
    });

    return () => {
      unsubProducts();
      unsubCategories();
      unsubBanner();
      unsubAnnouncements();
      unsubSettings();
      unsubFeatured();
      unsubCatalogues();
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

    const unsubOrders = subscribeUserOrders(currentUser.uid, currentUser.email, (orderList) => {
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
    if (currentPage === 'account') {
      navigateTo('home');
    }
  };

  // Homepage Featured Products
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

  // Catalogues matching current category
  const currentCategoryCatalogues = useMemo(() => {
    return catalogues.filter((c) => c.category === selectedCategory);
  }, [catalogues, selectedCategory]);

  // Filtered and sorted products for active category
  const filteredProducts = useMemo(() => {
    return categoryProducts
      .filter((product) => {
        const matchesSubcategory =
          selectedSubcategory === 'All' ||
          product.subcategory === selectedSubcategory ||
          product.catalogueName === selectedSubcategory ||
          product.catalogueId === selectedSubcategory;
        const matchesSearch =
          !searchQuery.trim() ||
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.subcategory &&
            product.subcategory.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (product.catalogueName &&
            product.catalogueName.toLowerCase().includes(searchQuery.toLowerCase()));

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
          products={products}
          onSelectProduct={navigateToProduct}
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
          onViewProductDetails={(p) => navigateToProduct(p)}
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
          currentUser={currentUser}
          userProfile={userProfile}
          onOpenAuth={() => setIsAuthModalOpen(true)}
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
          products={products}
          onSelectProduct={navigateToProduct}
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
          products={products}
          onSelectProduct={navigateToProduct}
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
      {/* Top Navbar & Home Hero Banner (Fit to top on mobile/tablet and full screen on laptop) */}
      {currentPage === 'home' ? (
        <div className="relative w-full m-0 p-0 border-0 outline-none">
          {/* Header Overlay: Announcement Bar at top, Navbar directly below it */}
          <div className="absolute top-0 left-0 right-0 z-30 pointer-events-auto">
            <AnnouncementBar
              announcements={announcements}
              onNavigateToShop={() => navigateToCategory(categories[0]?.name || "Elegant Women's Wear")}
            />
            <Navbar
              cartCount={totalCartCount}
              wishlistCount={wishlistProductIds.length}
              categories={categories}
              products={products}
              onSelectProduct={navigateToProduct}
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
          </div>

          <FeaturedBanner
            slides={bannerSlides}
            products={products}
            onAddToCart={(p) => handleAddToCart(p, 1)}
            onViewDetails={(p) => navigateToProduct(p)}
            onNavigateToShop={() => navigateToCategory(categories[0]?.name || "Elegant Women's Wear")}
            onNavigateToCategory={navigateToCategory}
            onNavigateToPage={navigateTo}
          />
        </div>
      ) : (
        <>
          <AnnouncementBar
            announcements={announcements}
            onNavigateToShop={() => navigateToCategory(categories[0]?.name || "Elegant Women's Wear")}
          />
          <Navbar
            cartCount={totalCartCount}
            wishlistCount={wishlistProductIds.length}
            categories={categories}
            products={products}
            onSelectProduct={navigateToProduct}
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
        </>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* VIEW 1: Home Page */}
        {currentPage === 'home' && (
          <div className="space-y-12">
            {/* Category Logos Showcase (Home Decor & Elegant Women's Wear) placed above Features */}
            <CategoryShowcase
              categories={categories}
              onSelectCategory={navigateToCategory}
            />

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
                      onViewDetails={(p) => navigateToProduct(p)}
                      onQuickView={(p) => setQuickViewProduct(p)}
                      isWishlisted={wishlistProductIds.includes(product.id)}
                      onToggleWishlist={handleToggleWishlist}
                    />
                  ))}
                </div>
              </section>
            )}
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

            {/* Catalogue Showcase (Women's Wear and Categories with Catalogues) */}
            {currentCategoryCatalogues.length > 0 && !searchQuery.trim() ? (
              selectedSubcategory === 'All' ? (
                /* 1. All Catalogues View (No products under) */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-semibold text-xs uppercase tracking-wider text-stone-500">
                      Select a Collection or Catalogue
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {currentCategoryCatalogues.map((catg) => {
                      const catgCount = categoryProducts.filter(
                        (p) => p.catalogueId === catg.id || p.catalogueName === catg.name || p.subcategory === catg.name
                      ).length;

                      return (
                        <div
                          key={catg.id}
                          onClick={() => setSelectedSubcategory(catg.name)}
                          className="group relative bg-white rounded-2xl overflow-hidden border border-stone-200/80 hover:border-neutral-900 cursor-pointer transition-all duration-300 shadow-xs hover:shadow-md"
                        >
                          <div className="aspect-[4/3] bg-stone-100 overflow-hidden relative">
                            <img
                              src={catg.image}
                              alt={catg.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 rounded-md text-[10px] font-bold tabular-nums">
                              {catgCount} Items
                            </div>
                          </div>

                          <div className="p-3">
                            <h3 className="font-heading font-bold text-xs sm:text-sm text-neutral-900 truncate group-hover:text-stone-600 transition-colors">
                              {catg.name}
                            </h3>
                            {catg.description && (
                              <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                                {catg.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* 2. Single Selected Catalogue View (Other catalogues hidden, only its products shown) */
                <div className="space-y-6">
                  {(() => {
                    const activeCatg = currentCategoryCatalogues.find(
                      (c) => c.name === selectedSubcategory || c.id === selectedSubcategory
                    );
                    return (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-white rounded-2xl border border-stone-200/80 shadow-xs">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedSubcategory('All')}
                            className="px-3 py-1.5 rounded-xl border border-stone-300 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white text-xs font-semibold text-neutral-800 transition-all cursor-pointer shrink-0"
                          >
                            All Catalogues
                          </button>
                          <div>
                            <h2 className="font-heading font-bold text-sm sm:text-base text-neutral-900">
                              {activeCatg?.name || selectedSubcategory}
                            </h2>
                            {activeCatg?.description && (
                              <p className="text-xs text-stone-500">
                                {activeCatg.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-stone-500 font-medium shrink-0">
                          <strong className="text-neutral-900 font-bold">{filteredProducts.length}</strong> Products Available
                        </span>
                      </div>
                    );
                  })()}

                  {/* Products Grid for this selected catalogue */}
                  {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                      {filteredProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onAddToCart={(p, q) => handleAddToCart(p, q || 1)}
                          onViewDetails={(p) => navigateToProduct(p)}
                          onQuickView={(p) => setQuickViewProduct(p)}
                          isWishlisted={wishlistProductIds.includes(product.id)}
                          onToggleWishlist={handleToggleWishlist}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center bg-white rounded-2xl border border-stone-200/80 shadow-xs px-4">
                      <p className="font-heading font-medium text-base text-neutral-900 mb-1">
                        No products found in this catalogue
                      </p>
                      <button
                        onClick={() => setSelectedSubcategory('All')}
                        className="bg-neutral-900 text-white font-semibold text-xs uppercase tracking-wider px-4 py-2 rounded-lg cursor-pointer mt-3"
                      >
                        Return to Catalogues
                      </button>
                    </div>
                  )}
                </div>
              )
            ) : (
              /* Standard subcategories & product grid for categories without catalogues or when searching */
              <div className="space-y-6">
                {/* Subcategories Filter Bar */}
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
                        onViewDetails={(p) => navigateToProduct(p)}
                        onQuickView={(p) => setQuickViewProduct(p)}
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
          </div>
        )}

        {/* VIEW 3: Dedicated Product Detail Page */}
        {currentPage === 'product' && activeProduct && (
          <ProductPage
            product={activeProduct}
            allProducts={products}
            currentUser={currentUser}
            onAddToCart={(p, q) => handleAddToCart(p, q)}
            onProceedToCheckout={() => setIsCheckoutOpen(true)}
            isWishlisted={wishlistProductIds.includes(activeProduct.id)}
            onToggleWishlist={handleToggleWishlist}
            onNavigateToHome={() => navigateTo('home')}
            onNavigateToCategory={navigateToCategory}
            onSelectProduct={(p) => navigateToProduct(p)}
            onOpenQuickView={(p) => setQuickViewProduct(p)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
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
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOrderComplete={handleOrderComplete}
      />

      {/* Quick View Product Modal */}
      <ProductModal
        product={quickViewProduct}
        currentUser={currentUser}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
        isWishlisted={quickViewProduct ? wishlistProductIds.includes(quickViewProduct.id) : false}
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
