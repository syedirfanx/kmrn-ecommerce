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
  Catalogue,
  UserProfile,
  UserAddress,
  OrderConfirmation,
  CartItem,
  ProductReview,
  BannerSlide,
  AnnouncementItem,
  StoreSettings,
  ContactMessage,
  PromoCode
} from '../types';
import { PRODUCTS } from '../data/products';

export const DEFAULT_CATALOGUES: Catalogue[] = [
  {
    id: 'catg-lawn',
    name: 'Luxury Lawn',
    description: '100% Original Pakistani designer lawn collection with intricate digital prints and embroidered chiffon dupattas.',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=85',
    category: "Elegant Women's Wear"
  },
  {
    id: 'catg-chiffon',
    name: 'Luxury Chiffon',
    description: 'Festive pure chiffon 3-piece suites adorned with hand-embellished zari, sequins, and crystal threadwork.',
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=85',
    category: "Elegant Women's Wear"
  },
  {
    id: 'catg-festive',
    name: 'Festive Embroidered',
    description: 'Opulent festive and wedding edits featuring organza cutwork, zardozi needlework, and jacquard weaves.',
    image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1200&q=85',
    category: "Elegant Women's Wear"
  },
  {
    id: 'catg-ready',
    name: 'Ready to Wear',
    description: 'Tailored luxury pret kurtas and coordinated festive sets, ready to wear for everyday elegance.',
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=85',
    category: "Elegant Women's Wear"
  },
  {
    id: 'catg-bedsheets',
    name: 'Bedsheets',
    description: '1000 Thread Count Egyptian cotton and sateen luxury bedsheet sets with matching pillowcases.',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=85',
    category: 'Home Decor'
  },
  {
    id: 'catg-comforters',
    name: 'Comforters',
    description: 'Royal velvet quilted winter comforter sets and plush all-season microfiber duvets.',
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1200&q=85',
    category: 'Home Decor'
  },
  {
    id: 'catg-cushions',
    name: 'Cushions',
    description: 'Embroidered silk and velvet cushion covers with geometric motifs and festive embellishments.',
    image: 'https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?auto=format&fit=crop&w=1200&q=85',
    category: 'Home Decor'
  }
];

export const DEFAULT_CATEGORIES: CategoryData[] = [
  {
    id: 'cat-womens-wear',
    name: "Elegant Women's Wear",
    logo: '/images/aniq-1.png',
    order: 0,
    locked: true
  },
  {
    id: 'cat-home-decor',
    name: 'Home Decor',
    logo: '/images/aniq-2.png',
    order: 1,
    locked: true
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
    linkUrl: '/category/home-decor'
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
    linkUrl: '/womens-wear',
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
          catalogueId: data.catalogueId || undefined,
          catalogueName: data.catalogueName || undefined,
          availableColours: Array.isArray(data.availableColours) ? data.availableColours : [],
          availableSizes: Array.isArray(data.availableSizes) ? data.availableSizes : [],
          price: Number(data.price) || 0,
          description: data.description || '',
          details: data.details || '',
          specs: Array.isArray(data.specs) ? data.specs : [],
          image: data.image || '',
          additionalImages: Array.isArray(data.additionalImages) ? data.additionalImages : [],
          inStock: data.inStock !== false,
          archived: Boolean(data.archived),
          featured: Boolean(data.featured),
          order: typeof data.order === 'number' ? data.order : 0,
          rating: Number(data.rating) || 0,
          reviewsCount: Number(data.reviewsCount) || 0,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString()
        });
      });
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

export const subscribeCatalogues = (onUpdate: (catalogues: Catalogue[]) => void) => {
  const path = 'catalogues';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate(DEFAULT_CATALOGUES);
        return;
      }
      const list: Catalogue[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          name: data.name || '',
          description: data.description || '',
          image: data.image || '',
          category: data.category || "Elegant Women's Wear",
          order: typeof data.order === 'number' ? data.order : 0,
          itemCount: Number(data.itemCount) || 0,
          createdAt: data.createdAt || new Date().toISOString()
        });
      });
      list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      onUpdate(DEFAULT_CATALOGUES);
    }
  );
};

