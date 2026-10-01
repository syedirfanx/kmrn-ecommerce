import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, CategoryData, UserProfile, OrderConfirmation, ProductReview } from '../types';
import { PRODUCTS } from '../data/products';

const DEFAULT_CATEGORIES: CategoryData[] = [
  {
    id: 'cat-audio',
    name: 'Audio',
    subcategories: ['Headphones', 'Earphones', 'Speakers']
  },
  {
    id: 'cat-timepieces',
    name: 'Timepieces',
    subcategories: ['Automatic', 'Chronograph', 'Field Watches']
  },
  {
    id: 'cat-kitchen',
    name: 'Kitchen & Dining',
    subcategories: ['Coffee & Tea', 'Ceramics', 'Barware']
  },
  {
    id: 'cat-apparel',
    name: 'Apparel',
    subcategories: ['Overshirts', 'Knitwear', 'Outerwear']
  },
  {
    id: 'cat-leather',
    name: 'Leather Goods',
    subcategories: ['Bags', 'Wallets', 'Accessories']
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
      // Ensure existing products in database reflect true review count (zero if no reviews)
      const batch = writeBatch(db);
      let needsCommit = false;
      for (const pDoc of productsSnap.docs) {
        const data = pDoc.data();
        try {
          const reviewsSnap = await getDocs(collection(db, 'products', pDoc.id, 'reviews'));
          if (reviewsSnap.empty) {
            if (data.rating !== 0 || data.reviewsCount !== 0) {
              batch.update(pDoc.ref, { rating: 0, reviewsCount: 0 });
              needsCommit = true;
            }
          } else {
            let sum = 0;
            reviewsSnap.forEach((r) => {
              sum += Number(r.data().rating) || 5;
            });
            const avg = Math.round((sum / reviewsSnap.size) * 10) / 10;
            if (data.rating !== avg || data.reviewsCount !== reviewsSnap.size) {
              batch.update(pDoc.ref, { rating: avg, reviewsCount: reviewsSnap.size });
              needsCommit = true;
            }
          }
        } catch {
          // fallback if subcollection not yet populated
          if (data.rating !== 0 && (!data.reviewsCount || data.reviewsCount > 0)) {
            batch.update(pDoc.ref, { rating: 0, reviewsCount: 0 });
            needsCommit = true;
          }
        }
      }
      if (needsCommit) {
        await batch.commit();
      }
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
      }
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
  const path = 'products';
  try {
    const docRef = doc(db, path, product.id);
    await setDoc(docRef, {
      ...product,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${product.id}`);
    return { success: false, error: String(error) };
  }
};

export const deleteProductFromDb = async (productId: string): Promise<DbResult> => {
  const path = 'products';
  try {
    const docRef = doc(db, path, productId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${productId}`);
    return { success: false, error: String(error) };
  }
};

export const saveCategoryToDb = async (category: CategoryData): Promise<DbResult> => {
  const path = 'categories';
  try {
    const docRef = doc(db, path, category.id);
    await setDoc(docRef, category, { merge: true });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${category.id}`);
    return { success: false, error: String(error) };
  }
};

export const deleteCategoryFromDb = async (categoryId: string): Promise<DbResult> => {
  const path = 'categories';
  try {
    const docRef = doc(db, path, categoryId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${categoryId}`);
    return { success: false, error: String(error) };
  }
};

