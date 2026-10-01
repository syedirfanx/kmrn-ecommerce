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
  ProductReview,
  BannerSlide,
  AnnouncementItem,
  StoreSettings
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
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600&q=80',
    title: 'Baroque Luxury Embroidered Chiffon 3-Piece',
    subtitle: '100% Original Pakistani Designer Collection with Hand-Embellished Zari'
  },
  {
    id: 'banner-slide-2',
    type: 'custom',
    title: 'Home Decor & Luxury Bedding',
    subtitle: '1000 TC Egyptian Cotton Bedsheets & Quilted Velvet Comforters',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1600&q=80',
    buttonText: 'Shop Home Decor',
    linkUrl: '#shop'
  },
  {
    id: 'banner-slide-3',
    type: 'product',
    productId: 'prod-hd-2',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80',
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
    } else {
      // Migrate any products that still have the old "ANIQ - " category prefix
      const batch = writeBatch(db);
      let needsProductMigration = false;
      for (const pDoc of productsSnap.docs) {
        const data = pDoc.data();
        let updatedCat = data.category;
        if (data.category === "ANIQ - Elegant Women's Wear") {
          updatedCat = "Elegant Women's Wear";
        } else if (data.category === 'ANIQ - Home Decor') {
          updatedCat = 'Home Decor';
        }
        if (updatedCat !== data.category) {
          needsProductMigration = true;
          batch.update(pDoc.ref, { category: updatedCat });
        }
      }
      if (needsProductMigration) {
        await batch.commit();
      }
    }

    const categoriesRef = collection(db, 'categories');
    const categoriesSnap = await getDocs(categoriesRef);

    // Sync categories to "Elegant Women's Wear" and "Home Decor"
    const existingCatNames = categoriesSnap.docs.map((d) => d.data().name);
    const hasOnlyTargetCategories =
      existingCatNames.length === 2 &&
      existingCatNames.includes("Elegant Women's Wear") &&
      existingCatNames.includes('Home Decor');

    if (!hasOnlyTargetCategories) {
      const batch = writeBatch(db);
      // Remove outdated categories
      for (const catDoc of categoriesSnap.docs) {
        batch.delete(catDoc.ref);
      }
      // Set the 2 official categories
      for (const cat of DEFAULT_CATEGORIES) {
        const docRef = doc(db, 'categories', cat.id);
        batch.set(docRef, cat);
      }
      await batch.commit();
    }

    // Seed banner slides if empty or outdated
    const bannerDocRef = doc(db, 'settings', 'banner');
    const bannerSnap = await getDoc(bannerDocRef);
    if (!bannerSnap.exists() || !bannerSnap.data()?.slides?.some((s: BannerSlide) => s.title?.includes('Baroque') || s.title?.includes('ANIQ'))) {
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
  } catch (error) {
    console.warn('Initial database seed check:', error);
  }
};

export const subscribeProducts = (onUpdate: (products: Product[]) => void) => {
  const path = 'products';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: Product[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Product);
      });
      if (list.length > 0) {
        onUpdate(list);
      }
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
        list.push({ id: d.id, ...d.data() } as CategoryData);
      });
      if (list.length > 0) {
        onUpdate(list);
      } else {
        onUpdate(DEFAULT_CATEGORIES);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      onUpdate(DEFAULT_CATEGORIES);
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

export const saveUserOrderToDb = async (
  userId: string,
  order: OrderConfirmation
): Promise<DbResult> => {
  const path = `users/${userId}/orders/${order.orderId}`;
  try {
    const docRef = doc(db, 'users', userId, 'orders', order.orderId);
    await setDoc(docRef, order);
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return { success: false, error: String(error) };
  }
};

export const subscribeUserOrders = (
  userId: string,
  onUpdate: (orders: OrderConfirmation[]) => void
) => {
  const path = `users/${userId}/orders`;
  return onSnapshot(
    collection(db, 'users', userId, 'orders'),
    (snapshot) => {
      const orders: OrderConfirmation[] = [];
      snapshot.forEach((d) => {
        orders.push(d.data() as OrderConfirmation);
      });
      onUpdate(
        orders.sort(
          (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
        )
      );
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
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

export const saveBannerSlides = async (slides: BannerSlide[]): Promise<DbResult> => {
  const path = 'settings/banner';
  try {
    const docRef = doc(db, 'settings', 'banner');
    const sanitizedSlides = slides.slice(0, 5).map((s) => ({
      id: s.id || `slide-${Date.now()}`,
      type: s.type || 'custom',
      productId: s.productId || '',
      title: s.title || '',
      subtitle: s.subtitle || '',
      image: s.image || '',
      buttonText: s.buttonText || '',
      linkUrl: s.linkUrl || ''
    }));
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
