import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Package,
  Layers,
  Check,
  LogOut,
  Shield,
  AlertCircle,
  Upload,
  Lock,
  ArrowLeft,
  Layout,
  Megaphone,
  Calendar,
  X,
  Image as ImageIcon,
  Sparkles,
  Mail,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  Product,
  CategoryData,
  BannerSlide,
  AnnouncementItem,
  StoreSettings,
  ContactMessage
} from '../types';
import { formatBDT } from '../utils/format';
import { ADMIN_CREDENTIALS } from '../config/adminAuth';
import { ImageCropperModal } from './ImageCropperModal';
import {
  saveProductToDb,
  deleteProductFromDb,
  saveCategoryToDb,
  deleteCategoryFromDb,
  saveBannerSlides,
  saveAnnouncements,
  saveFeaturedProductIds,
  subscribeContactMessages,
  deleteContactMessage,
  markContactMessageRead
} from '../services/storeService';
import { Logo } from './Logo';

interface AdminPortalProps {
  onNavigateToStore: () => void;
  products: Product[];
  categories: CategoryData[];
  featuredProductIds?: string[];
  onFeaturedProductIdsChange?: (ids: string[]) => void;
  bannerSlides: BannerSlide[];
  onBannerSlidesChange?: (slides: BannerSlide[]) => void;
  announcements: AnnouncementItem[];
  onAnnouncementsChange?: (items: AnnouncementItem[]) => void;
  storeSettings?: StoreSettings;
  onStoreSettingsChange?: (settings: StoreSettings) => void;
  onProductSavedLocally: (product: Product) => void;
  onProductDeletedLocally: (productId: string) => void;
  onCategorySavedLocally: (category: CategoryData) => void;
  onCategoryDeletedLocally: (categoryId: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  onNavigateToStore,
  products,
  categories,
  featuredProductIds,
  onFeaturedProductIdsChange,
  bannerSlides,
  onBannerSlidesChange,
  announcements,
  onAnnouncementsChange,
  storeSettings,
  onStoreSettingsChange,
  onProductSavedLocally,
  onProductDeletedLocally,
  onCategorySavedLocally,
  onCategoryDeletedLocally
}) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('maison_admin_session') === 'active';
    } catch {
      return false;
    }
  });

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'banner' | 'announcements' | 'messages'>('products');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Image Cropper State
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropperTarget, setCropperTarget] = useState<{ type: 'product' | 'banner'; index?: number }>({ type: 'product' });

  // Customer Inquiries / Messages State
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);

  // 3-Image Product State
  const [productImages, setProductImages] = useState<[string, string, string]>(['', '', '']);

  // Product Form Data
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: categories[0]?.name || 'Audio',
    subcategory: '',
    price: 15000,
    description: '',
    details: '',
    specs: [{ label: 'Origin', value: 'Imported' }],
    inStock: true,
    rating: 0,
    reviewsCount: 0
  });

  // Featured 4 Products for Home Page State
  const [localFeaturedIds, setLocalFeaturedIds] = useState<string[]>(() => {
    if (featuredProductIds && featuredProductIds.length > 0) {
      return featuredProductIds.slice(0, 4);
    }
    const defaultIds = products.filter((p) => p.featured).map((p) => p.id).slice(0, 4);
    if (defaultIds.length > 0) return defaultIds;
    return products.slice(0, 4).map((p) => p.id);
  });
  const [isSlotPickerOpen, setIsSlotPickerOpen] = useState(false);
  const [targetSlotIndex, setTargetSlotIndex] = useState<number>(0);
  const [slotPickerSearch, setSlotPickerSearch] = useState('');
  const [isSavingFeatured, setIsSavingFeatured] = useState(false);

  // Category Form State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCatForSub, setSelectedCatForSub] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');

  // Banner Slides State (2 to 5 slides)
  const [localBannerSlides, setLocalBannerSlides] = useState<BannerSlide[]>(() => {
    return bannerSlides && bannerSlides.length >= 2 ? bannerSlides : [];
  });
  const [isSavingBanner, setIsSavingBanner] = useState(false);

  // Announcements State
  const [localAnnouncements, setLocalAnnouncements] = useState<AnnouncementItem[]>(() => {
    return announcements || [];
  });
  const [newAnnouncementText, setNewAnnouncementText] = useState('');
  const [newAnnouncementLinkText, setNewAnnouncementLinkText] = useState('Shop Now');
  const [newAnnouncementLinkUrl, setNewAnnouncementLinkUrl] = useState('#shop');
  const [newAnnouncementStartDate, setNewAnnouncementStartDate] = useState('');
  const [newAnnouncementEndDate, setNewAnnouncementEndDate] = useState('');
  const [isSavingAnnouncements, setIsSavingAnnouncements] = useState(false);

  // UI Toast State
  const [statusNotice, setStatusNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    type: 'product' | 'category' | 'banner' | 'announcement' | 'message';
    id: string;
    name: string;
    index?: number;
  } | null>(null);

  useEffect(() => {
    const unsub = subscribeContactMessages((liveMsgs) => {
      setContactMessages(liveMsgs);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (featuredProductIds && featuredProductIds.length > 0) {
      setLocalFeaturedIds(featuredProductIds.slice(0, 4));
    }
  }, [featuredProductIds]);

  useEffect(() => {
    if (bannerSlides && bannerSlides.length > 0) {
      setLocalBannerSlides(bannerSlides);
    }
  }, [bannerSlides]);

  useEffect(() => {
    if (announcements) {
      setLocalAnnouncements(announcements);
    }
  }, [announcements]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (
      usernameInput === ADMIN_CREDENTIALS.username &&
      passwordInput === ADMIN_CREDENTIALS.password
    ) {
      setIsAdminLoggedIn(true);
      try {
        localStorage.setItem('maison_admin_session', 'active');
      } catch {
        // storage fallback
      }
    } else {
      setLoginError('Invalid username or password.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    try {
      localStorage.removeItem('maison_admin_session');
    } catch {
      // fallback
    }
  };

  // Product actions
  const openNewProductForm = () => {
    setEditingProduct(null);
    setProductImages(['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80', '', '']);
    setFormData({
      id: `prod-${Date.now()}`,
      name: '',
      category: categories[0]?.name || 'Audio',
      subcategory: categories[0]?.subcategories[0] || '',
      price: 15000,
      description: '',
      details: '',
      specs: [{ label: 'Origin', value: 'Imported' }],
      inStock: true,
      rating: 0,
      reviewsCount: 0
    });
    setIsProductFormOpen(true);
  };

  const openEditProductForm = (product: Product) => {
    setEditingProduct(product);
    const img1 = product.image || '';
    const img2 = product.additionalImages?.[0] || '';
    const img3 = product.additionalImages?.[1] || '';
    setProductImages([img1, img2, img3]);
    setFormData({ ...product });
    setIsProductFormOpen(true);
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    if (cropperTarget.type === 'product' && typeof cropperTarget.index === 'number') {
      const idx = cropperTarget.index;
      setProductImages((prev) => {
        const next: [string, string, string] = [...prev];
        next[idx] = croppedDataUrl;
        return next;
      });
    } else if (cropperTarget.type === 'banner' && typeof cropperTarget.index === 'number') {
      const idx = cropperTarget.index;
      setLocalBannerSlides((prev) => {
        const next = [...prev];
        if (next[idx]) {
          next[idx] = { ...next[idx], image: croppedDataUrl };
        }
        return next;
      });
    }
  };

  const handleToggleMessageRead = async (message: ContactMessage) => {
    const newStatus = !message.read;
    const res = await markContactMessageRead(message.id, newStatus);
    if (res.success) {
      setContactMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, read: newStatus } : m))
      );
    }
  };

  const handleDeleteMessage = (message: ContactMessage) => {
    setDeleteConfirmModal({
      type: 'message',
      id: message.id,
      name: `Message from ${message.name}`
    });
  };

  const executeDeleteMessage = async (messageId: string) => {
    const res = await deleteContactMessage(messageId);
    if (res.success) {
      setContactMessages((prev) => prev.filter((m) => m.id !== messageId));
      setStatusNotice('Message deleted from live database');
      setTimeout(() => setStatusNotice(''), 3000);
    } else {
      setErrorMessage(res.error || 'Failed to delete message');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!productImages[0].trim()) {
      setErrorMessage('Primary image (Image 1) is mandatory.');
      return;
    }

    const additionalImgs = [productImages[1], productImages[2]].filter((img) => img.trim().length > 0);

    const productToSave: Product = {
      ...(formData as Product),
      id: formData.id || `prod-${Date.now()}`,
      name: formData.name || 'Untitled Product',
      category: formData.category || 'Audio',
      price: Number(formData.price) || 1000,
      description: formData.description || '',
      details: formData.details || formData.description || '',
      image: productImages[0],
      additionalImages: additionalImgs,
      inStock: formData.inStock ?? true,
      featured: formData.featured ?? false,
      specs: formData.specs || [{ label: 'Origin', value: 'Imported' }],
      rating: formData.rating || 0,
      reviewsCount: formData.reviewsCount || 0
    };

    onProductSavedLocally(productToSave);
    setIsProductFormOpen(false);

    const res = await saveProductToDb(productToSave);
    if (res.success) {
      setStatusNotice('Product saved to live database');
      setTimeout(() => setStatusNotice(''), 3000);
    } else if (res.error) {
      setErrorMessage(res.error);
    }
  };

  const handleSelectProductForSlot = async (productId: string) => {
    const updated = [...localFeaturedIds];
    const existingIndex = updated.indexOf(productId);
    if (existingIndex !== -1 && existingIndex !== targetSlotIndex) {
      updated.splice(existingIndex, 1);
    }
    updated[targetSlotIndex] = productId;
    const finalIds = updated.filter(Boolean).slice(0, 4);
    setLocalFeaturedIds(finalIds);
    setIsSlotPickerOpen(false);

    setIsSavingFeatured(true);
    const res = await saveFeaturedProductIds(finalIds);
    setIsSavingFeatured(false);
    if (res.success) {
      onFeaturedProductIdsChange?.(finalIds);
      // Synchronize featured boolean on products
      for (const p of products) {
        const shouldBeFeatured = finalIds.includes(p.id);
        if (Boolean(p.featured) !== shouldBeFeatured) {
          const updatedProd = { ...p, featured: shouldBeFeatured };
          onProductSavedLocally(updatedProd);
          saveProductToDb(updatedProd).catch(() => {});
        }
      }
      setStatusNotice('Home page featured products updated');
      setTimeout(() => setStatusNotice(''), 3000);
    } else {
      setErrorMessage(res.error || 'Failed to update featured products');
    }
  };

  const handleClearSlot = async (slotIdx: number) => {
    const updated = [...localFeaturedIds];
    const removedId = updated[slotIdx];
    updated.splice(slotIdx, 1);
    setLocalFeaturedIds(updated);

    const res = await saveFeaturedProductIds(updated);
    if (res.success) {
      onFeaturedProductIdsChange?.(updated);
      if (removedId) {
        const prod = products.find((p) => p.id === removedId);
        if (prod) {
          const updatedProd = { ...prod, featured: false };
          onProductSavedLocally(updatedProd);
          saveProductToDb(updatedProd).catch(() => {});
        }
      }
      setStatusNotice('Featured slot cleared');
      setTimeout(() => setStatusNotice(''), 2500);
    }
  };

  const handleToggleProductFeatured = async (product: Product) => {
    let updatedFeaturedIds = [...localFeaturedIds];
    let newFeaturedStatus = false;

    if (updatedFeaturedIds.includes(product.id)) {
      updatedFeaturedIds = updatedFeaturedIds.filter((id) => id !== product.id);
      newFeaturedStatus = false;
    } else {
      if (updatedFeaturedIds.length >= 4) {
        updatedFeaturedIds[3] = product.id;
      } else {
        updatedFeaturedIds.push(product.id);
      }
      newFeaturedStatus = true;
    }

    setLocalFeaturedIds(updatedFeaturedIds);
    const updatedProduct: Product = { ...product, featured: newFeaturedStatus };
    onProductSavedLocally(updatedProduct);

    const [prodRes, featRes] = await Promise.all([
      saveProductToDb(updatedProduct),
      saveFeaturedProductIds(updatedFeaturedIds)
    ]);

    if (featRes.success && prodRes.success) {
      onFeaturedProductIdsChange?.(updatedFeaturedIds);
      setStatusNotice(
        newFeaturedStatus
          ? `"${product.name}" added to Home Page Featured Collection`
          : `"${product.name}" removed from Home Page Featured Collection`
      );
      setTimeout(() => setStatusNotice(''), 3000);
    } else {
      setErrorMessage(featRes.error || prodRes.error || 'Failed to update featured status');
    }
  };

  const handleDeleteProduct = (product: Product) => {
    setDeleteConfirmModal({ type: 'product', id: product.id, name: product.name });
  };

  const executeDeleteProduct = async (productId: string) => {
    setErrorMessage('');
    onProductDeletedLocally(productId);
    const res = await deleteProductFromDb(productId);
    if (res.success) {
      setStatusNotice('Product deleted from live database');
      setTimeout(() => setStatusNotice(''), 3000);
    } else if (res.error) {
      setErrorMessage(res.error);
    }
  };

  // Category Actions
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const name = newCategoryName.trim();
    if (!name) return;

    const newCat: CategoryData = {
      id: `cat-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name,
      subcategories: []
    };

    onCategorySavedLocally(newCat);
    setNewCategoryName('');

    const res = await saveCategoryToDb(newCat);
    if (res.success) {
      setStatusNotice('Category saved to live database');
      setTimeout(() => setStatusNotice(''), 3000);
    } else if (res.error) {
      setErrorMessage(res.error);
    }
  };

  const handleDeleteCategory = (cat: CategoryData) => {
    setDeleteConfirmModal({ type: 'category', id: cat.id, name: cat.name });
  };

  const executeDeleteCategory = async (id: string) => {
    setErrorMessage('');
    onCategoryDeletedLocally(id);
    const res = await deleteCategoryFromDb(id);
    if (res.success) {
      setStatusNotice('Category deleted from live database');
      setTimeout(() => setStatusNotice(''), 3000);
    } else if (res.error) {
      setErrorMessage(res.error);
    }
  };

  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const sub = newSubcategoryName.trim();
    if (!sub || !selectedCatForSub) return;

    const cat = categories.find((c) => c.id === selectedCatForSub);
    if (!cat) return;
    if (cat.subcategories.includes(sub)) return;

    const updatedCat: CategoryData = {
      ...cat,
      subcategories: [...cat.subcategories, sub]
    };

    onCategorySavedLocally(updatedCat);
    setNewSubcategoryName('');

    const res = await saveCategoryToDb(updatedCat);
    if (res.success) {
      setStatusNotice('Subcategory saved to live database');
      setTimeout(() => setStatusNotice(''), 3000);
    } else if (res.error) {
      setErrorMessage(res.error);
    }
  };

  const handleDeleteSubcategory = async (catId: string, sub: string) => {
    setErrorMessage('');
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;

    const updatedCat: CategoryData = {
      ...cat,
      subcategories: cat.subcategories.filter((s) => s !== sub)
    };

    onCategorySavedLocally(updatedCat);

    const res = await saveCategoryToDb(updatedCat);
    if (res.success) {
      setStatusNotice('Subcategory updated in live database');
      setTimeout(() => setStatusNotice(''), 3000);
    } else if (res.error) {
      setErrorMessage(res.error);
    }
  };

  // Banner Actions (2 to 5 slides)
  const handleAddBannerSlide = () => {
    if (localBannerSlides.length >= 5) {
      setErrorMessage('Maximum 5 banner slides allowed.');
      return;
    }
    const newSlide: BannerSlide = {
      id: `slide-${Date.now()}`,
      type: 'custom',
      title: 'Seasonal Offer',
      subtitle: 'Special promotion across curated items',
      image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1600&q=80',
      buttonText: 'Shop Now',
      linkUrl: '#shop'
    };
    setLocalBannerSlides([...localBannerSlides, newSlide]);
  };

  const handleRemoveBannerSlide = (index: number) => {
    if (localBannerSlides.length <= 2) {
      setErrorMessage('Minimum 2 banner slides are required.');
      return;
    }
    setDeleteConfirmModal({
      type: 'banner',
      id: `banner-${index}`,
      name: `Slide ${index + 1}`,
      index
    });
  };

  const executeRemoveBanner = (index: number) => {
    setLocalBannerSlides(localBannerSlides.filter((_, i) => i !== index));
    setStatusNotice('Banner slide removed');
    setTimeout(() => setStatusNotice(''), 3000);
  };

  const handleUpdateBannerSlide = (index: number, updates: Partial<BannerSlide>) => {
    setLocalBannerSlides((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], ...updates };
        if (updates.type === 'product' && updates.productId) {
          const prod = products.find((p) => p.id === updates.productId);
          if (prod) {
            next[index].image = prod.image;
            next[index].title = prod.name;
            next[index].subtitle = prod.description;
          }
        }
      }
      return next;
    });
  };

  const handleSaveBanner = async () => {
    if (localBannerSlides.length < 2) {
      setErrorMessage('Minimum 2 banner slides required.');
      return;
    }
    setErrorMessage('');
    setIsSavingBanner(true);
    const res = await saveBannerSlides(localBannerSlides);
    setIsSavingBanner(false);
    if (res.success) {
      setStatusNotice('Banner ads configuration saved to live database');
      onBannerSlidesChange?.(localBannerSlides);
      setTimeout(() => setStatusNotice(''), 3500);
    } else {
      setErrorMessage(res.error || 'Failed to save banner');
    }
  };

  // Announcements Actions
  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncementText.trim()) return;
    const newItem: AnnouncementItem = {
      id: `ann-${Date.now()}`,
      text: newAnnouncementText.trim(),
      linkText: newAnnouncementLinkText.trim() || '',
      linkUrl: newAnnouncementLinkUrl.trim() || '',
      startDate: newAnnouncementStartDate || '',
      endDate: newAnnouncementEndDate || '',
      active: true,
      createdAt: new Date().toISOString()
    };

    const updated = [newItem, ...localAnnouncements];
    setLocalAnnouncements(updated);
    setNewAnnouncementText('');
    setNewAnnouncementStartDate('');
    setNewAnnouncementEndDate('');

    setIsSavingAnnouncements(true);
    const res = await saveAnnouncements(updated);
    setIsSavingAnnouncements(false);
    if (res.success) {
      setStatusNotice('Running announcement added and saved to database');
      onAnnouncementsChange?.(updated);
      setTimeout(() => setStatusNotice(''), 3500);
    } else {
      setErrorMessage(res.error || 'Failed to save announcement');
    }
  };

  const handleToggleAnnouncementActive = async (id: string) => {
    const updated = localAnnouncements.map((item) =>
      item.id === id ? { ...item, active: !item.active } : item
    );
    setLocalAnnouncements(updated);
    const res = await saveAnnouncements(updated);
    if (res.success) {
      onAnnouncementsChange?.(updated);
    }
  };

  const handleDeleteAnnouncement = (item: AnnouncementItem) => {
    setDeleteConfirmModal({
      type: 'announcement',
      id: item.id,
      name: item.text.length > 30 ? item.text.substring(0, 30) + '...' : item.text
    });
  };

  const executeDeleteAnnouncement = async (id: string) => {
    const updated = localAnnouncements.filter((item) => item.id !== id);
    setLocalAnnouncements(updated);
    const res = await saveAnnouncements(updated);
    if (res.success) {
      setStatusNotice('Announcement removed');
      onAnnouncementsChange?.(updated);
      setTimeout(() => setStatusNotice(''), 3000);
    }
  };

  const currentCategoryObj = categories.find((c) => c.name === formData.category);
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.category.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="font-heading font-extrabold text-xl text-neutral-900">
              Admin Portal
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {isAdminLoggedIn && (
              <div className="flex items-center gap-2">
                <span className="text-xs bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded-lg font-mono font-bold">
                  {ADMIN_CREDENTIALS.username}
                </span>
                <button
                  onClick={handleAdminLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}

            <button
              onClick={onNavigateToStore}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Store</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {!isAdminLoggedIn ? (
          /* Login Screen */
          <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 shadow-sm flex flex-col items-center">
            <div className="h-14 w-14 rounded-2xl bg-neutral-900 text-white flex items-center justify-center mb-5 shadow-xs">
              <Lock className="h-7 w-7" />
            </div>
            <h2 className="font-heading font-extrabold text-2xl text-neutral-900 mb-6 text-center">
              Owner Sign In
            </h2>

            <form onSubmit={handleAdminLogin} className="w-full space-y-4">
              {loginError && (
                <div className="p-3 bg-red-50 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-neutral-800 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-base text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-800 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-base text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-base py-3 px-4 rounded-xl transition-all shadow-md cursor-pointer mt-2"
              >
                Sign In
              </button>
            </form>
          </div>
        ) : (
          /* Admin Dashboard */
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col">
            {/* Tabs */}
            <div className="px-6 pt-5 flex gap-4 sm:gap-6 bg-neutral-50 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab('products')}
                className={`pb-3.5 px-1 font-heading font-bold text-sm sm:text-base transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === 'products'
                    ? 'text-neutral-900 font-extrabold border-b-2 border-neutral-900'
                    : 'text-neutral-400 hover:text-neutral-700'
                }`}
              >
                <Package className="h-4 w-4" />
                <span>Products ({products.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('categories')}
                className={`pb-3.5 px-1 font-heading font-bold text-sm sm:text-base transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === 'categories'
                    ? 'text-neutral-900 font-extrabold border-b-2 border-neutral-900'
                    : 'text-neutral-400 hover:text-neutral-700'
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>Categories ({categories.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('banner')}
                className={`pb-3.5 px-1 font-heading font-bold text-sm sm:text-base transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === 'banner'
                    ? 'text-neutral-900 font-extrabold border-b-2 border-neutral-900'
                    : 'text-neutral-400 hover:text-neutral-700'
                }`}
              >
                <Layout className="h-4 w-4" />
                <span>Banner Ads ({localBannerSlides.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('announcements')}
                className={`pb-3.5 px-1 font-heading font-bold text-sm sm:text-base transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === 'announcements'
                    ? 'text-neutral-900 font-extrabold border-b-2 border-neutral-900'
                    : 'text-neutral-400 hover:text-neutral-700'
                }`}
              >
                <Megaphone className="h-4 w-4" />
                <span>News & Offers ({localAnnouncements.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('messages')}
                className={`pb-3.5 px-1 font-heading font-bold text-sm sm:text-base transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === 'messages'
                    ? 'text-neutral-900 font-extrabold border-b-2 border-neutral-900'
                    : 'text-neutral-400 hover:text-neutral-700'
                }`}
              >
                <Mail className="h-4 w-4" />
                <span>Messages ({contactMessages.length})</span>
                {contactMessages.filter((m) => !m.read).length > 0 && (
                  <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                )}
              </button>
            </div>

            {/* Notifications */}
            {statusNotice && (
              <div className="mx-6 mt-4 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>{statusNotice}</span>
              </div>
            )}

            {errorMessage && (
              <div className="mx-6 mt-4 p-3 bg-red-50 text-red-800 rounded-xl text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Tab Contents */}
            <div className="p-6">
              {/* TAB 1: Products */}
              {activeTab === 'products' && (
                <div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Filter products..."
                      className="bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 sm:max-w-xs"
                    />

                    <button
                      onClick={openNewProductForm}
                      className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add New Product</span>
                    </button>
                  </div>

                  {/* Add/Edit Product Modal */}
                  {isProductFormOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl my-8">
                        <div className="flex items-center justify-between pb-4 mb-4">
                          <h2 className="font-heading font-extrabold text-xl text-neutral-900">
                            {editingProduct ? 'Edit Product' : 'Add New Product'}
                          </h2>
                          <button
                            onClick={() => setIsProductFormOpen(false)}
                            className="p-2 rounded-full bg-neutral-100 text-neutral-500 hover:text-neutral-900 cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <form onSubmit={handleSaveProduct} className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-neutral-800 mb-1">
                              Product Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.name || ''}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-neutral-800 mb-1">
                                Category *
                              </label>
                              <select
                                value={formData.category || ''}
                                onChange={(e) => {
                                  const catName = e.target.value;
                                  const found = categories.find((c) => c.name === catName);
                                  setFormData({
                                    ...formData,
                                    category: catName,
                                    subcategory: found?.subcategories[0] || ''
                                  });
                                }}
                                className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                              >
                                {categories.map((cat) => (
                                  <option key={cat.id} value={cat.name}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-neutral-800 mb-1">
                                Subcategory
                              </label>
                              <input
                                type="text"
                                list="admin-subcat-list"
                                value={formData.subcategory || ''}
                                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                                className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                              />
                              <datalist id="admin-subcat-list">
                                {currentCategoryObj?.subcategories.map((sub, i) => (
                                  <option key={i} value={sub} />
                                ))}
                              </datalist>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-neutral-800 mb-1">
                                Price (BDT) *
                              </label>
                              <input
                                type="number"
                                required
                                min="1"
                                value={formData.price || ''}
                                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                              />
                            </div>
                          </div>

                          {/* 3 Images Upload Control */}
                          <div className="pt-2">
                            <span className="block text-xs font-bold text-neutral-800 mb-2">
                              Product Photos (Minimum 1 Required, Up to 3)
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {[0, 1, 2].map((slotIdx) => {
                                const isRequired = slotIdx === 0;
                                const imgUrl = productImages[slotIdx];

                                return (
                                  <div key={slotIdx} className="bg-neutral-50 p-3 rounded-2xl flex flex-col justify-between">
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-[11px] font-bold text-neutral-700">
                                          Image {slotIdx + 1} {isRequired ? '(Required)' : '(Optional)'}
                                        </span>
                                        {imgUrl && !isRequired && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setProductImages((prev) => {
                                                const next: [string, string, string] = [...prev];
                                                next[slotIdx] = '';
                                                return next;
                                              });
                                            }}
                                            className="text-xs text-red-500 hover:text-red-700"
                                          >
                                            Clear
                                          </button>
                                        )}
                                      </div>

                                      {imgUrl ? (
                                        <div className="aspect-4/3 rounded-xl overflow-hidden bg-white shadow-xs mb-2">
                                          <img src={imgUrl} alt={`Slot ${slotIdx + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                      ) : (
                                        <div className="aspect-4/3 rounded-xl bg-neutral-200/50 flex flex-col items-center justify-center text-neutral-400 text-xs mb-2">
                                          <ImageIcon className="h-6 w-6 mb-1" />
                                          <span>No photo</span>
                                        </div>
                                      )}
                                    </div>

                                    <div className="space-y-1.5 mt-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCropperTarget({ type: 'product', index: slotIdx });
                                          setIsCropperOpen(true);
                                        }}
                                        className="w-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                      >
                                        <Upload className="h-3.5 w-3.5" />
                                        <span>{imgUrl ? 'Replace Photo' : 'Upload Photo'}</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-neutral-800 mb-1">
                              Short Description
                            </label>
                            <textarea
                              rows={2}
                              required
                              value={formData.description || ''}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-neutral-800 mb-1">
                              Detailed Specifications & Story
                            </label>
                            <textarea
                              rows={3}
                              value={formData.details || ''}
                              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                              className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                            />
                          </div>

                          <div className="pt-2">
                            <label className="flex items-center gap-2.5 cursor-pointer p-3 bg-stone-50 rounded-xl border border-stone-200">
                              <input
                                type="checkbox"
                                checked={formData.featured || false}
                                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                                className="h-4 w-4 rounded border-stone-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                              />
                              <div>
                                <span className="text-xs font-bold text-neutral-900 block">
                                  Feature on Home Page
                                </span>
                                <span className="text-[11px] text-stone-500 block">
                                  Show this product in the 4 featured items section on the homepage
                                </span>
                              </div>
                            </label>
                          </div>

                          <div className="flex items-center justify-end gap-3 pt-4">
                            <button
                              type="button"
                              onClick={() => setIsProductFormOpen(false)}
                              className="px-4 py-2.5 bg-neutral-100 text-neutral-700 font-semibold rounded-xl text-xs hover:bg-neutral-200 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-6 py-2.5 bg-neutral-900 text-white font-bold rounded-xl text-xs hover:bg-neutral-800 cursor-pointer shadow-md"
                            >
                              Save Product
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Home Page Featured Products Controller (4 Items) */}
                  <div className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-xs mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-stone-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-amber-500" />
                          <h3 className="font-heading font-bold text-sm sm:text-base text-neutral-900">
                            Home Page Featured Collection (4 Items)
                          </h3>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Select the exact 4 items displayed on the homepage. Customer can click View All to browse the entire store.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-white border border-stone-200 px-2.5 py-1 rounded-md text-stone-700 font-semibold tabular-nums">
                          {localFeaturedIds.length} / 4 Selected
                        </span>
                        {isSavingFeatured && (
                          <span className="text-xs text-stone-400 font-medium animate-pulse">
                            Saving...
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 4 Featured Slots Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {[0, 1, 2, 3].map((slotIdx) => {
                        const prodId = localFeaturedIds[slotIdx];
                        const prod = prodId ? products.find((p) => p.id === prodId) : null;

                        return (
                          <div
                            key={slotIdx}
                            className={`rounded-xl p-3 border transition-all flex flex-col justify-between ${
                              prod
                                ? 'bg-white border-stone-200 shadow-xs'
                                : 'bg-stone-100/70 border-dashed border-stone-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                                Slot {slotIdx + 1}
                              </span>
                              {prod && (
                                <button
                                  type="button"
                                  onClick={() => handleClearSlot(slotIdx)}
                                  className="text-[11px] text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                                  title="Clear this slot"
                                >
                                  Clear
                                </button>
                              )}
                            </div>

                            {prod ? (
                              <div className="flex gap-2.5 mb-3">
                                <div className="w-14 h-16 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                                  <img
                                    src={prod.image}
                                    alt={prod.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-[9px] font-semibold uppercase text-stone-400 block truncate">
                                    {prod.category}
                                  </span>
                                  <p className="font-heading font-bold text-xs text-neutral-900 truncate">
                                    {prod.name}
                                  </p>
                                  <p className="text-xs font-semibold text-neutral-800 mt-0.5">
                                    {formatBDT(prod.price)}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="py-4 text-center">
                                <p className="text-xs text-stone-400 font-medium">Empty Slot</p>
                                <p className="text-[10px] text-stone-400">Click below to assign</p>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setTargetSlotIndex(slotIdx);
                                setSlotPickerSearch('');
                                setIsSlotPickerOpen(true);
                              }}
                              className={`w-full py-1.5 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors text-center ${
                                prod
                                  ? 'bg-stone-100 hover:bg-stone-200 text-neutral-800'
                                  : 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs'
                              }`}
                            >
                              {prod ? 'Change Product' : `+ Assign Slot ${slotIdx + 1}`}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Slot Picker Modal */}
                  {isSlotPickerOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl my-8">
                        <div className="p-5 border-b border-stone-200 flex items-center justify-between">
                          <div>
                            <h3 className="font-heading font-bold text-lg text-neutral-900">
                              Select Product for Slot {targetSlotIndex + 1}
                            </h3>
                            <p className="text-xs text-stone-500">
                              Choose a product to feature on the home page in this slot.
                            </p>
                          </div>
                          <button
                            onClick={() => setIsSlotPickerOpen(false)}
                            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Search in picker */}
                        <div className="p-4 border-b border-stone-100 bg-stone-50">
                          <input
                            type="text"
                            value={slotPickerSearch}
                            onChange={(e) => setSlotPickerSearch(e.target.value)}
                            placeholder="Search products by name or category..."
                            className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                          />
                        </div>

                        {/* Product list */}
                        <div className="p-4 overflow-y-auto flex-1 space-y-2">
                          {products
                            .filter(
                              (p) =>
                                !slotPickerSearch.trim() ||
                                p.name.toLowerCase().includes(slotPickerSearch.toLowerCase()) ||
                                p.category.toLowerCase().includes(slotPickerSearch.toLowerCase())
                            )
                            .map((p) => {
                              const isCurrentlyAssignedToThisSlot = localFeaturedIds[targetSlotIndex] === p.id;
                              const isAssignedToOtherSlot = localFeaturedIds.includes(p.id) && !isCurrentlyAssignedToThisSlot;

                              return (
                                <div
                                  key={p.id}
                                  onClick={() => handleSelectProductForSlot(p.id)}
                                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                                    isCurrentlyAssignedToThisSlot
                                      ? 'bg-stone-100 border-neutral-900'
                                      : 'bg-white hover:bg-stone-50 border-stone-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-12 h-14 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="text-[10px] font-semibold uppercase text-stone-400 block truncate">
                                        {p.category}
                                      </span>
                                      <p className="font-heading font-bold text-xs sm:text-sm text-neutral-900 truncate">
                                        {p.name}
                                      </p>
                                      <p className="text-xs font-semibold text-neutral-800">
                                        {formatBDT(p.price)}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="shrink-0 flex items-center gap-2">
                                    {isAssignedToOtherSlot && (
                                      <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                                        Slot {localFeaturedIds.indexOf(p.id) + 1}
                                      </span>
                                    )}
                                    <span
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                                        isCurrentlyAssignedToThisSlot
                                          ? 'bg-neutral-900 text-white'
                                          : 'bg-stone-100 hover:bg-neutral-900 hover:text-white text-neutral-800 transition-colors'
                                      }`}
                                    >
                                      {isCurrentlyAssignedToThisSlot ? 'Selected' : 'Select'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>

                        <div className="p-4 border-t border-stone-200 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setIsSlotPickerOpen(false)}
                            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Products Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="bg-neutral-50 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow"
                      >
                        <div className="flex gap-3 mb-3">
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-white shrink-0 shadow-xs">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold uppercase text-neutral-400 block truncate">
                              {product.category}
                            </span>
                            <h3 className="font-heading font-bold text-sm text-neutral-900 truncate">
                              {product.name}
                            </h3>
                            <span className="font-heading font-extrabold text-sm text-neutral-900 block mt-1">
                              {formatBDT(product.price)}
                            </span>
                            <span className="text-[11px] text-neutral-400 block">
                              Rating: {product.rating} ({product.reviewsCount} reviews)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-stone-200/80 mt-1">
                          <button
                            type="button"
                            onClick={() => handleToggleProductFeatured(product)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors border ${
                              localFeaturedIds.includes(product.id)
                                ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                                : 'bg-white text-stone-600 hover:text-neutral-900 border-stone-300'
                            }`}
                            title={localFeaturedIds.includes(product.id) ? 'Remove from Home Page Featured' : 'Select for Home Page Featured'}
                          >
                            <Sparkles className={`h-3 w-3 ${localFeaturedIds.includes(product.id) ? 'text-amber-300' : 'text-stone-400'}`} />
                            <span>{localFeaturedIds.includes(product.id) ? 'Featured on Home' : 'Feature on Home'}</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openEditProductForm(product)}
                              className="p-1.5 rounded-lg bg-white text-neutral-700 hover:bg-neutral-200 text-xs font-semibold cursor-pointer shadow-xs"
                              title="Edit product"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product)}
                              className="p-1.5 rounded-lg bg-white text-red-600 hover:bg-red-50 text-xs font-semibold cursor-pointer shadow-xs"
                              title="Delete product"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: Categories */}
              {activeTab === 'categories' && (
                <div className="space-y-8">
                  {/* Add category */}
                  <div className="bg-neutral-50 rounded-2xl p-6 shadow-xs">
                    <h3 className="font-heading font-bold text-base text-neutral-900 mb-3">
                      Add New Category
                    </h3>
                    <form onSubmit={handleAddCategory} className="flex gap-3 max-w-md">
                      <input
                        type="text"
                        required
                        placeholder="Category Name..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="flex-1 bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                      />
                      <button
                        type="submit"
                        className="bg-neutral-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-neutral-800 cursor-pointer shadow-xs"
                      >
                        Add
                      </button>
                    </form>
                  </div>

                  {/* Add subcategory */}
                  <div className="bg-neutral-50 rounded-2xl p-6 shadow-xs">
                    <h3 className="font-heading font-bold text-base text-neutral-900 mb-3">
                      Add Subcategory to Existing Category
                    </h3>
                    <form onSubmit={handleAddSubcategory} className="flex flex-col sm:flex-row gap-3 max-w-xl">
                      <select
                        value={selectedCatForSub}
                        onChange={(e) => setSelectedCatForSub(e.target.value)}
                        className="bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 sm:w-48"
                      >
                        <option value="">Select Category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Subcategory Name..."
                        value={newSubcategoryName}
                        onChange={(e) => setNewSubcategoryName(e.target.value)}
                        className="flex-1 bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                      />
                      <button
                        type="submit"
                        className="bg-neutral-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-neutral-800 cursor-pointer shadow-xs"
                      >
                        Add
                      </button>
                    </form>
                  </div>

                  {/* List Categories */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {categories.map((cat) => (
                      <div key={cat.id} className="bg-neutral-50 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-heading font-bold text-base text-neutral-900">{cat.name}</h4>
                            <button
                              onClick={() => handleDeleteCategory(cat)}
                              className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer"
                            >
                              Delete Category
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {cat.subcategories.map((sub, idx) => (
                              <span key={idx} className="bg-white px-2.5 py-1 rounded-lg text-xs font-medium text-neutral-800 shadow-xs flex items-center gap-1.5">
                                <span>{sub}</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubcategory(cat.id, sub)}
                                  className="text-neutral-400 hover:text-neutral-900"
                                >
                                  x
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: Banner Ads (2 to 5 slides, product or custom promotional cover) */}
              {activeTab === 'banner' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                    <div>
                      <h2 className="font-heading font-extrabold text-xl text-neutral-900">
                        Cover Banner Advertisements
                      </h2>
                      <p className="text-sm text-neutral-600 mt-1">
                        Configure 2 to 5 slides. Choose catalog products or create custom covers (e.g. Eid Wishes, Festive Offers).
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {localBannerSlides.length < 5 && (
                        <button
                          type="button"
                          onClick={handleAddBannerSlide}
                          className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
                        >
                          + Add Slide
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleSaveBanner}
                        disabled={isSavingBanner}
                        className="bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl cursor-pointer shadow-md"
                      >
                        {isSavingBanner ? 'Saving...' : 'Save Banner Slides'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {localBannerSlides.map((slide, sIdx) => {
                      return (
                        <div key={slide.id || sIdx} className="bg-neutral-50 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-heading font-bold text-sm text-neutral-900">
                                Slide {sIdx + 1}
                              </span>
                              {localBannerSlides.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBannerSlide(sIdx)}
                                  className="text-xs text-red-500 hover:text-red-700"
                                >
                                  Remove
                                </button>
                              )}
                            </div>

                            {/* Type Selector */}
                            <div className="mb-3">
                              <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                                Slide Type:
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateBannerSlide(sIdx, { type: 'product' })}
                                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                                    slide.type === 'product'
                                      ? 'bg-neutral-900 text-white'
                                      : 'bg-white text-neutral-700'
                                  }`}
                                >
                                  Product Link
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateBannerSlide(sIdx, { type: 'custom' })}
                                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                                    slide.type === 'custom'
                                      ? 'bg-neutral-900 text-white'
                                      : 'bg-white text-neutral-700'
                                  }`}
                                >
                                  Custom Cover
                                </button>
                              </div>
                            </div>

                            {slide.type === 'product' ? (
                              <div className="space-y-3 mb-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                                    Select Catalog Product:
                                  </label>
                                  <select
                                    value={slide.productId || ''}
                                    onChange={(e) => handleUpdateBannerSlide(sIdx, { productId: e.target.value })}
                                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                                  >
                                    <option value="" disabled>Choose a product</option>
                                    {products.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name} - {formatBDT(p.price)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2.5 mb-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                                    Custom Title (e.g. Eid Mubarak)
                                  </label>
                                  <input
                                    type="text"
                                    value={slide.title || ''}
                                    onChange={(e) => handleUpdateBannerSlide(sIdx, { title: e.target.value })}
                                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                                    Subtitle / Campaign Note
                                  </label>
                                  <input
                                    type="text"
                                    value={slide.subtitle || ''}
                                    onChange={(e) => handleUpdateBannerSlide(sIdx, { subtitle: e.target.value })}
                                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                                  />
                                </div>

                                <div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCropperTarget({ type: 'banner', index: sIdx });
                                      setIsCropperOpen(true);
                                    }}
                                    className="w-full bg-white hover:bg-neutral-200 text-neutral-900 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                  >
                                    <Upload className="h-3.5 w-3.5" />
                                    <span>Upload Custom Cover Image</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Preview */}
                            <div className="aspect-16/9 rounded-xl overflow-hidden bg-neutral-200 shadow-xs">
                              <img src={slide.image} alt={slide.title || 'Banner'} className="w-full h-full object-cover" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: Running News & Offers Announcements */}
              {activeTab === 'announcements' && (
                <div className="space-y-8">
                  {/* Create announcement */}
                  <div className="bg-neutral-50 rounded-3xl p-6 sm:p-8 shadow-xs">
                    <h3 className="font-heading font-bold text-lg text-neutral-900 mb-2">
                      Add Running News / Top Offer Ticker
                    </h3>
                    <p className="text-xs text-neutral-600 mb-5">
                      This headline appears in the top announcement bar under the navbar. You can set active dates to run seasonal campaigns automatically.
                    </p>

                    <form onSubmit={handleAddAnnouncement} className="space-y-4 max-w-2xl">
                      <div>
                        <label className="block text-xs font-bold text-neutral-800 mb-1">
                          Announcement Headline Text *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Eid Mubarak: Free Nationwide Delivery on All Orders Over 10,000 BDT"
                          value={newAnnouncementText}
                          onChange={(e) => setNewAnnouncementText(e.target.value)}
                          className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-neutral-800 mb-1">
                            Action Link Text (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="Shop Now"
                            value={newAnnouncementLinkText}
                            onChange={(e) => setNewAnnouncementLinkText(e.target.value)}
                            className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-neutral-800 mb-1">
                            Link Destination (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="#shop"
                            value={newAnnouncementLinkUrl}
                            onChange={(e) => setNewAnnouncementLinkUrl(e.target.value)}
                            className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-neutral-800 mb-1">
                            Start Date (Optional)
                          </label>
                          <input
                            type="date"
                            value={newAnnouncementStartDate}
                            onChange={(e) => setNewAnnouncementStartDate(e.target.value)}
                            className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-neutral-800 mb-1">
                            End Date (Optional)
                          </label>
                          <input
                            type="date"
                            value={newAnnouncementEndDate}
                            onChange={(e) => setNewAnnouncementEndDate(e.target.value)}
                            className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingAnnouncements}
                        className="bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-500 text-white font-bold text-xs px-6 py-3 rounded-xl cursor-pointer shadow-md transition-all"
                      >
                        {isSavingAnnouncements ? 'Adding...' : 'Publish Announcement'}
                      </button>
                    </form>
                  </div>

                  {/* List Announcements */}
                  <div className="space-y-3">
                    <h4 className="font-heading font-bold text-base text-neutral-900">
                      Existing Announcements & Offers ({localAnnouncements.length})
                    </h4>

                    {localAnnouncements.length === 0 ? (
                      <p className="text-sm text-neutral-500 py-4">No active announcements configured.</p>
                    ) : (
                      localAnnouncements.map((item) => (
                        <div
                          key={item.id}
                          className="bg-neutral-50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  item.active ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'
                                }`}
                              >
                                {item.active ? 'Active' : 'Disabled'}
                              </span>
                              {(item.startDate || item.endDate) && (
                                <span className="text-[11px] text-neutral-500 flex items-center gap-1 font-mono">
                                  <Calendar className="h-3 w-3" />
                                  {item.startDate || 'Anytime'} to {item.endDate || 'Ongoing'}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-neutral-900">{item.text}</p>
                            {item.linkText && (
                              <span className="text-xs text-neutral-500">
                                Button: {item.linkText} ({item.linkUrl})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleAnnouncementActive(item.id)}
                              className="px-3 py-1.5 bg-white text-xs font-semibold rounded-xl text-neutral-800 hover:bg-neutral-200 shadow-xs cursor-pointer"
                            >
                              {item.active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAnnouncement(item)}
                              className="p-2 bg-white text-red-600 hover:bg-red-50 text-xs rounded-xl shadow-xs cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: Store Logo & Brand Settings */}
              {activeTab === 'branding' && (
                <div className="space-y-8 max-w-2xl">
                  <div className="bg-neutral-50 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                    <div>
                      <h3 className="font-heading font-bold text-lg text-neutral-900 mb-1">
                        ANIQ Store Logo
                      </h3>
                      <p className="text-xs text-neutral-600">
                        Upload your custom ANIQ logo image (PNG, JPG, or SVG). If removed, the store automatically renders clean, elegant ANIQ typography.
                      </p>
                    </div>

                    {/* Live Preview Box */}
                    <div>
                      <span className="block text-xs font-bold text-neutral-700 mb-2">
                        Live Storefront Preview
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Light Preview (Navbar style) */}
                        <div className="p-5 rounded-2xl bg-white shadow-xs flex flex-col items-center justify-center min-h-[90px]">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                            Header Preview (Light)
                          </span>
                          <Logo variant="light" size="md" customLogoUrl={currentLogoUrl} />
                        </div>

                        {/* Dark Preview (Footer style) */}
                        <div className="p-5 rounded-2xl bg-neutral-900 shadow-xs flex flex-col items-center justify-center min-h-[90px]">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                            Footer Preview (Dark)
                          </span>
                          <Logo variant="dark" size="md" customLogoUrl={currentLogoUrl} />
                        </div>
                      </div>
                    </div>

                    {/* Logo Image URL / Upload Controls */}
                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                          Logo Image Source (Upload or Path/URL)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="e.g. /images/logo.png or https://..."
                            value={currentLogoUrl}
                            onChange={(e) => setCurrentLogoUrl(e.target.value)}
                            className="flex-1 bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setCropperTarget({ type: 'logo' });
                              setIsCropperOpen(true);
                            }}
                            className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                          >
                            <Upload className="h-4 w-4" />
                            <span>Upload Image</span>
                          </button>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleSaveStoreLogo}
                          disabled={isSavingLogo}
                          className="bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-500 text-white font-bold text-xs px-6 py-3 rounded-xl cursor-pointer shadow-md transition-all"
                        >
                          {isSavingLogo ? 'Saving...' : 'Save Logo Settings'}
                        </button>

                        {currentLogoUrl && (
                          <button
                            type="button"
                            onClick={handleRemoveStoreLogo}
                            disabled={isSavingLogo}
                            className="bg-white hover:bg-red-50 text-red-600 font-semibold text-xs px-4 py-3 rounded-xl cursor-pointer shadow-xs transition-colors"
                          >
                            Reset to Clean Typography
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Image Cropper Modal */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        onCropComplete={handleCropComplete}
        aspectRatio={cropperTarget.type === 'banner' ? 16 / 9 : cropperTarget.type === 'logo' ? 3 / 1 : 4 / 3}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-heading font-extrabold text-xl text-neutral-900">
              Confirm Deletion
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-neutral-900">"{deleteConfirmModal.name}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(null)}
                className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-bold py-3 px-4 rounded-xl text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = deleteConfirmModal;
                  setDeleteConfirmModal(null);
                  if (target.type === 'product') {
                    await executeDeleteProduct(target.id);
                  } else if (target.type === 'category') {
                    await executeDeleteCategory(target.id);
                  } else if (target.type === 'banner' && typeof target.index === 'number') {
                    executeRemoveBanner(target.index);
                  } else if (target.type === 'announcement') {
                    await executeDeleteAnnouncement(target.id);
                  }
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-md cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
