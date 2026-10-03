import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Product,
  CategoryData,
  UserProfile,
  OrderConfirmation,
  CartItem,
  ProductReview,
  BannerSlide,
  AnnouncementItem,
  StoreSettings,
  ContactMessage
} from '../types';
import { PRODUCTS } from '../data/products';

export const DEFAULT_CATEGORIES: CategoryData[] = [
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

export const DEFAULT_BANNER_SLIDES: BannerSlide[] = [
  {
    id: 'banner-slide-1',
    type: 'product',
    productId: 'prod-pw-1',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=2560&q=95',
    title: 'Baroque Luxury Embroidered Chiffon 3-Piece',
    subtitle: '100% Original Pakistani Designer Collection with Hand-Embellished Zari'
  },
  {
    id: 'banner-slide-2',
    type: 'custom',
    title: 'Home Decor & Luxury Bedding',
    subtitle: '1000 TC Egyptian Cotton Bedsheets & Quilted Velvet Comforters',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=2560&q=95',
    buttonText: 'Shop Home Decor',
    linkUrl: '#shop'
  },
  {
    id: 'banner-slide-3',
    type: 'product',
    productId: 'prod-hd-2',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=2560&q=95',
    title: 'Royal Velvet Quilted Winter Comforter Set',
    subtitle: 'Plush Velvet Quilting with 400 GSM Down-Alternative Loft'
  }
];

export const DEFAULT_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'ann-1',
    text: 'Special Offer: Free Express Delivery Across Bangladesh on Original Pakistani Suits and Home Decor',
    linkText: 'Shop Now',
    linkUrl: '#shop',
    active: true,
    startDate: '',
    endDate: ''
  }
];

export const seedInitialDataIfEmpty = async () => {
  try {
    // Check if system has already completed initial initialization
    // This prevents deleted products, categories, or banners from reappearing after refresh
    if (typeof window !== 'undefined' && localStorage.getItem('aniq_system_initialized_v2') === 'true') {
      return;
    }
    const systemDocRef = doc(db, 'settings', 'system');
    const systemSnap = await getDoc(systemDocRef);
    if (systemSnap.exists() && systemSnap.data()?.seeded) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('aniq_system_initialized_v2', 'true');
      }
      return;
    }

    const productsRef = collection(db, 'products');
    const productsSnap = await getDocs(productsRef);

    if (productsSnap.empty) {
      const batch = writeBatch(db);
      for (const prod of PRODUCTS) {
        const docRef = doc(db, 'products', prod.id);
        batch.set(docRef, {
          ...prod,
          rating: 0,
          reviewsCount: 0,
          createdAt: new Date().toISOString()
        });
      }
      await batch.commit();
    }

    const categoriesRef = collection(db, 'categories');
    const categoriesSnap = await getDocs(categoriesRef);

    if (categoriesSnap.empty) {
      const batch = writeBatch(db);
      for (const cat of DEFAULT_CATEGORIES) {
        const docRef = doc(db, 'categories', cat.id);
        batch.set(docRef, cat);
      }
      await batch.commit();
    }

    // Seed banner slides if empty
    const bannerDocRef = doc(db, 'settings', 'banner');
    const bannerSnap = await getDoc(bannerDocRef);
    if (!bannerSnap.exists()) {
      await setDoc(bannerDocRef, {
        slides: DEFAULT_BANNER_SLIDES,
        updatedAt: new Date().toISOString()
      });
    }

    // Seed announcements if empty
    const annDocRef = doc(db, 'settings', 'announcements');
    const annSnap = await getDoc(annDocRef);
    if (!annSnap.exists()) {
      await setDoc(annDocRef, {
        items: DEFAULT_ANNOUNCEMENTS,
        updatedAt: new Date().toISOString()
      });
    }

    // Seed home page featured products if empty
    const featuredDocRef = doc(db, 'settings', 'featured');
    const featuredSnap = await getDoc(featuredDocRef);
    if (!featuredSnap.exists()) {
      const defaultIds = PRODUCTS.filter((p) => p.featured).map((p) => p.id).slice(0, 4);
      await setDoc(featuredDocRef, {
        productIds: defaultIds.length === 4 ? defaultIds : PRODUCTS.slice(0, 4).map((p) => p.id),
        updatedAt: new Date().toISOString()
      });
    }

    // Mark system as permanently initialized
    await setDoc(systemDocRef, {
      seeded: true,
      initializedAt: new Date().toISOString()
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('aniq_system_initialized_v2', 'true');
    }
  } catch (error) {
    console.error('Initial seeding error:', error);
  }
};

