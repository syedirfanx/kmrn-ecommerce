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
  StoreSettings,
  PromoCode
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
  DEFAULT_CATEGORIES,
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

type SortOption = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'rating-desc';
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
  if (path === '/womens-wear' || path === '/category/womens-wear' || path.includes('women')) {
    return { page: 'category', categoryName: "Elegant Women's Wear" };
  }
  if (path === '/home-decor' || path === '/category/home-decor' || path.includes('decor') || path.includes('home')) {
    return { page: 'category', categoryName: "Home Decor" };
  }
  if (path.startsWith('/category/')) {
    const slug = path.replace('/category/', '').split('/')[0];
    const catName = slug.includes('women')
      ? "Elegant Women's Wear"
      : slug.includes('decor') || slug.includes('home')
      ? "Home Decor"
      : slug;
    return { page: 'category', categoryName: catName };
  }

  return { page: 'home' };
};

export default function App() {
  const initialRoute = getInitialRoute();
  const [currentPage, setCurrentPage] = useState<AppPage>(initialRoute.page);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [accountInitialTab, setAccountInitialTab] = useState<'profile' | 'addresses' | 'cart' | 'wishlist' | 'orders'>('profile');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [previousPage, setPreviousPage] = useState<{
    page: AppPage;
    category?: string;
    subcategory?: string;
  }>({ page: 'home' });

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
    return DEFAULT_CATEGORIES;
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

  // Promo Code state (consistent across side bag and checkout)
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(() => {
    try {
      const saved = sessionStorage.getItem('aniq_applied_promo');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  useEffect(() => {
    try {
      if (appliedPromo) {
        sessionStorage.setItem('aniq_applied_promo', JSON.stringify(appliedPromo));
      } else {
        sessionStorage.removeItem('aniq_applied_promo');
      }
    } catch {}
  }, [appliedPromo]);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string>('');
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastShowCart, setToastShowCart] = useState(false);

  const navigateTo = (page: AppPage) => {
    setActiveProduct(null);
    setQuickViewProduct(null);
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

  const navigateToCategory = (categoryNameOrSlug: string, subcategoryName?: string) => {
    setActiveProduct(null);
    setQuickViewProduct(null);

    const lower = (categoryNameOrSlug || '').toLowerCase().trim();
    // 1. Resolve slug or name to actual category
    const matchedCategory = categories.find((c) => {
      const cLower = c.name.toLowerCase();
      const cSlug = cLower.replace(/[^a-z0-9]+/g, '-');
      return (
        cLower === lower ||
        cSlug === lower ||
        (lower.includes('women') && cLower.includes('women')) ||
        ((lower.includes('decor') || lower.includes('home') || lower.includes('bed')) &&
          (cLower.includes('decor') || cLower.includes('home')))
      );
    });

    let targetCategory = matchedCategory?.name;
    let targetSubcategory = subcategoryName || 'All';

    // 2. If no direct category match, check if it's a catalogue name or ID
    if (!targetCategory) {
      const matchedCatalogue = catalogues.find(
        (cat) =>
          cat.id.toLowerCase() === lower ||
          cat.name.toLowerCase() === lower ||
          cat.name.toLowerCase().includes(lower)
      );
      if (matchedCatalogue) {
        targetCategory = matchedCatalogue.category;
        targetSubcategory = matchedCatalogue.name;
      }
    }

    // 3. Check if it's a product subcategory
    if (!targetCategory) {
      const prodWithSub = products.find(
        (p) =>
          (p.subcategory && p.subcategory.toLowerCase() === lower) ||
          (p.catalogueName && p.catalogueName.toLowerCase() === lower)
      );
      if (prodWithSub) {
        targetCategory = prodWithSub.category;
        targetSubcategory = prodWithSub.subcategory || prodWithSub.catalogueName || 'All';
      }
    }

    const finalCategoryName = targetCategory || categories[0]?.name || "Elegant Women's Wear";

    setSelectedCategory(finalCategoryName);
    setSelectedSubcategory(targetSubcategory);
    setSearchQuery('');
    setCurrentPage('category');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const slug = finalCategoryName.toLowerCase().includes('women')
        ? 'womens-wear'
        : finalCategoryName.toLowerCase().includes('decor') || finalCategoryName.toLowerCase().includes('home')
        ? 'home-decor'
        : finalCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      window.history.pushState(null, '', `/category/${slug}`);
    } catch {
      // fallback
    }
  };

  const navigateToProduct = (product: Product) => {
    // Record where we came from so Go Back returns to the exact page
    setPreviousPage({
      page: currentPage,
      category: selectedCategory,
      subcategory: selectedSubcategory
    });
    setActiveProduct(product);
    setCurrentPage('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      window.history.pushState(null, '', `/product/${product.id}`);
    } catch {
      // fallback
    }
  };

  const handleGoBackFromProduct = () => {
    setActiveProduct(null);
    setQuickViewProduct(null);

    // If there is browser history state or previous page recorded
    if (window.history.length > 1 && window.location.pathname.startsWith('/product/')) {
      window.history.back();
      return;
    }

    if (previousPage.page === 'category' && previousPage.category) {
      setSelectedCategory(previousPage.category);
      setSelectedSubcategory(previousPage.subcategory || 'All');
      setCurrentPage('category');
      try {
        const slug = previousPage.category.toLowerCase().includes('women')
          ? 'womens-wear'
          : previousPage.category.toLowerCase().includes('decor') || previousPage.category.toLowerCase().includes('home')
          ? 'home-decor'
          : previousPage.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        window.history.pushState(null, '', `/category/${slug}`);
      } catch {
        // fallback
      }
    } else if (previousPage.page && previousPage.page !== 'product') {
      setCurrentPage(previousPage.page);
      try {
        window.history.pushState(null, '', previousPage.page === 'home' ? '/' : `/${previousPage.page}`);
      } catch {
        // fallback
      }
    } else {
      // Fallback: return to product's category or home
      if (activeProduct?.category) {
        navigateToCategory(activeProduct.category);
      } else {
        navigateTo('home');
      }
    }
  };

  // Synchronize route changes
  useEffect(() => {
    const handleUrlChange = () => {
      const route = getInitialRoute();
      setCurrentPage(route.page);
      if (route.categoryName) {
        const lower = route.categoryName.toLowerCase();
        const foundCat = categories.find(
          (c) =>
            c.name.toLowerCase() === lower ||
            c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === lower ||
            (lower.includes('women') && c.name.toLowerCase().includes('women')) ||
            ((lower.includes('decor') || lower.includes('home')) &&
              (c.name.toLowerCase().includes('decor') || c.name.toLowerCase().includes('home')))
        );
        if (foundCat) {
          setSelectedCategory(foundCat.name);
        } else {
          setSelectedCategory(categories[0]?.name || "Elegant Women's Wear");
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
      setCart((prevCart) =>
        prevCart.map((cartItem) => {
          const freshProd = liveProducts.find((p) => p.id === cartItem.product.id);
          return freshProd
            ? {
                ...cartItem,
                product: {
                  ...freshProd,
                  selectedColour: cartItem.selectedColour || freshProd.selectedColour,
                  selectedSize: cartItem.selectedSize || freshProd.selectedSize
                }
              }
            : cartItem;
        })
      );
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
    const colour = product.selectedColour || (product.availableColours && product.availableColours[0]) || '';
    const size = product.selectedSize || (product.availableSizes && product.availableSizes[0]) || '';
    const fullProduct = { ...product, selectedColour: colour, selectedSize: size };

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          (item.selectedColour || item.product.selectedColour || '') === colour &&
          (item.selectedSize || item.product.selectedSize || '') === size
      );
      if (existingIdx >= 0) {
        return prev.map((item, idx) =>
          idx === existingIdx
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product: fullProduct, quantity, selectedColour: colour, selectedSize: size }];
    });

    const variantInfo = [colour, size].filter(Boolean).join(' • ');
    setToastShowCart(true);
    setToastMessage(`Added ${product.name}${variantInfo ? ` (${variantInfo})` : ''} to bag`);
    setIsToastOpen(true);

    if (currentUser) {
      const existing = cart.find(
        (item) =>
          item.product.id === product.id &&
          (item.selectedColour || item.product.selectedColour || '') === colour &&
          (item.selectedSize || item.product.selectedSize || '') === size
      );
      const newQty = (existing?.quantity || 0) + quantity;
      await saveCartItemToDb(currentUser.uid, {
        product: fullProduct,
        quantity: newQty,
        selectedColour: colour,
        selectedSize: size
      });
    }
  };

  const handleUpdateQuantity = async (
    productId: string,
    newQuantity: number,
    selectedColour?: string,
    selectedSize?: string
  ) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId, selectedColour, selectedSize);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        const match =
          item.product.id === productId &&
          (selectedColour === undefined || (item.selectedColour || item.product.selectedColour || '') === selectedColour) &&
          (selectedSize === undefined || (item.selectedSize || item.product.selectedSize || '') === selectedSize);
        return match ? { ...item, quantity: newQuantity } : item;
      })
    );

    if (currentUser) {
      const item = cart.find(
        (i) =>
          i.product.id === productId &&
          (selectedColour === undefined || (i.selectedColour || i.product.selectedColour || '') === selectedColour) &&
          (selectedSize === undefined || (i.selectedSize || i.product.selectedSize || '') === selectedSize)
      );
      if (item) {
        await saveCartItemToDb(currentUser.uid, {
          ...item,
          quantity: newQuantity,
          selectedColour: item.selectedColour || selectedColour,
          selectedSize: item.selectedSize || selectedSize
        });
      }
    }
  };

  const handleRemoveItem = async (
    productId: string,
    selectedColour?: string,
    selectedSize?: string
  ) => {
    setCart((prev) =>
      prev.filter((item) => {
        const match =
          item.product.id === productId &&
          (selectedColour === undefined || (item.selectedColour || item.product.selectedColour || '') === selectedColour) &&
          (selectedSize === undefined || (item.selectedSize || item.product.selectedSize || '') === selectedSize);
        return !match;
      })
    );

    if (currentUser) {
      await removeCartItemFromDb(currentUser.uid, productId, selectedColour, selectedSize);
    }
  };

  const handleOrderComplete = async (order: OrderConfirmation) => {
    setOrders((prev) => [order, ...prev]);
    setCart([]);
    setAppliedPromo(null);

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
        .map((id) => products.find((p) => p.id === id && !p.archived))
        .filter((p): p is Product => p !== undefined);
    }
    return products.filter((p) => p.featured && !p.archived);
  }, [products, featuredProductIds]);

  // Category products
  const categoryProducts = useMemo(() => {
    return products.filter((p) => p.category === selectedCategory && !p.archived);
  }, [products, selectedCategory]);

  // Current category data (case-insensitive)
  const currentCategoryData = useMemo(() => {
    return categories.find((c) => c.name.toLowerCase() === (selectedCategory || '').toLowerCase());
  }, [categories, selectedCategory]);

  // Catalogues matching current category (case-insensitive & respects hasCatalogues === false)
  const currentCategoryCatalogues = useMemo(() => {
    if (currentCategoryData?.hasCatalogues === false) return [];
    return catalogues.filter((c) => c.category.toLowerCase() === (selectedCategory || '').toLowerCase());
  }, [catalogues, selectedCategory, currentCategoryData]);

  const activeCatg = useMemo(() => {
    return currentCategoryCatalogues.find(
      (c) => c.name === selectedSubcategory || c.id === selectedSubcategory
    );
  }, [currentCategoryCatalogues, selectedSubcategory]);

  // Subcategories / collections present in this category's products
  const categorySubcategories = useMemo(() => {
    const subs = new Set<string>();
    categoryProducts.forEach((p) => {
      if (p.subcategory && p.subcategory.trim()) subs.add(p.subcategory.trim());
      if (p.catalogueName && p.catalogueName.trim()) subs.add(p.catalogueName.trim());
    });
    return Array.from(subs);
  }, [categoryProducts]);

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
        if (sortBy === 'newest') {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        }
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
          onProceedToCheckout={() => {
            if (cart.some((item) => item.product.inStock === false)) {
              return;
            }
            setIsCheckoutOpen(true);
          }}
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
          userDistrict={userProfile?.district}
          deliveryZone={userProfile?.deliveryZone}
          appliedPromo={appliedPromo}
          onApplyPromo={setAppliedPromo}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          products={products}
          onProceedToCheckout={() => {
            if (cart.some((item) => {
              const p = products.find(prod => prod.id === item.product.id);
              return (p ? p.inStock === false : item.product.inStock === false);
            })) {
              return;
            }
            setIsCheckoutOpen(true);
          }}
        />
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          items={cart}
          currentUser={currentUser}
          userProfile={userProfile}
          appliedPromo={appliedPromo}
          onApplyPromo={setAppliedPromo}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOrderComplete={handleOrderComplete}
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
          userDistrict={userProfile?.district}
          deliveryZone={userProfile?.deliveryZone}
          appliedPromo={appliedPromo}
          onApplyPromo={setAppliedPromo}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          products={products}
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
          userDistrict={userProfile?.district}
          deliveryZone={userProfile?.deliveryZone}
          appliedPromo={appliedPromo}
          onApplyPromo={setAppliedPromo}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          products={products}
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
      {/* Top Navbar & Hero Banner (Fit to top on both Home and Category pages, full width left-right) */}
      {currentPage === 'home' || currentPage === 'category' ? (
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
                setActiveProduct(null);
                setQuickViewProduct(null);
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

          {currentPage === 'home' ? (
            <FeaturedBanner
              slides={bannerSlides}
              products={products}
              categories={categories}
              catalogues={catalogues}
              onAddToCart={(p) => handleAddToCart(p, 1)}
              onViewDetails={(p) => navigateToProduct(p)}
              onNavigateToShop={() => navigateToCategory(categories[0]?.name || "Elegant Women's Wear")}
              onNavigateToCategory={navigateToCategory}
              onNavigateToPage={navigateTo}
              onOpenCart={() => setIsCartOpen(true)}
            />
          ) : (
            /* Full Bleed Category Hero Section (fit till top navbar, left and right full fit, reduced height) */
            <div className="relative w-full min-h-[240px] sm:min-h-[280px] md:min-h-[310px] flex items-end pb-6 sm:pb-8 pt-24 sm:pt-28 overflow-hidden bg-neutral-950">
              {/* Category Background Image */}
              <img
                src={
                  currentCategoryData?.heroImage ||
                  (selectedCategory.toLowerCase().includes('decor') || selectedCategory.toLowerCase().includes('home') || selectedCategory.toLowerCase().includes('bed')
                    ? 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=2560&q=95'
                    : 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=2560&q=95')
                }
                alt={selectedCategory}
                className="absolute inset-0 w-full h-full object-cover object-center scale-102"
              />
              {/* High Contrast Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/40" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />

              {/* Hero Content: Logo on same line with heading & description */}
              <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-row items-center justify-between gap-4 sm:gap-8">
                <div className="flex-1 min-w-0 text-white">
                  <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                    <h1 className="font-heading font-bold text-2xl sm:text-3xl md:text-4xl text-white tracking-tight drop-shadow-md break-words">
                      {selectedCategory}
                    </h1>
                    {currentCategoryData?.tag?.trim() && (
                      <span className="bg-white/20 backdrop-blur-xs text-white border border-white/30 text-[10px] sm:text-xs font-heading font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-xs">
                        {currentCategoryData.tag.trim()}
                      </span>
                    )}
                  </div>
                  {currentCategoryData?.description && (
                    <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-light drop-shadow-xs max-w-2xl break-words">
                      {currentCategoryData.description}
                    </p>
                  )}
                </div>

                {/* Category Logo - On Same Line with Heading & Description (Larger Size) */}
                {(() => {
                  const logoUrl =
                    currentCategoryData?.logo?.trim() ||
                    (selectedCategory.toLowerCase().includes('women') || selectedCategory.toLowerCase().includes('wear')
                      ? '/images/aniq-1.png'
                      : selectedCategory.toLowerCase().includes('decor') || selectedCategory.toLowerCase().includes('home')
                      ? '/images/aniq-2.png'
                      : '/images/aniq-logo.png');

                  return logoUrl ? (
                    <div className="shrink-0 flex items-center justify-end">
                      <img
                        src={logoUrl}
                        alt={selectedCategory}
                        className="w-auto h-auto max-h-28 sm:max-h-40 md:max-h-48 max-w-[200px] sm:max-w-[320px] md:max-w-[420px] object-contain drop-shadow-2xl filter brightness-0 invert transition-transform duration-300 hover:scale-105 select-none"
                      />
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          )}
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
              setActiveProduct(null);
              setQuickViewProduct(null);
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

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
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
          <div className="space-y-8">
            {/* Case A: Category with Catalogues */}
            {currentCategoryCatalogues.length > 0 ? (
              selectedSubcategory === 'All' && !searchQuery.trim() ? (
                /* 1. All Catalogues View (Catalogues first, search and sort hidden until selection) */
                <div className="space-y-8">
                  {/* Catalogue Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {currentCategoryCatalogues.map((catg) => {
                      const catgCount = categoryProducts.filter(
                        (p) => p.catalogueId === catg.id || p.catalogueName === catg.name || p.subcategory === catg.name
                      ).length;

                      return (
                        <div
                          key={catg.id}
                          onClick={() => setSelectedSubcategory(catg.name)}
                          className="group relative aspect-video rounded-2xl overflow-hidden border border-stone-200/80 hover:border-neutral-900 cursor-pointer transition-all duration-300 shadow-xs hover:shadow-xl"
                        >
                          {/* Image fits whole thumbnail */}
                          <img
                            src={catg.image}
                            alt={catg.name}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />

                          {/* Dark translucent vintage scrim overlay */}
                          <div className="absolute inset-0 bg-black/45 group-hover:bg-black/55 transition-colors duration-300 backdrop-blur-[0.5px]" />

                          {/* Centered White Heading with Vintage styling & All Capital Letters */}
                          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-3 text-center">
                            <h3 className="font-heading font-extrabold text-sm sm:text-base md:text-lg text-white uppercase tracking-widest drop-shadow-md">
                              {catg.name.toUpperCase()}
                            </h3>
                            {catg.description && (
                              <p className="font-subheading text-[10px] sm:text-xs text-stone-200 uppercase tracking-wider line-clamp-1 mt-1 opacity-90 drop-shadow-xs">
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
                /* 2. Single Selected Catalogue View (Catalogue header, then search and sort under, then products) */
                <div className="space-y-6">
                  {(() => {
                    const activeCatg = currentCategoryCatalogues.find(
                      (c) => c.name === selectedSubcategory || c.id === selectedSubcategory
                    );
                    return (
                      <>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-white rounded-2xl border border-stone-200/80 shadow-xs">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setSelectedSubcategory('All')}
                              className="px-3.5 py-1.5 rounded-xl border border-stone-300 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white text-xs font-semibold text-neutral-800 transition-all cursor-pointer shrink-0"
                            >
                              ← See all
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

                        {/* Search Bar & Sorting Controls placed UNDER the selected collection header */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                          <div className="relative flex-1 sm:max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder={`Search in ${activeCatg?.name || selectedSubcategory}...`}
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

                          <div className="flex items-center justify-end shrink-0">
                            <div className="flex items-center gap-2 bg-white border border-stone-300 rounded-xl px-3.5 py-2 shadow-xs">
                              <ArrowUpDown className="h-3.5 w-3.5 text-neutral-400" />
                              <select
                                id="sort-select-subcat"
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
                      </>
                    );
                  })()}

                  {/* Products Grid for this selected catalogue */}
                  {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
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
                        See all
                      </button>
                    </div>
                  )}
                </div>
              )
            ) : currentCategoryData?.hasCatalogues !== false && categorySubcategories.length > 0 && selectedSubcategory === 'All' && !searchQuery.trim() ? (
              /* Case B: Category without Catalogues but with Subcategories/Collections - Grid view before selection (Search & Sort hidden) */
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {categorySubcategories.map((subName) => {
                    const subProducts = categoryProducts.filter(
                      (p) => p.subcategory === subName || p.catalogueName === subName
                    );
                    const coverImage = subProducts[0]?.image || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=85';

                    return (
                      <div
                        key={subName}
                        onClick={() => setSelectedSubcategory(subName)}
                        className="group relative aspect-video rounded-2xl overflow-hidden border border-stone-200/80 hover:border-neutral-900 cursor-pointer transition-all duration-300 shadow-xs hover:shadow-xl"
                      >
                        {/* Image fits whole thumbnail */}
                        <img
                          src={coverImage}
                          alt={subName}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Dark translucent vintage scrim overlay */}
                        <div className="absolute inset-0 bg-black/45 group-hover:bg-black/55 transition-colors duration-300 backdrop-blur-[0.5px]" />

                        {/* Centered White Heading with Vintage styling & All Capital Letters */}
                        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-3 text-center">
                          <h3 className="font-heading font-extrabold text-sm sm:text-base md:text-lg text-white uppercase tracking-widest drop-shadow-md">
                            {subName.toUpperCase()}
                          </h3>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : currentCategoryData?.hasCatalogues !== false && selectedSubcategory !== 'All' && !searchQuery.trim() ? (
              /* Case C: Single Selected Collection view (Header, then Search & Sort, then Products) */
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-white rounded-2xl border border-stone-200/80 shadow-xs">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedSubcategory('All')}
                      className="px-3.5 py-1.5 rounded-xl border border-stone-300 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white text-xs font-semibold text-neutral-800 transition-all cursor-pointer shrink-0"
                    >
                      ← See all
                    </button>
                    <div>
                      <h2 className="font-heading font-bold text-sm sm:text-base text-neutral-900">
                        {selectedSubcategory}
                      </h2>
                    </div>
                  </div>
                  <span className="text-xs text-stone-500 font-medium shrink-0">
                    <strong className="text-neutral-900 font-bold">{filteredProducts.length}</strong> Products Available
                  </span>
                </div>

                {/* Search Bar & Sorting Controls placed UNDER the selected collection header */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1 sm:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`Search in ${selectedSubcategory}...`}
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

                  <div className="flex items-center justify-end shrink-0">
                    <div className="flex items-center gap-2 bg-white border border-stone-300 rounded-xl px-3.5 py-2 shadow-xs">
                      <ArrowUpDown className="h-3.5 w-3.5 text-neutral-400" />
                      <select
                        id="sort-select-subcat-coll"
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

                {/* Products Grid for this selected collection */}
                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
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
                      No products found in this collection
                    </p>
                    <button
                      onClick={() => setSelectedSubcategory('All')}
                      className="bg-neutral-900 text-white font-semibold text-xs uppercase tracking-wider px-4 py-2 rounded-lg cursor-pointer mt-3"
                    >
                      See all
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Case D: General product grid with active search */
              <div className="space-y-6">
                {/* Search Bar & Sorting Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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

                  <div className="flex items-center justify-end shrink-0">
                    <div className="flex items-center gap-2 bg-white border border-stone-300 rounded-xl px-3.5 py-2 shadow-xs">
                      <ArrowUpDown className="h-3.5 w-3.5 text-neutral-400" />
                      <select
                        id="sort-select-default"
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
                      Try adjusting your search query or filters.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedSubcategory('All');
                      }}
                      className="bg-neutral-900 text-white font-semibold text-xs uppercase tracking-wider px-4 py-2 rounded-lg cursor-pointer"
                    >
                      Reset filters
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
            onGoBack={handleGoBackFromProduct}
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
        userDistrict={userProfile?.district}
        deliveryZone={userProfile?.deliveryZone}
        appliedPromo={appliedPromo}
        onApplyPromo={setAppliedPromo}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        products={products}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        currentUser={currentUser}
        userProfile={userProfile}
        appliedPromo={appliedPromo}
        onApplyPromo={setAppliedPromo}
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