export const subscribeUserCart = (
  userId: string,
  onUpdate: (cartItems: { productId: string; quantity: number }[]) => void
) => {
  const path = `users/${userId}/cart`;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: { productId: string; quantity: number }[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        items.push({
          productId: d.id,
          quantity: Number(data.quantity) || 1
        });
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

export const saveCartItemToDb = async (userId: string, productId: string, quantity: number): Promise<void> => {
  if (!auth.currentUser) return;
  const path = `users/${userId}/cart/${productId}`;
  try {
    const docRef = doc(db, 'users', userId, 'cart', productId);
    if (quantity <= 0) {
      await deleteDoc(docRef);
    } else {
      await setDoc(docRef, {
        productId,
        quantity,
        userId,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const removeCartItemFromDb = async (userId: string, productId: string): Promise<void> => {
  if (!auth.currentUser) return;
  const path = `users/${userId}/cart/${productId}`;
  try {
    const docRef = doc(db, 'users', userId, 'cart', productId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const clearUserCartInDb = async (userId: string, productIds: string[]): Promise<void> => {
  if (!auth.currentUser) return;
  try {
    const batch = writeBatch(db);
    for (const pid of productIds) {
      const docRef = doc(db, 'users', userId, 'cart', pid);
      batch.delete(docRef);
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/cart`);
  }
};

// User Profile
export const saveUserProfileToDb = async (userId: string, profile: Partial<UserProfile>): Promise<DbResult> => {
  if (!auth.currentUser) return { success: false, error: 'Not authenticated' };
  const path = `users/${userId}/profile/info`;
  try {
    const docRef = doc(db, 'users', userId, 'profile', 'info');
    await setDoc(docRef, {
      ...profile,
      uid: userId,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return { success: false, error: String(error) };
  }
};

export const subscribeUserProfile = (
  userId: string,
  onUpdate: (profile: UserProfile | null) => void
) => {
  const path = `users/${userId}/profile/info`;
  const docRef = doc(db, 'users', userId, 'profile', 'info');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as UserProfile);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

// Wishlist
export const subscribeUserWishlist = (
  userId: string,
  onUpdate: (productIds: string[]) => void
) => {
  const path = `users/${userId}/wishlist`;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const ids: string[] = [];
      snapshot.forEach((d) => ids.push(d.id));
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
  isCurrentlyWishlisted: boolean
): Promise<void> => {
  if (!auth.currentUser) return;
  const path = `users/${userId}/wishlist/${productId}`;
  try {
    const docRef = doc(db, 'users', userId, 'wishlist', productId);
    if (isCurrentlyWishlisted) {
      await deleteDoc(docRef);
    } else {
      await setDoc(docRef, {
        productId,
        addedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    handleFirestoreError(error, isCurrentlyWishlisted ? OperationType.DELETE : OperationType.WRITE, path);
  }
};

// Orders
export const saveUserOrderToDb = async (userId: string, order: OrderConfirmation): Promise<void> => {
  if (!auth.currentUser) return;
  const path = `users/${userId}/orders/${order.orderId}`;
  try {
    const docRef = doc(db, 'users', userId, 'orders', order.orderId);
    await setDoc(docRef, order);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const subscribeUserOrders = (
  userId: string,
  onUpdate: (orders: OrderConfirmation[]) => void
) => {
  const path = `users/${userId}/orders`;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: OrderConfirmation[] = [];
      snapshot.forEach((d) => list.push(d.data() as OrderConfirmation));
      onUpdate(list.sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()));
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

// Customer Reviews stored in Firestore
export const saveProductReviewToDb = async (
  productId: string,
  review: {
    userId: string;
    userName: string;
    rating: number;
    comment: string;
  }
): Promise<DbResult> => {
  if (!auth.currentUser) return { success: false, error: 'Sign in required to submit a review' };
  const reviewId = `rev-${review.userId}`;
  const path = `products/${productId}/reviews/${reviewId}`;
  try {
    const docRef = doc(db, 'products', productId, 'reviews', reviewId);
    const reviewData: ProductReview = {
      id: reviewId,
      productId,
      userId: review.userId,
      userName: review.userName,
      rating: review.rating,
      comment: review.comment,
      createdAt: new Date().toISOString()
    };
    await setDoc(docRef, reviewData);

    // Automatically recalculate product rating and total review count
    try {
      const allReviewsSnap = await getDocs(collection(db, 'products', productId, 'reviews'));
      let sum = 0;
      let count = 0;
      allReviewsSnap.forEach((d) => {
        const data = d.data();
        sum += Number(data.rating) || 5;
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
      // rating aggregation fallback
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
export const subscribeBannerSettings = (onUpdate: (productIds: string[]) => void) => {
  const path = 'settings/banner';
  return onSnapshot(
    doc(db, 'settings', 'banner'),
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (Array.isArray(data.featuredProductIds)) {
          onUpdate(data.featuredProductIds);
          return;
        }
      }
      onUpdate([]);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

export const saveBannerSettings = async (productIds: string[]): Promise<DbResult> => {
  const path = 'settings/banner';
  try {
    const docRef = doc(db, 'settings', 'banner');
    await setDoc(docRef, {
      featuredProductIds: productIds.slice(0, 3),
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return { success: false, error: String(error) };
  }
};