export const saveCatalogueToDb = async (catalogue: Catalogue): Promise<DbResult> => {
  const path = `catalogues/${catalogue.id}`;
  try {
    const docRef = doc(db, 'catalogues', catalogue.id);
    const cleanCatalogue = sanitizeForFirestore({
      ...catalogue,
      order: typeof catalogue.order === 'number' ? catalogue.order : 0,
      createdAt: catalogue.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, cleanCatalogue, { merge: true });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return { success: false, error: String(error) };
  }
};

export const deleteCatalogueFromDb = async (catalogueId: string): Promise<DbResult> => {
  const path = `catalogues/${catalogueId}`;
  try {
    const docRef = doc(db, 'catalogues', catalogueId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return { success: false, error: String(error) };
  }
};

export const subscribeCategories = (onUpdate: (categories: CategoryData[]) => void) => {
  const path = 'categories';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate(DEFAULT_CATEGORIES);
        return;
      }
      const list: CategoryData[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          name: data.name || '',
          description: data.description || '',
          logo: data.logo || '',
          heroImage: data.heroImage || '',
          order: typeof data.order === 'number' ? data.order : 0,
          locked: d.id === 'cat-womens-wear' || d.id === 'cat-home-decor' || Boolean(data.locked),
          hideFromHome: Boolean(data.hideFromHome),
          tag: data.tag || '',
          hasCatalogues: data.hasCatalogues !== undefined ? Boolean(data.hasCatalogues) : true
        });
      });
      list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      onUpdate(list);
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
    const cleanedProduct = sanitizeForFirestore({
      id: product.id,
      name: product.name || '',
      category: product.category || "Elegant Women's Wear",
      subcategory: product.subcategory || '',
      catalogueId: product.catalogueId || '',
      catalogueName: product.catalogueName || '',
      availableColours: Array.isArray(product.availableColours) ? product.availableColours : [],
      availableSizes: Array.isArray(product.availableSizes) ? product.availableSizes : [],
      price: Number(product.price) || 0,
      description: product.description || '',
      details: product.details || product.description || '',
      specs: Array.isArray(product.specs) ? product.specs : [],
      image: product.image || '',
      additionalImages: Array.isArray(product.additionalImages) ? product.additionalImages : [],
      inStock: product.inStock !== false,
      archived: Boolean(product.archived),
      featured: Boolean(product.featured),
      order: typeof product.order === 'number' ? product.order : 0,
      rating: Number(product.rating) || 0,
      reviewsCount: Number(product.reviewsCount) || 0,
      createdAt: product.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, cleanedProduct, { merge: true });
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

/**
 * Saves a user address (supports multiple addresses per user).
 * If isDefault or first address, sets it as the default address in their profile.
 */
export const saveUserAddressInDb = async (
  userId: string,
  address: UserAddress
): Promise<DbResult> => {
  const path = `users/${userId}/profile/main`;
  try {
    const docRef = doc(db, 'users', userId, 'profile', 'main');
    const snap = await getDoc(docRef);
    let existingAddresses: UserAddress[] = [];
    if (snap.exists()) {
      existingAddresses = (snap.data()?.addresses as UserAddress[]) || [];
    }

    const index = existingAddresses.findIndex((a) => a.id === address.id);
    const shouldBeDefault = address.isDefault || existingAddresses.length === 0;

    const cleanNewAddress: UserAddress = {
      ...address,
      isDefault: shouldBeDefault,
      createdAt: address.createdAt || new Date().toISOString()
    };

    let updatedAddresses: UserAddress[];
    if (index >= 0) {
      updatedAddresses = existingAddresses.map((a, i) =>
        i === index ? cleanNewAddress : shouldBeDefault ? { ...a, isDefault: false } : a
      );
    } else {
      updatedAddresses = shouldBeDefault
        ? [...existingAddresses.map((a) => ({ ...a, isDefault: false })), cleanNewAddress]
        : [...existingAddresses, cleanNewAddress];
    }

    const defaultAddr = updatedAddresses.find((a) => a.isDefault) || updatedAddresses[0];

    const payload: Partial<UserProfile> = {
      addresses: updatedAddresses,
      defaultAddressId: defaultAddr?.id,
      ...(defaultAddr
        ? {
            street: defaultAddr.street,
            address: defaultAddr.street,
            district: defaultAddr.district,
            subDistrict: defaultAddr.subDistrict,
            deliveryZone: defaultAddr.deliveryZone
          }
        : {})
    };

    await setDoc(docRef, sanitizeForFirestore(payload), { merge: true });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return { success: false, error: String(error) };
  }
};

/**
 * Deletes a saved address from the user's account data.
 */
export const deleteUserAddressInDb = async (
  userId: string,
  addressId: string
): Promise<DbResult> => {
  const path = `users/${userId}/profile/main`;
  try {
    const docRef = doc(db, 'users', userId, 'profile', 'main');
    const snap = await getDoc(docRef);
    if (!snap.exists()) return { success: true };

    const existingAddresses: UserAddress[] = (snap.data()?.addresses as UserAddress[]) || [];
    const filtered = existingAddresses.filter((a) => a.id !== addressId);

    let defaultAddr = filtered.find((a) => a.isDefault);
    if (!defaultAddr && filtered.length > 0) {
      filtered[0].isDefault = true;
      defaultAddr = filtered[0];
    }

    const payload: Partial<UserProfile> = {
      addresses: filtered,
      defaultAddressId: defaultAddr?.id || '',
      ...(defaultAddr
        ? {
            street: defaultAddr.street,
            address: defaultAddr.street,
            district: defaultAddr.district,
            subDistrict: defaultAddr.subDistrict,
            deliveryZone: defaultAddr.deliveryZone
          }
        : {})
    };

    await setDoc(docRef, sanitizeForFirestore(payload), { merge: true });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return { success: false, error: String(error) };
  }
};

/**
 * Sets an address as the default address for the user.
 */
export const setDefaultUserAddressInDb = async (
  userId: string,
  addressId: string
): Promise<DbResult> => {
  const path = `users/${userId}/profile/main`;
  try {
    const docRef = doc(db, 'users', userId, 'profile', 'main');
    const snap = await getDoc(docRef);
    if (!snap.exists()) return { success: false, error: 'User profile not found' };

    const existingAddresses: UserAddress[] = (snap.data()?.addresses as UserAddress[]) || [];
    const updated = existingAddresses.map((a) => ({
      ...a,
      isDefault: a.id === addressId
    }));

    const defaultAddr = updated.find((a) => a.id === addressId);
    if (!defaultAddr) return { success: false, error: 'Address not found' };

    const payload: Partial<UserProfile> = {
      addresses: updated,
      defaultAddressId: addressId,
      street: defaultAddr.street,
      address: defaultAddr.street,
      district: defaultAddr.district,
      subDistrict: defaultAddr.subDistrict,
      deliveryZone: defaultAddr.deliveryZone
    };

    await setDoc(docRef, sanitizeForFirestore(payload), { merge: true });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return { success: false, error: String(error) };
  }
};

export const subscribeUserCart = (
  userId: string,
  onUpdate: (items: CartItem[]) => void
) => {
  const path = `users/${userId}/cart`;
  return onSnapshot(
    collection(db, 'users', userId, 'cart'),
    (snapshot) => {
      const items: CartItem[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        if (data.product && data.quantity) {
          const col = data.selectedColour || data.product?.selectedColour || undefined;
          const sz = data.selectedSize || data.product?.selectedSize || undefined;
          items.push({
            product: {
              ...(data.product as Product),
              selectedColour: col,
              selectedSize: sz
            },
            quantity: Number(data.quantity) || 1,
            selectedColour: col,
            selectedSize: sz
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
  productOrItem: Product | CartItem,
  optionalQuantity?: number
): Promise<DbResult> => {
  const isCartItem = 'product' in productOrItem && Boolean((productOrItem as CartItem).product);
  const rawProduct: Product = isCartItem ? (productOrItem as CartItem).product : (productOrItem as Product);
  const quantity: number = optionalQuantity !== undefined
    ? optionalQuantity
    : (isCartItem ? (productOrItem as CartItem).quantity : 1);

  const selectedColour = isCartItem
    ? ((productOrItem as CartItem).selectedColour || rawProduct.selectedColour || '')
    : (rawProduct.selectedColour || '');
  const selectedSize = isCartItem
    ? ((productOrItem as CartItem).selectedSize || rawProduct.selectedSize || '')
    : (rawProduct.selectedSize || '');

  const safeColour = (selectedColour || 'def').replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase();
  const safeSize = (selectedSize || 'def').replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase();
  const cartKey = `${rawProduct.id}__c_${safeColour}__s_${safeSize}`;
  const path = `users/${userId}/cart/${cartKey}`;

  try {
    const docRef = doc(db, 'users', userId, 'cart', cartKey);
    const cleanProduct: Product = {
      ...rawProduct,
      selectedColour: selectedColour || undefined,
      selectedSize: selectedSize || undefined
    };
    const cleanItem = sanitizeForFirestore({
      product: cleanProduct,
      quantity,
      selectedColour: selectedColour || '',
      selectedSize: selectedSize || '',
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, cleanItem, { merge: true });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return { success: false, error: String(error) };
  }
};

export const removeCartItemFromDb = async (
  userId: string,
  productIdOrKey: string,
  selectedColour?: string,
  selectedSize?: string
): Promise<DbResult> => {
  const safeColour = (selectedColour || 'def').replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase();
  const safeSize = (selectedSize || 'def').replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase();
  const specificKey = `${productIdOrKey}__c_${safeColour}__s_${safeSize}`;
  const legacyKey = `${productIdOrKey}_${(selectedColour || 'def').replace(/[^a-zA-Z0-9]/g, '')}_${(selectedSize || 'def').replace(/[^a-zA-Z0-9]/g, '')}`;

  const path = `users/${userId}/cart/${specificKey}`;
  try {
    // Delete by specific generated keys
    await deleteDoc(doc(db, 'users', userId, 'cart', specificKey)).catch(() => {});
    await deleteDoc(doc(db, 'users', userId, 'cart', legacyKey)).catch(() => {});
    await deleteDoc(doc(db, 'users', userId, 'cart', productIdOrKey)).catch(() => {});

    // Also scan subcollection to clean up any matching documents
    try {
      const snap = await getDocs(collection(db, 'users', userId, 'cart'));
      const batch = writeBatch(db);
      let count = 0;
      snap.forEach((d) => {
        const data = d.data();
        const matchesProduct =
          d.id.startsWith(productIdOrKey) ||
          data.product?.id === productIdOrKey;

        if (matchesProduct) {
          const itemCol = data.selectedColour || data.product?.selectedColour || '';
          const itemSz = data.selectedSize || data.product?.selectedSize || '';
          const matchVariant =
            (selectedColour === undefined || itemCol === (selectedColour || '')) &&
            (selectedSize === undefined || itemSz === (selectedSize || ''));

          if (matchVariant || (!selectedColour && !selectedSize)) {
            batch.delete(d.ref);
            count++;
          }
        }
      });
      if (count > 0) {
        await batch.commit();
      }
    } catch {
      // fallback
    }

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
  if (obj === undefined) return '' as unknown as T;
  if (obj === null) return null as unknown as T;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (value !== undefined) {
      const sanitized = sanitizeForFirestore(value);
      if (sanitized !== undefined) {
        result[key] = sanitized;
      }
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
    district: data.district ? String(data.district) : undefined,
    subDistrict: data.subDistrict ? String(data.subDistrict) : undefined,
    deliveryZone: data.deliveryZone ? String(data.deliveryZone) : undefined,
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
    discountAmount: data.discountAmount !== undefined ? Number(data.discountAmount) : undefined,
    promoCode: data.promoCode ? String(data.promoCode) : undefined,
    total: Number(data.total) || 0,
    status: (data.status as OrderConfirmation['status']) || 'Processing',
    paymentMethod: String(data.paymentMethod || 'Cash on Delivery'),
    bkashNumber: data.bkashNumber ? String(data.bkashNumber) : undefined,
    bkashTrxId: data.bkashTrxId ? String(data.bkashTrxId) : undefined,
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

  const mergeWithLocalAndSync = (liveOrders: OrderConfirmation[]) => {
    let local: OrderConfirmation[] = [];
    try {
      local = JSON.parse(localStorage.getItem('maison_local_orders') || '[]');
    } catch {
      local = [];
    }

    const merged = [...liveOrders];
    local.forEach((lo) => {
      if (!merged.some((o) => o.orderId === lo.orderId)) {
        merged.push(lo);
        // Auto-sync missing local order to central Firestore
        try {
          const docRef = doc(db, 'orders', lo.orderId);
          setDoc(docRef, sanitizeForFirestore(lo), { merge: true }).catch(() => {});
        } catch {
          // silent sync
        }
      }
    });

    return merged.sort(
      (a, b) => (new Date(b.placedAt || 0).getTime() || 0) - (new Date(a.placedAt || 0).getTime() || 0)
    );
  };

  // Initial immediate fetch for instant availability
  getDocs(collection(db, path))
    .then((snap) => {
      if (!snap.empty) {
        const orders: OrderConfirmation[] = [];
        snap.forEach((d) => {
          orders.push(sanitizeOrder(d));
        });
        onUpdate(mergeWithLocalAndSync(orders));
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

      onUpdate(mergeWithLocalAndSync(orders));
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

/**
 * Cancels an order requested by the user.
 * Strictly checks that the order is still in 'Processing' status (before confirmed by admin).
 * Once confirmed, shipped, or delivered, cancellations are blocked.
 */
export const cancelUserOrderInDb = async (
  orderId: string,
  userId?: string
): Promise<DbResult> => {
  try {
    const adminDocRef = doc(db, 'orders', orderId);
    let currentStatus: OrderConfirmation['status'] = 'Processing';

    try {
      const snap = await getDoc(adminDocRef);
      if (snap.exists()) {
        currentStatus = (snap.data()?.status as OrderConfirmation['status']) || 'Processing';
      }
    } catch {
      // fallback to local storage
      const local: OrderConfirmation[] = JSON.parse(localStorage.getItem('maison_local_orders') || '[]');
      const localOrder = local.find((o) => o.orderId === orderId);
      if (localOrder?.status) {
        currentStatus = localOrder.status;
      }
    }

    if (currentStatus !== 'Processing') {
      return {
        success: false,
        error: `This order is already ${currentStatus.toLowerCase()} by the admin and cannot be cancelled.`
      };
    }

    return await updateOrderStatusInDb(orderId, 'Cancelled', userId);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `orders/${orderId}`);
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
    async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.useIndividualDocs) {
          try {
            const count = data.slideCount || 0;
            if (count > 0) {
              const promises: Promise<BannerSlide | null>[] = [];
              for (let i = 0; i < count; i++) {
                promises.push(
                  getDoc(doc(db, 'settings', `banner_slide_${i}`)).then((s) =>
                    s.exists() ? (s.data() as BannerSlide) : null
                  )
                );
              }
              const results = await Promise.all(promises);
              const validSlides = results.filter((s): s is BannerSlide => s !== null);
              if (validSlides.length > 0) {
                onUpdate(validSlides);
                return;
              }
            }
          } catch {
            // fallback to data.slides
          }
        }
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
      slides.slice(0, 15).map(async (s, idx) => {
        const noLink = s.noLinkOverBanner === true;
        return {
          id: s.id || `slide-${idx}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: s.type || 'custom',
          productId: s.productId || '',
          title: s.title || '',
          subtitle: s.subtitle || '',
          image: await compressImageIfLarge(s.image || ''),
          buttonText: s.buttonText || '',
          linkUrl: noLink ? '' : (s.linkUrl || ''),
          hideButton: s.hideButton === true || s.buttonText === 'none',
          noLinkOverBanner: noLink,
          hasLinkOverBanner: !noLink && s.hasLinkOverBanner === true
        };
      })
    );

    // Save each slide to its own individual document in settings/banner_slide_${i}
    // Each document has its own independent 1MB Firestore limit, allowing up to 15MB total!
    const writePromises = sanitizedSlides.map((slide, i) =>
      setDoc(doc(db, 'settings', `banner_slide_${i}`), slide)
    );
    for (let i = sanitizedSlides.length; i < 15; i++) {
      writePromises.push(deleteDoc(doc(db, 'settings', `banner_slide_${i}`)).catch(() => {}));
    }
    await Promise.all(writePromises);

    // If combined JSON is under 750KB, also save full list to settings/banner for single-read caching
    const payload = JSON.stringify(sanitizedSlides);
    if (payload.length < 750000) {
      await setDoc(
        docRef,
        {
          slides: sanitizedSlides,
          slideCount: sanitizedSlides.length,
          useIndividualDocs: false,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    } else {
      // Exceeds single doc threshold: save lightweight manifest pointing to individual docs
      await setDoc(
        docRef,
        {
          slides: sanitizedSlides.map((s) => ({
            ...s,
            image: s.image.startsWith('data:image/') ? '' : s.image
          })),
          slideCount: sanitizedSlides.length,
          useIndividualDocs: true,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    }

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

export const subscribePromoCodes = (onUpdate: (promos: PromoCode[]) => void) => {
  const path = 'promocodes';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: PromoCode[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          code: (data.code || '').toUpperCase().trim(),
          discountType: data.discountType || 'percentage',
          discountValue: Number(data.discountValue) || 0,
          minOrderAmount: Number(data.minOrderAmount) || 0,
          hasMinOrder: data.hasMinOrder === true,
          active: data.active !== false,
          createdAt: data.createdAt || new Date().toISOString()
        });
      });
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

export const savePromoCodeToDb = async (promo: PromoCode): Promise<DbResult> => {
  const path = `promocodes/${promo.id}`;
  try {
    const docRef = doc(db, 'promocodes', promo.id);
    const cleaned = sanitizeForFirestore({
      ...promo,
      code: promo.code.toUpperCase().trim(),
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, cleaned, { merge: true });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return { success: false, error: String(error) };
  }
};

export const deletePromoCodeFromDb = async (promoId: string): Promise<DbResult> => {
  const path = `promocodes/${promoId}`;
  try {
    const docRef = doc(db, 'promocodes', promoId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return { success: false, error: String(error) };
  }
};