export const subscribeProducts = (onUpdate: (products: Product[]) => void) => {
  const path = 'products';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: Product[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          name: data.name || '',
          category: data.category || '',
          subcategory: data.subcategory || '',
          price: Number(data.price) || 0,
          description: data.description || '',
          details: data.details || '',
          specs: Array.isArray(data.specs) ? data.specs : [],
          image: data.image || '',
          additionalImages: Array.isArray(data.additionalImages) ? data.additionalImages : [],
          inStock: data.inStock !== false,
          featured: Boolean(data.featured),
          rating: Number(data.rating) || 0,
          reviewsCount: Number(data.reviewsCount) || 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

export const subscribeCategories = (onUpdate: (categories: CategoryData[]) => void) => {
  const path = 'categories';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: CategoryData[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          name: data.name || '',
          subcategories: Array.isArray(data.subcategories) ? data.subcategories : []
        });
      });
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

export interface DbResult {
  success: boolean;
  error?: string;
}

export const saveProductToDb = async (product: Product): Promise<DbResult> => {
  const path = `products/${product.id}`;
  try {
    const docRef = doc(db, 'products', product.id);
    await setDoc(
      docRef,
      {
        ...product,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return { success: false, error: String(error) };
  }
};

export const deleteProductFromDb = async (productId: string): Promise<DbResult> => {
  const path = `products/${productId}`;
  try {
    const docRef = doc(db, 'products', productId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return { success: false, error: String(error) };
  }
};

export const saveCategoryToDb = async (category: CategoryData): Promise<DbResult> => {
  const path = `categories/${category.id}`;
  try {
    const docRef = doc(db, 'categories', category.id);
    await setDoc(docRef, category, { merge: true });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return { success: false, error: String(error) };
  }
};

export const deleteCategoryFromDb = async (categoryId: string): Promise<DbResult> => {
  const path = `categories/${categoryId}`;
  try {
    const docRef = doc(db, 'categories', categoryId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return { success: false, error: String(error) };
  }
};

export const subscribeUserProfile = (
  userId: string,
  onUpdate: (profile: UserProfile | null) => void
) => {
  const path = `users/${userId}/profile/main`;
  return onSnapshot(
    doc(db, 'users', userId, 'profile', 'main'),
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as UserProfile);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

export const saveUserProfileToDb = async (
  userId: string,
  profile: Partial<UserProfile>
): Promise<DbResult> => {
  const path = `users/${userId}/profile/main`;
  try {
    const docRef = doc(db, 'users', userId, 'profile', 'main');
    await setDoc(
      docRef,
      {
        ...profile,
        uid: userId,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return { success: false, error: String(error) };
  }
};

export const subscribeUserCart = (
  userId: string,
  onUpdate: (items: { product: Product; quantity: number }[]) => void
) => {
  const path = `users/${userId}/cart`;
  return onSnapshot(
    collection(db, 'users', userId, 'cart'),
    (snapshot) => {
      const items: { product: Product; quantity: number }[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        if (data.product && data.quantity) {
          items.push({
            product: data.product as Product,
            quantity: data.quantity as number
          });
        }
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

export const saveCartItemToDb = async (
  userId: string,
  product: Product,
  quantity: number
): Promise<DbResult> => {
  const path = `users/${userId}/cart/${product.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'cart', product.id);
    await setDoc(docRef, {
      product,
      quantity,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return { success: false, error: String(error) };
  }
};

export const removeCartItemFromDb = async (
  userId: string,
  productId: string
): Promise<DbResult> => {
  const path = `users/${userId}/cart/${productId}`;
  try {
    const docRef = doc(db, 'users', userId, 'cart', productId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return { success: false, error: String(error) };
  }
};

export const clearUserCartInDb = async (userId: string): Promise<DbResult> => {
  const path = `users/${userId}/cart`;
  try {
    const cartRef = collection(db, 'users', userId, 'cart');
    const snap = await getDocs(cartRef);
    const batch = writeBatch(db);
    snap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return { success: false, error: String(error) };
  }
};

export const subscribeUserWishlist = (
  userId: string,
  onUpdate: (productIds: string[]) => void
) => {
  const path = `users/${userId}/wishlist`;
  return onSnapshot(
    collection(db, 'users', userId, 'wishlist'),
    (snapshot) => {
      const ids: string[] = [];
      snapshot.forEach((d) => {
        ids.push(d.id);
      });
      onUpdate(ids);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

export const toggleWishlistItemInDb = async (
  userId: string,
  productId: string,
  shouldAdd: boolean
): Promise<DbResult> => {
  const path = `users/${userId}/wishlist/${productId}`;
  try {
    const docRef = doc(db, 'users', userId, 'wishlist', productId);
    if (shouldAdd) {
      await setDoc(docRef, {
        productId,
        addedAt: new Date().toISOString()
      });
    } else {
      await deleteDoc(docRef);
    }
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return { success: false, error: String(error) };
  }
};

export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === undefined) return null as unknown as T;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore) as unknown as T;
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (value !== undefined) {
      result[key] = sanitizeForFirestore(value);
    }
  }
  return result as T;
}

export const saveGuestOrderId = (orderId: string) => {
  try {
    const existing: string[] = JSON.parse(localStorage.getItem('maison_guest_order_ids') || '[]');
    if (!existing.includes(orderId)) {
      localStorage.setItem('maison_guest_order_ids', JSON.stringify([orderId, ...existing]));
    }
  } catch {
    // storage fallback
  }
};

export const saveUserOrderToDb = async (
  userId: string | undefined,
  order: OrderConfirmation
): Promise<DbResult> => {
  try {
    const sanitizedOrder = sanitizeForFirestore(order) as OrderConfirmation;

    // Always track guest order ID locally
    saveGuestOrderId(sanitizedOrder.orderId);

    // 1. Save to central orders collection for admin
    const adminDocRef = doc(db, 'orders', sanitizedOrder.orderId);
    await setDoc(adminDocRef, sanitizedOrder, { merge: true });

    // Save offline backup
    try {
      const existing: OrderConfirmation[] = JSON.parse(localStorage.getItem('maison_local_orders') || '[]');
      localStorage.setItem(
        'maison_local_orders',
        JSON.stringify([sanitizedOrder, ...existing.filter((o) => o.orderId !== sanitizedOrder.orderId)])
      );
    } catch {
      // storage fallback
    }

    // 2. If signed in, also save to user personal orders subcollection
    if (userId && typeof userId === 'string' && userId.trim() !== '' && userId !== 'undefined' && userId !== 'null') {
      try {
        const userDocRef = doc(db, 'users', userId, 'orders', sanitizedOrder.orderId);
        await setDoc(userDocRef, sanitizedOrder, { merge: true });
      } catch {
        // user subcollection fallback
      }
    }

    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `orders/${order.orderId}`);
    try {
      const sanitizedOrder = sanitizeForFirestore(order) as OrderConfirmation;
      const existing: OrderConfirmation[] = JSON.parse(localStorage.getItem('maison_local_orders') || '[]');
      localStorage.setItem(
        'maison_local_orders',
        JSON.stringify([sanitizedOrder, ...existing.filter((o) => o.orderId !== sanitizedOrder.orderId)])
      );
    } catch {
      // storage fallback
    }
    return { success: false, error: String(error) };
  }
};

export const subscribeUserOrders = (
  userId: string,
  userEmailOrOnUpdate: string | null | undefined | ((orders: OrderConfirmation[]) => void),
  optionalOnUpdate?: (orders: OrderConfirmation[]) => void
) => {
  const userEmail = typeof userEmailOrOnUpdate === 'string' ? userEmailOrOnUpdate : undefined;
  const onUpdate = typeof userEmailOrOnUpdate === 'function' ? userEmailOrOnUpdate : (optionalOnUpdate || (() => {}));

  // Listen to the central orders collection filtered by userId and user email for real-time sync
  const path = 'orders';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const userOrders: OrderConfirmation[] = [];
      const normalizedEmail = userEmail?.trim().toLowerCase();

      snapshot.forEach((d) => {
        const data = d.data();
        const matchesUser = data.userId === userId || d.id === userId;
        const matchesEmail = normalizedEmail && data.email && String(data.email).trim().toLowerCase() === normalizedEmail;

        if (matchesUser || matchesEmail) {
          userOrders.push(sanitizeOrder(d));
        }
      });

      // Also check local storage for newly placed orders
      let localOrders: OrderConfirmation[] = [];
      try {
        localOrders = JSON.parse(localStorage.getItem('maison_local_orders') || '[]');
      } catch {
        // fallback
      }

      // Merge local orders belonging to this user
      localOrders
        .filter(
          (lo) =>
            (lo.userId === userId || (normalizedEmail && lo.email?.trim().toLowerCase() === normalizedEmail)) &&
            !userOrders.some((uo) => uo.orderId === lo.orderId)
        )
        .forEach((lo) => userOrders.push(lo));

      onUpdate(
        userOrders.sort(
          (a, b) => (new Date(b.placedAt || 0).getTime() || 0) - (new Date(a.placedAt || 0).getTime() || 0)
        )
      );
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

export const sanitizeOrder = (d: { id: string; data: () => Record<string, unknown> }): OrderConfirmation => {
  const data = d.data();
  return {
    orderId: d.id,
    customerName: String(data.customerName || ''),
    email: String(data.email || ''),
    phone: String(data.phone || ''),
    street: String(data.street || ''),
    city: String(data.city || ''),
    country: String(data.country || 'Bangladesh'),
    shippingAddress: String(data.shippingAddress || ''),
    items: Array.isArray(data.items)
      ? data.items.map((i: CartItem) => ({
          quantity: Number(i.quantity) || 1,
          product: i.product || { id: 'unknown', name: 'Product', price: 0, image: '', category: '' }
        }))
      : [],
    subtotal: Number(data.subtotal) || 0,
    shipping: Number(data.shipping) || 0,
    total: Number(data.total) || 0,
    status: (data.status as OrderConfirmation['status']) || 'Processing',
    paymentMethod: 'Cash on Delivery',
    userId: data.userId ? String(data.userId) : undefined,
    isGuest: Boolean(data.isGuest),
    customerType: (data.customerType as OrderConfirmation['customerType']) || (data.userId ? 'Registered Account' : 'Guest Checkout'),
    placedAt: String(data.placedAt || new Date().toISOString())
  };
};

export const subscribeGuestOrders = (
  onUpdate: (orders: OrderConfirmation[]) => void
) => {
  const path = 'orders';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const allLiveOrders: OrderConfirmation[] = [];
      snapshot.forEach((d) => {
        allLiveOrders.push(sanitizeOrder(d));
      });

      let guestIds: string[] = [];
      try {
        guestIds = JSON.parse(localStorage.getItem('maison_guest_order_ids') || '[]');
      } catch {
        // fallback
      }

      let localOrders: OrderConfirmation[] = [];
      try {
        localOrders = JSON.parse(localStorage.getItem('maison_local_orders') || '[]');
      } catch {
        // fallback
      }

      // Filter live Firestore orders for guest order IDs or guest local orders
      const guestOrders = allLiveOrders.filter((o) =>
        guestIds.includes(o.orderId) || localOrders.some((lo) => lo.orderId === o.orderId)
      );

      // If any local order is not in Firestore snapshot yet, include it
      localOrders.forEach((lo) => {
        if (!guestOrders.some((go) => go.orderId === lo.orderId)) {
          guestOrders.push(lo);
        }
      });

      onUpdate(
        guestOrders.sort(
          (a, b) => (new Date(b.placedAt || 0).getTime() || 0) - (new Date(a.placedAt || 0).getTime() || 0)
        )
      );
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      try {
        const local: OrderConfirmation[] = JSON.parse(localStorage.getItem('maison_local_orders') || '[]');
        onUpdate(local);
      } catch {
        onUpdate([]);
      }
    }
  );
};

export const subscribeAllOrders = (
  onUpdate: (orders: OrderConfirmation[]) => void
) => {
  const path = 'orders';

  // Initial immediate fetch for instant availability
  getDocs(collection(db, path))
    .then((snap) => {
      if (!snap.empty) {
        const orders: OrderConfirmation[] = [];
        snap.forEach((d) => {
          orders.push(sanitizeOrder(d));
        });
        onUpdate(
          orders.sort(
            (a, b) => (new Date(b.placedAt || 0).getTime() || 0) - (new Date(a.placedAt || 0).getTime() || 0)
          )
        );
      }
    })
    .catch(() => {
      // fallback
    });

  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const orders: OrderConfirmation[] = [];
      snapshot.forEach((d) => {
        orders.push(sanitizeOrder(d));
      });

      // Pure live Firestore list without re-merging stale local storage
      onUpdate(
        orders.sort(
          (a, b) => (new Date(b.placedAt || 0).getTime() || 0) - (new Date(a.placedAt || 0).getTime() || 0)
        )
      );
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      try {
        const local: OrderConfirmation[] = JSON.parse(localStorage.getItem('maison_local_orders') || '[]');
        onUpdate(local);
      } catch {
        onUpdate([]);
      }
    }
  );
};

export const updateOrderStatusInDb = async (
  orderId: string,
  status: OrderConfirmation['status'],
  userId?: string
): Promise<DbResult> => {
  try {
    const adminDocRef = doc(db, 'orders', orderId);

    // If userId not provided, inspect existing order doc
    let effectiveUserId = userId;
    if (!effectiveUserId) {
      try {
        const snap = await getDoc(adminDocRef);
        if (snap.exists()) {
          effectiveUserId = snap.data()?.userId;
        }
      } catch {
        // fallback
      }
    }

    // Update central orders document
    await setDoc(adminDocRef, { status }, { merge: true });

    // Update local offline cache as well
    try {
      const local: OrderConfirmation[] = JSON.parse(localStorage.getItem('maison_local_orders') || '[]');
      const updated = local.map((o) => (o.orderId === orderId ? { ...o, status } : o));
      localStorage.setItem('maison_local_orders', JSON.stringify(updated));
    } catch {
      // storage fallback
    }

    // Update user subcollection if registered user ID is present
    if (effectiveUserId && typeof effectiveUserId === 'string' && effectiveUserId.trim() !== '' && effectiveUserId !== 'undefined' && effectiveUserId !== 'null') {
      try {
        const userDocRef = doc(db, 'users', effectiveUserId, 'orders', orderId);
        await setDoc(userDocRef, { status }, { merge: true });
      } catch {
        // user order subdoc might not exist
      }
    }
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `orders/${orderId}`);
    // Still update local state so admin is never blocked
    try {
      const local: OrderConfirmation[] = JSON.parse(localStorage.getItem('maison_local_orders') || '[]');
      const updated = local.map((o) => (o.orderId === orderId ? { ...o, status } : o));
      localStorage.setItem('maison_local_orders', JSON.stringify(updated));
    } catch {
      // storage fallback
    }
    return { success: false, error: String(error) };
  }
};

export const deleteOrderInDb = async (
  orderId: string,
  userId?: string
): Promise<DbResult> => {
  try {
    const adminDocRef = doc(db, 'orders', orderId);
    await deleteDoc(adminDocRef);

    // Also remove from local offline backup
    try {
      const local: OrderConfirmation[] = JSON.parse(localStorage.getItem('maison_local_orders') || '[]');
      localStorage.setItem('maison_local_orders', JSON.stringify(local.filter((o) => o.orderId !== orderId)));
    } catch {
      // storage fallback
    }

    if (userId && typeof userId === 'string' && userId.trim() !== '' && userId !== 'undefined' && userId !== 'null') {
      try {
        const userDocRef = doc(db, 'users', userId, 'orders', orderId);
        await deleteDoc(userDocRef);
      } catch {
        // ignore
      }
    }
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `orders/${orderId}`);
    try {
      const local: OrderConfirmation[] = JSON.parse(localStorage.getItem('maison_local_orders') || '[]');
      localStorage.setItem('maison_local_orders', JSON.stringify(local.filter((o) => o.orderId !== orderId)));
    } catch {
      // storage fallback
    }
    return { success: false, error: String(error) };
  }
};

export const saveProductReviewToDb = async (
  productId: string,
  review: {
    userId: string;
    userName: string;
    rating: number;
    comment: string;
  }
): Promise<DbResult> => {
  const reviewId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = `products/${productId}/reviews/${reviewId}`;
  try {
    const docRef = doc(db, 'products', productId, 'reviews', reviewId);
    const newRev: ProductReview = {
      id: reviewId,
      productId,
      userId: review.userId,
      userName: review.userName,
      rating: review.rating,
      comment: review.comment,
      createdAt: new Date().toISOString()
    };
    await setDoc(docRef, newRev);

    try {
      const allReviewsSnap = await getDocs(collection(db, 'products', productId, 'reviews'));
      let sum = 0;
      let count = 0;
      allReviewsSnap.forEach((r) => {
        sum += Number(r.data().rating) || 5;
        count += 1;
      });
      if (count > 0) {
        const avg = Math.round((sum / count) * 10) / 10;
        const prodRef = doc(db, 'products', productId);
        await updateDoc(prodRef, {
          rating: avg,
          reviewsCount: count
        });
      }
    } catch {
      // aggregation fallback
    }

    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return { success: false, error: String(error) };
  }
};

export const deleteProductReviewFromDb = async (
  productId: string,
  reviewId: string
): Promise<DbResult> => {
  const path = `products/${productId}/reviews/${reviewId}`;
  try {
    const docRef = doc(db, 'products', productId, 'reviews', reviewId);
    await deleteDoc(docRef);

    try {
      const allReviewsSnap = await getDocs(collection(db, 'products', productId, 'reviews'));
      let sum = 0;
      let count = 0;
      allReviewsSnap.forEach((r) => {
        sum += Number(r.data().rating) || 5;
        count += 1;
      });
      const avg = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
      const prodRef = doc(db, 'products', productId);
      await updateDoc(prodRef, {
        rating: avg,
        reviewsCount: count
      });
    } catch {
      // fallback
    }

    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return { success: false, error: String(error) };
  }
};

export const subscribeProductReviews = (
  productId: string,
  onUpdate: (reviews: ProductReview[]) => void
) => {
  const path = `products/${productId}/reviews`;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: ProductReview[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as ProductReview);
      });
      onUpdate(
        list.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

// Banner Ads Configuration
export const subscribeBannerSlides = (onUpdate: (slides: BannerSlide[]) => void) => {
  const path = 'settings/banner';
  return onSnapshot(
    doc(db, 'settings', 'banner'),
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (Array.isArray(data.slides) && data.slides.length > 0) {
          onUpdate(data.slides);
          return;
        }
      }
      onUpdate(DEFAULT_BANNER_SLIDES);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      onUpdate(DEFAULT_BANNER_SLIDES);
    }
  );
};

export const compressImageIfLarge = (dataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/') || dataUrl.length < 175000) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxW = 1366;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        let q = 0.80;
        let res = canvas.toDataURL('image/jpeg', q);
        while (res.length > 175000 && q > 0.40) {
          q -= 0.08;
          res = canvas.toDataURL('image/jpeg', q);
        }
        resolve(res);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

export const saveBannerSlides = async (slides: BannerSlide[]): Promise<DbResult> => {
  const path = 'settings/banner';
  try {
    const docRef = doc(db, 'settings', 'banner');
    const sanitizedSlides = await Promise.all(
      slides.slice(0, 5).map(async (s) => ({
        id: s.id || `slide-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: s.type || 'custom',
        productId: s.productId || '',
        title: s.title || '',
        subtitle: s.subtitle || '',
        image: await compressImageIfLarge(s.image || ''),
        buttonText: s.buttonText || '',
        linkUrl: s.linkUrl || '',
        hideButton: s.hideButton === true || s.buttonText === 'none'
      }))
    );
    await setDoc(
      docRef,
      {
        slides: sanitizedSlides,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return { success: false, error: String(error) };
  }
};

// Running News & Offers Announcements
export const subscribeAnnouncements = (onUpdate: (items: AnnouncementItem[]) => void) => {
  const path = 'settings/announcements';
  return onSnapshot(
    doc(db, 'settings', 'announcements'),
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (Array.isArray(data.items)) {
          onUpdate(data.items);
          return;
        }
      }
      onUpdate(DEFAULT_ANNOUNCEMENTS);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      onUpdate(DEFAULT_ANNOUNCEMENTS);
    }
  );
};

export const saveAnnouncements = async (items: AnnouncementItem[]): Promise<DbResult> => {
  const path = 'settings/announcements';
  try {
    const docRef = doc(db, 'settings', 'announcements');
    const sanitizedItems = items.map((item) => ({
      id: item.id || `ann-${Date.now()}`,
      text: item.text || '',
      linkText: item.linkText || '',
      linkUrl: item.linkUrl || '',
      startDate: item.startDate || '',
      endDate: item.endDate || '',
      active: item.active ?? true,
      createdAt: item.createdAt || new Date().toISOString()
    }));
    await setDoc(docRef, {
      items: sanitizedItems,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return { success: false, error: String(error) };
  }
};

export const subscribeStoreSettings = (onUpdate: (settings: StoreSettings) => void) => {
  const path = 'settings/store';
  return onSnapshot(
    doc(db, 'settings', 'store'),
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as StoreSettings);
      } else {
        onUpdate({});
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      onUpdate({});
    }
  );
};

export const saveStoreSettings = async (settings: Partial<StoreSettings>): Promise<DbResult> => {
  const path = 'settings/store';
  try {
    const docRef = doc(db, 'settings', 'store');
    await setDoc(
      docRef,
      {
        ...settings,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return { success: false, error: String(error) };
  }
};

export const subscribeFeaturedProductIds = (onUpdate: (productIds: string[]) => void) => {
  const path = 'settings/featured';
  return onSnapshot(
    doc(db, 'settings', 'featured'),
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (Array.isArray(data.productIds) && data.productIds.length > 0) {
          onUpdate(data.productIds);
          return;
        }
      }
      onUpdate([]);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      onUpdate([]);
    }
  );
};

export const saveFeaturedProductIds = async (productIds: string[]): Promise<DbResult> => {
  const path = 'settings/featured';
  try {
    const docRef = doc(db, 'settings', 'featured');
    await setDoc(docRef, {
      productIds: productIds.slice(0, 4),
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return { success: false, error: String(error) };
  }
};

export const submitContactMessage = async (
  message: Omit<ContactMessage, 'id' | 'createdAt' | 'read'>
): Promise<DbResult> => {
  const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = `messages/${messageId}`;
  const newMsg: ContactMessage = {
    ...message,
    id: messageId,
    createdAt: new Date().toISOString(),
    read: false
  };

  try {
    const docRef = doc(db, 'messages', messageId);
    await setDoc(docRef, newMsg);

    try {
      const existing: ContactMessage[] = JSON.parse(localStorage.getItem('maison_local_messages') || '[]');
      localStorage.setItem('maison_local_messages', JSON.stringify([newMsg, ...existing]));
    } catch {
      // storage fallback
    }

    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    try {
      const existing: ContactMessage[] = JSON.parse(localStorage.getItem('maison_local_messages') || '[]');
      localStorage.setItem('maison_local_messages', JSON.stringify([newMsg, ...existing]));
    } catch {
      // storage fallback
    }
    return { success: true };
  }
};

export const subscribeContactMessages = (onUpdate: (messages: ContactMessage[]) => void) => {
  const path = 'messages';

  // Initial immediate fetch for cross-browser reliability
  getDocs(collection(db, path))
    .then((snap) => {
      if (!snap.empty) {
        const list: ContactMessage[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as ContactMessage);
        });
        onUpdate(
          list.sort(
            (a, b) => (new Date(b.createdAt || 0).getTime() || 0) - (new Date(a.createdAt || 0).getTime() || 0)
          )
        );
      }
    })
    .catch(() => {
      // fallback
    });

  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: ContactMessage[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as ContactMessage);
      });

      // Pure live Firestore list without re-merging stale local storage
      onUpdate(
        list.sort(
          (a, b) => (new Date(b.createdAt || 0).getTime() || 0) - (new Date(a.createdAt || 0).getTime() || 0)
        )
      );
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      try {
        const local: ContactMessage[] = JSON.parse(localStorage.getItem('maison_local_messages') || '[]');
        onUpdate(local);
      } catch {
        onUpdate([]);
      }
    }
  );
};

export const deleteContactMessage = async (messageId: string): Promise<DbResult> => {
  const path = `messages/${messageId}`;
  try {
    const local: ContactMessage[] = JSON.parse(localStorage.getItem('maison_local_messages') || '[]');
    localStorage.setItem('maison_local_messages', JSON.stringify(local.filter((m) => m.id !== messageId)));
  } catch {
    // storage fallback
  }

  try {
    const docRef = doc(db, 'messages', messageId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return { success: true };
  }
};

export const markContactMessageRead = async (messageId: string, read = true): Promise<DbResult> => {
  const path = `messages/${messageId}`;
  try {
    const local: ContactMessage[] = JSON.parse(localStorage.getItem('maison_local_messages') || '[]');
    localStorage.setItem(
      'maison_local_messages',
      JSON.stringify(local.map((m) => (m.id === messageId ? { ...m, read } : m)))
    );
  } catch {
    // storage fallback
  }

  try {
    const docRef = doc(db, 'messages', messageId);
    await updateDoc(docRef, { read });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return { success: true };
  }
};
