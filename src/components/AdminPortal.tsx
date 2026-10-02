import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Package,
  Layers,
  Check,
  LogOut,
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
  Search,
  Eye,
  ShoppingBag,
  Download,
  ChevronDown,
  User,
  Truck,
  Clock,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import {
  Product,
  CategoryData,
  BannerSlide,
  AnnouncementItem,
  ContactMessage,
  OrderConfirmation
} from '../types';
import { formatBDT } from '../utils/format';
import { ADMIN_CREDENTIALS } from '../config/adminAuth';
import { ImageCropperModal } from './ImageCropperModal';
import { Logo } from './Logo';
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
  markContactMessageRead,
  subscribeAllOrders,
  updateOrderStatusInDb,
  deleteOrderInDb
} from '../services/storeService';

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
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'products' | 'featured' | 'categories' | 'banner' | 'announcements' | 'messages' | 'orders'>('products');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Orders State
  const [orders, setOrders] = useState<OrderConfirmation[]>([]);
  const [ordersFilter, setOrdersFilter] = useState<'active' | 'history'>('active');
  const [ordersSearchQuery, setOrdersSearchQuery] = useState('');
  const [isUpdatingOrder, setIsUpdatingOrder] = useState<string | null>(null);

  // Image Cropper State (3:4 portrait aspect ratio for product thumbnail)
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropperTarget, setCropperTarget] = useState<{ type: 'product' | 'banner'; index?: number }>({ type: 'product' });

  // Customer Inquiries / Messages State
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('maison_local_messages') || '[]');
    } catch {
      return [];
    }
  });
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  // 3-Image Product State
  const [productImages, setProductImages] = useState<[string, string, string]>(['', '', '']);

  // Specifications State for Product Form
  const [productSpecs, setProductSpecs] = useState<{ label: string; value: string }[]>([]);

  // Product Form Data
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: categories[0]?.name || "Elegant Women's Wear",
    subcategory: '',
    price: 10000,
    description: '',
    details: '',
    inStock: true
  });

  // Featured Products Picker State (Separate search & select)
  const [localFeaturedIds, setLocalFeaturedIds] = useState<string[]>(() => {
    if (featuredProductIds && featuredProductIds.length > 0) {
      return featuredProductIds;
    }
    return products.filter((p) => p.featured).map((p) => p.id);
  });
  const [featuredSearchQuery, setFeaturedSearchQuery] = useState('');
  const [isSavingFeatured, setIsSavingFeatured] = useState(false);

  // Category Form State (Up to 5 categories, up to 10 subcategories each)
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCatForSub, setSelectedCatForSub] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');

  // Banner Slides State
  const [localBannerSlides, setLocalBannerSlides] = useState<BannerSlide[]>(() => {
    return bannerSlides && bannerSlides.length >= 2 ? bannerSlides : [];
  });
  const [isSavingBanner, setIsSavingBanner] = useState(false);

  // Announcements (News and Offers) State with date/time
  const [localAnnouncements, setLocalAnnouncements] = useState<AnnouncementItem[]>(() => {
    return announcements || [];
  });
  const [newAnnouncementText, setNewAnnouncementText] = useState('');
  const [newAnnouncementLinkText, setNewAnnouncementLinkText] = useState('');
  const [newAnnouncementLinkUrl, setNewAnnouncementLinkUrl] = useState('');
  const [newAnnouncementStartDate, setNewAnnouncementStartDate] = useState('');
  const [newAnnouncementEndDate, setNewAnnouncementEndDate] = useState('');
  const [isSavingAnnouncements, setIsSavingAnnouncements] = useState(false);

  // UI Feedback Notices
  const [statusNotice, setStatusNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    type: 'product' | 'category' | 'banner' | 'announcement' | 'message' | 'order';
    id: string;
    name: string;
    index?: number;
    userId?: string;
  } | null>(null);

  useEffect(() => {
    const unsubMsgs = subscribeContactMessages((liveMsgs) => {
      setContactMessages(liveMsgs);
    });
    const unsubOrders = subscribeAllOrders((liveOrders) => {
      setOrders(liveOrders);
    });
    return () => {
      unsubMsgs();
      unsubOrders();
    };
  }, []);

  useEffect(() => {
    if (featuredProductIds) {
      setLocalFeaturedIds(featuredProductIds);
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

  // Helper to initialize specifications for a category
  const getInitialSpecsForCategory = (catName: string): { label: string; value: string }[] => {
    const lower = catName.toLowerCase();
    if (lower.includes('women') || lower.includes('wear') || lower.includes('dress') || lower.includes('lawn')) {
      return [
        { label: 'Fabric', value: '' },
        { label: 'Colour', value: '' },
        { label: 'Size', value: '' }
      ];
    }
    if (lower.includes('home') || lower.includes('decor') || lower.includes('bed')) {
      return [
        { label: 'Colour', value: '' },
        { label: 'Size', value: '' }
      ];
    }
    return [
      { label: 'Colour', value: '' },
      { label: 'Size', value: '' }
    ];
  };

  // Open New Product Form
  const openNewProductForm = () => {
    setEditingProduct(null);
    setProductImages(['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80', '', '']);
    const defaultCat = categories[0]?.name || "Elegant Women's Wear";
    setFormData({
      id: `prod-${Date.now()}`,
      name: '',
      category: defaultCat,
      subcategory: categories[0]?.subcategories[0] || '',
      price: 10000,
      description: '',
      details: '',
      inStock: true
    });
    setProductSpecs(getInitialSpecsForCategory(defaultCat));
    setIsProductFormOpen(true);
  };

  // Open Edit Product Form
  const openEditProductForm = (product: Product) => {
    setEditingProduct(product);
    const img1 = product.image || '';
    const img2 = product.additionalImages?.[0] || '';
    const img3 = product.additionalImages?.[1] || '';
    setProductImages([img1, img2, img3]);
    setFormData({ ...product });

    // Populate specs without hidden items like "Origin"
    const cleanedSpecs = (product.specs || [])
      .filter((s) => s.label.toLowerCase() !== 'origin')
      .map((s) => ({ label: s.label, value: s.value }));

    if (cleanedSpecs.length > 0) {
      setProductSpecs(cleanedSpecs.slice(0, 10));
    } else {
      setProductSpecs(getInitialSpecsForCategory(product.category));
    }

    setIsProductFormOpen(true);
  };

  // Crop Complete
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

  // Specification Actions
  const handleAddSpecification = () => {
    if (productSpecs.length >= 10) {
      setErrorMessage('Maximum 10 specifications allowed.');
      return;
    }
    setProductSpecs([...productSpecs, { label: '', value: '' }]);
  };

  const handleUpdateSpec = (index: number, field: 'label' | 'value', value: string) => {
    setProductSpecs((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  };

  const handleRemoveSpec = (index: number) => {
    setProductSpecs(productSpecs.filter((_, i) => i !== index));
  };

  // Save Product to Firebase
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!productImages[0].trim()) {
      setErrorMessage('Primary image (Image 1) is mandatory.');
      return;
    }

    const additionalImgs = [productImages[1], productImages[2]].filter((img) => img.trim().length > 0);

    // Filter out blank specs
    const validSpecs = productSpecs
      .filter((s) => s.label.trim().length > 0 && s.value.trim().length > 0)
      .slice(0, 10);

    const isFeatured = localFeaturedIds.includes(formData.id || '');

    const productToSave: Product = {
      ...(formData as Product),
      id: formData.id || `prod-${Date.now()}`,
      name: formData.name || 'Untitled Product',
      category: formData.category || (categories[0]?.name || "Elegant Women's Wear"),
      price: Number(formData.price) || 1000,
      description: formData.description || '',
      details: formData.details || formData.description || '',
      image: productImages[0],
      additionalImages: additionalImgs,
      inStock: formData.inStock ?? true,
      featured: isFeatured,
      specs: validSpecs,
      rating: formData.rating || 0,
      reviewsCount: formData.reviewsCount || 0,
      updatedAt: new Date().toISOString()
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

  const executeDeleteProduct = async (productId: string) => {
    setErrorMessage('');
    onProductDeletedLocally(productId);

    // If it was in featured, remove it
    if (localFeaturedIds.includes(productId)) {
      const nextFeatured = localFeaturedIds.filter((id) => id !== productId);
      setLocalFeaturedIds(nextFeatured);
      onFeaturedProductIdsChange?.(nextFeatured);
      await saveFeaturedProductIds(nextFeatured);
    }

    const res = await deleteProductFromDb(productId);
    if (res.success) {
      setStatusNotice('Product deleted from live database');
      setTimeout(() => setStatusNotice(''), 3000);
    } else if (res.error) {
      setErrorMessage(res.error);
    }
  };

  // Featured Search & Select Actions
  const handleAddProductToFeatured = async (product: Product) => {
    if (localFeaturedIds.includes(product.id)) return;
    if (localFeaturedIds.length >= 4) {
      setErrorMessage('Maximum 4 featured products allowed on homepage.');
      return;
    }
    const updated = [...localFeaturedIds, product.id];
    setLocalFeaturedIds(updated);
    onFeaturedProductIdsChange?.(updated);

    setIsSavingFeatured(true);
    const res = await saveFeaturedProductIds(updated);
    setIsSavingFeatured(false);

    if (res.success) {
      // Sync product record featured flag
      const updatedProduct = { ...product, featured: true };
      onProductSavedLocally(updatedProduct);
      saveProductToDb(updatedProduct).catch(() => {});
      setStatusNotice(`"${product.name}" added to homepage featured collection`);
      setTimeout(() => setStatusNotice(''), 3000);
    } else {
      setErrorMessage(res.error || 'Failed to save featured products');
    }
  };

  const handleRemoveProductFromFeatured = async (productId: string) => {
    const updated = localFeaturedIds.filter((id) => id !== productId);
    setLocalFeaturedIds(updated);
    onFeaturedProductIdsChange?.(updated);

    setIsSavingFeatured(true);
    const res = await saveFeaturedProductIds(updated);
    setIsSavingFeatured(false);

    if (res.success) {
      const prod = products.find((p) => p.id === productId);
      if (prod) {
        const updatedProduct = { ...prod, featured: false };
        onProductSavedLocally(updatedProduct);
        saveProductToDb(updatedProduct).catch(() => {});
      }
      setStatusNotice('Product removed from homepage featured collection');
      setTimeout(() => setStatusNotice(''), 3000);
    } else {
      setErrorMessage(res.error || 'Failed to update featured products');
    }
  };

  // Category Actions (Up to 5 categories, up to 10 subcategories)
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const name = newCategoryName.trim();
    if (!name) return;

    if (categories.length >= 5) {
      setErrorMessage('Maximum of 5 categories allowed in store navigation.');
      return;
    }

    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setErrorMessage('A category with this name already exists.');
      return;
    }

    const newCat: CategoryData = {
      id: `cat-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
      name,
      subcategories: []
    };

    onCategorySavedLocally(newCat);
    setNewCategoryName('');

    const res = await saveCategoryToDb(newCat);
    if (res.success) {
      setStatusNotice('Category added to navigation and database');
      setTimeout(() => setStatusNotice(''), 3000);
    } else if (res.error) {
      setErrorMessage(res.error);
    }
  };

  const executeDeleteCategory = async (id: string) => {
    setErrorMessage('');
    onCategoryDeletedLocally(id);
    const res = await deleteCategoryFromDb(id);
    if (res.success) {
      setStatusNotice('Category removed from live database');
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

    if (cat.subcategories.length >= 10) {
      setErrorMessage('Maximum 10 subcategories allowed for this category.');
      return;
    }

    if (cat.subcategories.includes(sub)) {
      setErrorMessage('Subcategory already exists.');
      return;
    }

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
      setStatusNotice('Subcategory removed from live database');
      setTimeout(() => setStatusNotice(''), 3000);
    } else if (res.error) {
      setErrorMessage(res.error);
    }
  };

  // Banner Actions
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
      buttonText: 'Explore',
      linkUrl: '#home'
    };
    setLocalBannerSlides([...localBannerSlides, newSlide]);
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
      setStatusNotice('Banner ads saved to live database');
      onBannerSlidesChange?.(localBannerSlides);
      setTimeout(() => setStatusNotice(''), 3500);
    } else {
      setErrorMessage(res.error || 'Failed to save banner');
    }
  };

  // Announcements (News & Offers) Actions
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
    setNewAnnouncementLinkText('');
    setNewAnnouncementLinkUrl('');
    setNewAnnouncementStartDate('');
    setNewAnnouncementEndDate('');

    setIsSavingAnnouncements(true);
    const res = await saveAnnouncements(updated);
    setIsSavingAnnouncements(false);
    if (res.success) {
      setStatusNotice('News and offer published to database');
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

  const executeDeleteAnnouncement = async (id: string) => {
    const updated = localAnnouncements.filter((item) => item.id !== id);
    setLocalAnnouncements(updated);
    const res = await saveAnnouncements(updated);
    if (res.success) {
      setStatusNotice('Announcement removed from database');
      onAnnouncementsChange?.(updated);
      setTimeout(() => setStatusNotice(''), 3000);
    }
  };

  // Contact Message Actions
  const handleOpenMessage = async (msg: ContactMessage) => {
    setSelectedMessage(msg);
    if (!msg.read) {
      await markContactMessageRead(msg.id, true);
      setContactMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, read: true } : m))
      );
    }
  };

  const executeDeleteMessage = async (messageId: string) => {
    const res = await deleteContactMessage(messageId);
    if (res.success) {
      setContactMessages((prev) => prev.filter((m) => m.id !== messageId));
      if (selectedMessage?.id === messageId) setSelectedMessage(null);
      setStatusNotice('Message deleted from database');
      setTimeout(() => setStatusNotice(''), 3000);
    } else {
      setErrorMessage(res.error || 'Failed to delete message');
    }
  };

  // Order Actions & Status Updates
  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: OrderConfirmation['status'],
    userId?: string
  ) => {
    setIsUpdatingOrder(orderId);
    const res = await updateOrderStatusInDb(orderId, newStatus, userId);
    setIsUpdatingOrder(null);
    if (res.success) {
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, status: newStatus } : o))
      );
      setStatusNotice(`Order ${orderId} marked as ${newStatus}`);
      setTimeout(() => setStatusNotice(''), 3000);
    } else {
      setErrorMessage(res.error || 'Failed to update order status');
    }
  };

  const executeDeleteOrder = async (orderId: string, userId?: string) => {
    const res = await deleteOrderInDb(orderId, userId);
    if (res.success) {
      setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
      setStatusNotice('Order removed from database');
      setTimeout(() => setStatusNotice(''), 3000);
    } else {
      setErrorMessage(res.error || 'Failed to delete order');
    }
  };

  const handleExportOrdersToExcel = () => {
    const listToExport = ordersFilter === 'history'
      ? orders.filter((o) => o.status === 'Delivered' || o.status === 'Cancelled')
      : orders;

    if (listToExport.length === 0) {
      setErrorMessage('No orders available to export.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    const headers = [
      'Order ID',
      'Date Placed',
      'Customer Name',
      'Phone Number',
      'Email Address',
      'Street Address',
      'City',
      'Country',
      'Purchased Items',
      'Subtotal (BDT)',
      'Shipping (BDT)',
      'Total Amount (BDT)',
      'Payment Method',
      'Status'
    ];

    const rows = listToExport.map((o) => [
      `"${o.orderId}"`,
      `"${new Date(o.placedAt).toLocaleDateString()}"`,
      `"${(o.customerName || '').replace(/"/g, '""')}"`,
      `"${(o.phone || '').replace(/"/g, '""')}"`,
      `"${(o.email || '').replace(/"/g, '""')}"`,
      `"${(o.street || o.shippingAddress || '').replace(/"/g, '""')}"`,
      `"${(o.city || '').replace(/"/g, '""')}"`,
      `"${(o.country || 'Bangladesh').replace(/"/g, '""')}"`,
      `"${(o.items || []).map((i) => `${i.product.name} (x${i.quantity})`).join('; ').replace(/"/g, '""')}"`,
      o.subtotal || o.total,
      o.shipping || 0,
      o.total,
      `"${o.paymentMethod || 'Cash on Delivery'}"`,
      `"${o.status}"`
    ]);

    // Prepend UTF-8 BOM so Microsoft Excel opens cleanly
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ANIQ_Orders_${ordersFilter === 'history' ? 'History' : 'All'}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatusNotice('Order history exported to Excel format');
    setTimeout(() => setStatusNotice(''), 3000);
  };

  const currentCategoryObj = categories.find((c) => c.name === formData.category);
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.category.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const featuredPool = products.filter((p) =>
    !localFeaturedIds.includes(p.id) &&
    (p.name.toLowerCase().includes(featuredSearchQuery.toLowerCase()) ||
     p.category.toLowerCase().includes(featuredSearchQuery.toLowerCase()))
  );

  const currentFeaturedProducts = localFeaturedIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined);

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex flex-col items-start leading-none">
            <Logo size="sm" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 mt-1">Admin</span>
          </div>

          <div className="flex items-center gap-3">
            {isAdminLoggedIn && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold cursor-pointer transition-colors"
                >
                  <User className="h-3.5 w-3.5 text-neutral-600" />
                  <span>{ADMIN_CREDENTIALS.username}</span>
                  <ChevronDown className="h-3 w-3 text-neutral-500" />
                </button>

                {isAdminMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsAdminMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-stone-200 py-1.5 z-50">
                      <div className="px-4 py-2 border-b border-stone-100">
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Signed in</p>
                        <p className="text-xs font-bold text-neutral-900">{ADMIN_CREDENTIALS.username}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAdminMenuOpen(false);
                          handleAdminLogout();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer transition-colors text-left"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
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
          /* Dashboard */
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col">
            {/* Tabs (Store logo section removed per instruction 4) */}
            <div className="px-6 pt-5 flex gap-4 sm:gap-6 bg-neutral-50 overflow-x-auto scrollbar-none border-b border-stone-200">
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
                onClick={() => setActiveTab('featured')}
                className={`pb-3.5 px-1 font-heading font-bold text-sm sm:text-base transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === 'featured'
                    ? 'text-neutral-900 font-extrabold border-b-2 border-neutral-900'
                    : 'text-neutral-400 hover:text-neutral-700'
                }`}
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Featured Homepage ({localFeaturedIds.length})</span>
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
                <span>Categories ({categories.length}/5)</span>
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

              <button
                onClick={() => setActiveTab('orders')}
                className={`pb-3.5 px-1 font-heading font-bold text-sm sm:text-base transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === 'orders'
                    ? 'text-neutral-900 font-extrabold border-b-2 border-neutral-900'
                    : 'text-neutral-400 hover:text-neutral-700'
                }`}
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Orders ({orders.length})</span>
                {orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled').length > 0 && (
                  <span className="text-[10px] bg-neutral-900 text-white font-bold px-1.5 py-0.5 rounded-full tabular-nums">
                    {orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled').length}
                  </span>
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

                  {/* Products Table (Without quick feature star, per instruction 8) */}
                  <div className="overflow-x-auto rounded-2xl border border-stone-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-stone-50 text-xs uppercase text-stone-500 font-semibold border-b border-stone-200">
                        <tr>
                          <th className="py-3 px-4">Image</th>
                          <th className="py-3 px-4">Product Name</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Price</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {filteredProducts.map((p) => (
                          <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                            <td className="py-3 px-4">
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-12 h-16 object-cover rounded-lg bg-stone-100 shrink-0"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-semibold text-neutral-900">{p.name}</p>
                              {p.subcategory && (
                                <span className="text-[11px] text-stone-400">{p.subcategory}</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-stone-600 font-medium">
                              {p.category}
                            </td>
                            <td className="py-3 px-4 font-semibold text-neutral-900 tabular-nums">
                              {formatBDT(p.price)}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  p.inStock
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {p.inStock ? 'In Stock' : 'Out of Stock'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditProductForm(p)}
                                  className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 hover:text-neutral-900 transition-colors cursor-pointer"
                                  title="Edit Product"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmModal({ type: 'product', id: p.id, name: p.name })}
                                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                                  title="Delete Product"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add / Edit Product Modal */}
                  {isProductFormOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl my-8">
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
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
                                  if (!editingProduct) {
                                    setProductSpecs(getInitialSpecsForCategory(catName));
                                  }
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

                          {/* 3 Images Upload Control with Vertical Aspect Ratio 3:4 */}
                          <div className="pt-2">
                            <span className="block text-xs font-bold text-neutral-800 mb-2">
                              Product Photos (Vertical 3:4 Shape)
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
                                            className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                                          >
                                            Clear
                                          </button>
                                        )}
                                      </div>

                                      {imgUrl ? (
                                        <div className="aspect-[3/4] rounded-xl overflow-hidden bg-white shadow-xs mb-2">
                                          <img src={imgUrl} alt={`Slot ${slotIdx + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                      ) : (
                                        <div className="aspect-[3/4] rounded-xl bg-neutral-200/50 flex flex-col items-center justify-center text-neutral-400 text-xs mb-2">
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

                          {/* Specifications Editor (Requirements 9) */}
                          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-heading font-bold text-sm text-neutral-900 block">
                                  Specifications ({productSpecs.length}/10)
                                </span>
                                <span className="text-[11px] text-stone-500">
                                  Define key specifications like Fabric, Colour, Size or custom attributes.
                                </span>
                              </div>

                              {productSpecs.length < 10 && (
                                <button
                                  type="button"
                                  onClick={handleAddSpecification}
                                  className="inline-flex items-center gap-1 bg-white hover:bg-stone-100 text-neutral-900 border border-stone-300 text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs cursor-pointer"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  <span>Add Specification</span>
                                </button>
                              )}
                            </div>

                            <div className="space-y-2">
                              {productSpecs.map((spec, sIdx) => (
                                <div key={sIdx} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    placeholder="Label (e.g. Fabric)"
                                    value={spec.label}
                                    onChange={(e) => handleUpdateSpec(sIdx, 'label', e.target.value)}
                                    className="w-1/3 bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-neutral-900 font-semibold focus:outline-none focus:border-neutral-900"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Value (e.g. Pure Chiffon)"
                                    value={spec.value}
                                    onChange={(e) => handleUpdateSpec(sIdx, 'value', e.target.value)}
                                    className="flex-1 bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSpec(sIdx)}
                                    className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg cursor-pointer"
                                    title="Remove specification"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
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
                              Details
                            </label>
                            <textarea
                              rows={3}
                              value={formData.details || ''}
                              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                              className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                            />
                          </div>

                          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
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
                </div>
              )}

              {/* TAB 2: Featured Products (Separate Search & Select, Requirements 7 & 8) */}
              {activeTab === 'featured' && (
                <div className="space-y-6">
                  <div className="bg-stone-50 p-6 rounded-3xl border border-stone-200 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-stone-200">
                      <div>
                        <h3 className="font-heading font-bold text-lg text-neutral-900">
                          Homepage Featured Collection
                        </h3>
                        <p className="text-xs text-stone-500 mt-1">
                          Pick featured items by search and select. If no items are featured, the section is hidden on the homepage.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-white border border-stone-200 px-3 py-1.5 rounded-xl font-bold text-neutral-800 tabular-nums">
                          {currentFeaturedProducts.length} / 4 Selected
                        </span>
                        {isSavingFeatured && (
                          <span className="text-xs text-stone-400 font-medium animate-pulse">
                            Saving...
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Current Featured Items */}
                    <div className="mb-8">
                      <span className="font-heading font-semibold text-xs uppercase tracking-wider text-stone-400 block mb-3">
                        Currently Featured on Homepage
                      </span>

                      {currentFeaturedProducts.length === 0 ? (
                        <div className="p-8 bg-white rounded-2xl border border-dashed border-stone-300 text-center">
                          <p className="text-sm font-semibold text-neutral-700">No featured products selected</p>
                          <p className="text-xs text-stone-400 mt-1">
                            The featured section is currently hidden on the homepage. Search below to add items.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {currentFeaturedProducts.map((prod, idx) => (
                            <div
                              key={prod.id}
                              className="bg-white rounded-2xl p-3 border border-stone-200 shadow-xs flex flex-col justify-between"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                                  Position {idx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProductFromFeatured(prod.id)}
                                  className="text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                                >
                                  Remove
                                </button>
                              </div>

                              <div className="aspect-[3/4] rounded-xl overflow-hidden bg-stone-100 mb-2">
                                <img
                                  src={prod.image}
                                  alt={prod.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              <div>
                                <span className="text-[10px] font-semibold uppercase text-stone-400 block truncate">
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
                          ))}

                          {Array.from({ length: 4 - currentFeaturedProducts.length }).map((_, idx) => (
                            <div
                              key={`empty-slot-${idx}`}
                              className="bg-white/60 rounded-2xl p-4 border border-dashed border-stone-300 flex flex-col items-center justify-center text-center aspect-[3/4]"
                            >
                              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 bg-stone-100 px-2.5 py-1 rounded mb-2">
                                Slot {currentFeaturedProducts.length + idx + 1}
                              </span>
                              <p className="text-xs font-semibold text-stone-500">Available Slot</p>
                              <p className="text-[11px] text-stone-400 mt-1">Search below to add</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Search & Pick Products to Feature */}
                    <div className="pt-4 border-t border-stone-200">
                      <span className="font-heading font-semibold text-xs uppercase tracking-wider text-stone-400 block mb-3">
                        Search and Select Products to Feature
                      </span>

                      <div className="relative mb-4 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                        <input
                          type="text"
                          value={featuredSearchQuery}
                          onChange={(e) => setFeaturedSearchQuery(e.target.value)}
                          placeholder="Search product name or category..."
                          className="w-full bg-white border border-stone-300 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                        />
                      </div>

                      <div className="max-h-72 overflow-y-auto rounded-2xl border border-stone-200 bg-white divide-y divide-stone-100">
                        {featuredPool.length === 0 ? (
                          <p className="p-4 text-xs text-stone-400 text-center">
                            No matching products available to add.
                          </p>
                        ) : (
                          featuredPool.map((prod) => (
                            <div
                              key={prod.id}
                              className="p-3 flex items-center justify-between hover:bg-stone-50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={prod.image}
                                  alt={prod.name}
                                  className="w-10 h-14 object-cover rounded-lg bg-stone-100"
                                />
                                <div>
                                  <p className="font-heading font-bold text-xs text-neutral-900">
                                    {prod.name}
                                  </p>
                                  <span className="text-[11px] text-stone-500">
                                    {prod.category} | {formatBDT(prod.price)}
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleAddProductToFeatured(prod)}
                                disabled={localFeaturedIds.length >= 4}
                                className="bg-neutral-900 hover:bg-neutral-800 disabled:bg-stone-300 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                              >
                                Feature
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Categories & Subcategories (Up to 5 categories, up to 10 subcategories) */}
              {activeTab === 'categories' && (
                <div className="space-y-8">
                  {/* Category Creation Form */}
                  <div className="bg-neutral-50 rounded-3xl p-6 sm:p-8 shadow-xs">
                    <h3 className="font-heading font-bold text-lg text-neutral-900 mb-1">
                      Store Categories ({categories.length}/5)
                    </h3>
                    <p className="text-xs text-neutral-600 mb-5">
                      Add custom categories (up to 5 maximum). Each category automatically generates its own navigation page.
                    </p>

                    <form onSubmit={handleAddCategory} className="flex gap-3 max-w-lg mb-6">
                      <input
                        type="text"
                        placeholder="Category Name..."
                        value={newCategoryName}
                        disabled={categories.length >= 5}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="flex-1 bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs disabled:bg-stone-100"
                      />
                      <button
                        type="submit"
                        disabled={categories.length >= 5}
                        className="bg-neutral-900 hover:bg-neutral-800 disabled:bg-stone-300 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md transition-all whitespace-nowrap"
                      >
                        Add Category
                      </button>
                    </form>

                    {/* Categories List */}
                    <div className="space-y-4">
                      {categories.map((cat) => (
                        <div
                          key={cat.id}
                          className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-heading font-bold text-base text-neutral-900">
                                {cat.name}
                              </h4>
                              <span className="text-xs text-neutral-500">
                                {cat.subcategories.length} / 10 subcategories
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setDeleteConfirmModal({ type: 'category', id: cat.id, name: cat.name })}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Subcategories tags */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
                            {cat.subcategories.length === 0 ? (
                              <span className="text-xs text-neutral-400">No subcategories defined.</span>
                            ) : (
                              cat.subcategories.map((sub, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-100 text-neutral-800 text-xs font-medium"
                                >
                                  <span>{sub}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSubcategory(cat.id, sub)}
                                    className="text-stone-400 hover:text-red-600 cursor-pointer"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add Subcategory Form */}
                  <div className="bg-neutral-50 rounded-3xl p-6 sm:p-8 shadow-xs">
                    <h3 className="font-heading font-bold text-lg text-neutral-900 mb-1">
                      Add Subcategory (Up to 10 each)
                    </h3>
                    <p className="text-xs text-neutral-600 mb-5">
                      Select a category and add subcategories for customers to filter by.
                    </p>

                    <form onSubmit={handleAddSubcategory} className="grid grid-cols-1 sm:grid-cols-12 gap-3 max-w-xl">
                      <div className="sm:col-span-5">
                        <select
                          value={selectedCatForSub}
                          onChange={(e) => setSelectedCatForSub(e.target.value)}
                          className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900"
                        >
                          <option value="">Select Category...</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name} ({cat.subcategories.length}/10)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          placeholder="Subcategory Name..."
                          value={newSubcategoryName}
                          onChange={(e) => setNewSubcategoryName(e.target.value)}
                          className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <button
                          type="submit"
                          disabled={!selectedCatForSub || !newSubcategoryName.trim()}
                          className="w-full bg-neutral-900 hover:bg-neutral-800 disabled:bg-stone-300 text-white font-bold text-xs py-3 px-4 rounded-xl cursor-pointer shadow-md transition-all whitespace-nowrap"
                        >
                          Add Sub
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 4: Banner Ads */}
              {activeTab === 'banner' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                    <div>
                      <h3 className="font-heading font-bold text-lg text-neutral-900">
                        Carousel Banner Slides ({localBannerSlides.length}/5)
                      </h3>
                      <p className="text-xs text-stone-500">
                        Minimum 2 slides, maximum 5 slides for homepage carousel.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddBannerSlide}
                        disabled={localBannerSlides.length >= 5}
                        className="bg-white border border-stone-300 hover:bg-stone-50 disabled:opacity-40 text-neutral-900 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Slide</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveBanner}
                        disabled={isSavingBanner}
                        className="bg-neutral-900 hover:bg-neutral-800 disabled:bg-stone-400 text-white font-bold text-xs px-5 py-2 rounded-xl cursor-pointer shadow-md"
                      >
                        {isSavingBanner ? 'Saving...' : 'Save Banner'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {localBannerSlides.map((slide, idx) => (
                      <div
                        key={slide.id || idx}
                        className="p-5 bg-neutral-50 rounded-2xl border border-stone-200 flex flex-col md:flex-row gap-5 items-start justify-between"
                      >
                        <div className="w-full md:w-56 shrink-0 space-y-2">
                          <span className="text-[10px] font-bold uppercase text-stone-400 block">
                            Slide {idx + 1}
                          </span>
                          <div className="aspect-[16/9] rounded-xl overflow-hidden bg-white shadow-xs">
                            <img src={slide.image} alt="Banner" className="w-full h-full object-cover" />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setCropperTarget({ type: 'banner', index: idx });
                              setIsCropperOpen(true);
                            }}
                            className="w-full bg-white hover:bg-stone-100 text-neutral-900 border border-stone-300 font-bold text-xs py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Upload className="h-3 w-3" />
                            <span>Change Image</span>
                          </button>
                        </div>

                        <div className="flex-1 w-full space-y-3">
                          {/* Select Product to Auto-fill Banner Slide */}
                          <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-xs">
                            <label className="block text-[11px] font-bold text-neutral-800 mb-1">
                              Select Product to Feature (Auto-fills image & details)
                            </label>
                            <select
                              value={slide.productId || ''}
                              onChange={(e) => {
                                const pid = e.target.value;
                                if (!pid) {
                                  handleUpdateBannerSlide(idx, { productId: undefined });
                                  return;
                                }
                                const prod = products.find((p) => p.id === pid);
                                if (prod) {
                                  handleUpdateBannerSlide(idx, {
                                    productId: prod.id,
                                    type: 'product',
                                    image: prod.image,
                                    title: prod.name,
                                    subtitle: prod.description,
                                    buttonText: 'Shop Now',
                                    linkUrl: `#${prod.category}`
                                  });
                                }
                              }}
                              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                            >
                              <option value="">-- Choose a product to auto-fill --</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.category})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-stone-600 mb-1">
                                Headline Title
                              </label>
                              <input
                                type="text"
                                value={slide.title || ''}
                                onChange={(e) => handleUpdateBannerSlide(idx, { title: e.target.value })}
                                className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-stone-600 mb-1">
                                Button Text
                              </label>
                              <input
                                type="text"
                                value={slide.buttonText || ''}
                                onChange={(e) => handleUpdateBannerSlide(idx, { buttonText: e.target.value })}
                                className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-stone-600 mb-1">
                              Subtitle Description
                            </label>
                            <input
                              type="text"
                              value={slide.subtitle || ''}
                              onChange={(e) => handleUpdateBannerSlide(idx, { subtitle: e.target.value })}
                              className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                            />
                          </div>
                        </div>

                        {localBannerSlides.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmModal({ type: 'banner', id: slide.id, name: `Slide ${idx + 1}`, index: idx })}
                            className="p-2 text-stone-400 hover:text-red-600 rounded-lg cursor-pointer"
                            title="Remove slide"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: News & Offers (Announcements with datetime & message, Requirements 4) */}
              {activeTab === 'announcements' && (
                <div className="space-y-8">
                  {/* Create Announcement */}
                  <div className="bg-neutral-50 rounded-3xl p-6 sm:p-8 shadow-xs">
                    <h3 className="font-heading font-bold text-lg text-neutral-900 mb-1">
                      Add News or Special Offer
                    </h3>
                    <p className="text-xs text-neutral-600 mb-5">
                      Set start time, end time, and offer message. Automatically active within schedule and synced to database.
                    </p>

                    <form onSubmit={handleAddAnnouncement} className="space-y-4 max-w-2xl">
                      <div>
                        <label className="block text-xs font-bold text-neutral-800 mb-1">
                          Offer Message / Announcement Text *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Special Offer: 10% off Eid collections with express nationwide shipping"
                          value={newAnnouncementText}
                          onChange={(e) => setNewAnnouncementText(e.target.value)}
                          className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 shadow-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-neutral-800 mb-1">
                            Link Button Text (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Shop Now"
                            value={newAnnouncementLinkText}
                            onChange={(e) => setNewAnnouncementLinkText(e.target.value)}
                            className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 shadow-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-neutral-800 mb-1">
                            Link URL (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. #womens-wear or #home"
                            value={newAnnouncementLinkUrl}
                            onChange={(e) => setNewAnnouncementLinkUrl(e.target.value)}
                            className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 shadow-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-neutral-800 mb-1">
                            Start Date / Time (Optional)
                          </label>
                          <input
                            type="datetime-local"
                            value={newAnnouncementStartDate}
                            onChange={(e) => setNewAnnouncementStartDate(e.target.value)}
                            className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 shadow-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-neutral-800 mb-1">
                            End Date / Time (Optional)
                          </label>
                          <input
                            type="datetime-local"
                            value={newAnnouncementEndDate}
                            onChange={(e) => setNewAnnouncementEndDate(e.target.value)}
                            className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 shadow-xs"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingAnnouncements}
                        className="bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-500 text-white font-bold text-xs px-6 py-3 rounded-xl cursor-pointer shadow-md transition-all"
                      >
                        {isSavingAnnouncements ? 'Publishing...' : 'Publish Announcement'}
                      </button>
                    </form>
                  </div>

                  {/* Existing Announcements */}
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
                                  {item.startDate ? new Date(item.startDate).toLocaleDateString() : 'Immediate'} to{' '}
                                  {item.endDate ? new Date(item.endDate).toLocaleDateString() : 'Ongoing'}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-neutral-900">{item.text}</p>
                            {item.linkText && (
                              <span className="text-xs text-neutral-500">
                                Link: {item.linkText} ({item.linkUrl})
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
                              onClick={() => setDeleteConfirmModal({ type: 'announcement', id: item.id, name: item.text })}
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

              {/* TAB 6: Customer Messages (Requirements 5) */}
              {activeTab === 'messages' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                    <div>
                      <h3 className="font-heading font-bold text-lg text-neutral-900">
                        Customer Inquiries & Messages ({contactMessages.length})
                      </h3>
                      <p className="text-xs text-stone-500">
                        Inquiries submitted from the contact page. Click to open and mark as read.
                      </p>
                    </div>

                    <span className="text-xs bg-stone-100 text-stone-700 font-bold px-3 py-1 rounded-xl">
                      {contactMessages.filter((m) => !m.read).length} Unread
                    </span>
                  </div>

                  {contactMessages.length === 0 ? (
                    <div className="py-12 bg-neutral-50 rounded-2xl text-center">
                      <Mail className="h-10 w-10 text-stone-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-neutral-700">No customer messages yet</p>
                      <p className="text-xs text-stone-400">Inquiries sent from the Contact page appear here.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contactMessages.map((msg) => (
                        <div
                          key={msg.id}
                          onClick={() => handleOpenMessage(msg)}
                          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                            msg.read
                              ? 'bg-white border-stone-200 hover:border-stone-300'
                              : 'bg-stone-50 border-neutral-800 shadow-xs'
                          }`}
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {!msg.read && (
                                <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                              )}
                              <span className="font-heading font-bold text-sm text-neutral-900">
                                {msg.name}
                              </span>
                              <span className="text-xs text-stone-400">
                                {new Date(msg.createdAt).toLocaleDateString()} at{' '}
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <p className="text-xs font-semibold text-neutral-800 truncate">
                              {msg.subject || 'General Inquiry'}
                            </p>

                            <p className="text-xs text-stone-600 line-clamp-1">
                              {msg.message}
                            </p>

                            <div className="flex gap-3 text-[11px] text-stone-400 pt-1">
                              {msg.email && <span>Email: {msg.email}</span>}
                              {msg.phone && <span>Phone: {msg.phone}</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenMessage(msg);
                              }}
                              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-neutral-800 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmModal({ type: 'message', id: msg.id, name: `Message from ${msg.name}` });
                              }}
                              className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg cursor-pointer"
                              title="Delete message"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selected Message Detail Modal */}
                  {selectedMessage && (
                    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                          <div>
                            <h3 className="font-heading font-extrabold text-lg text-neutral-900">
                              {selectedMessage.subject || 'Customer Inquiry'}
                            </h3>
                            <span className="text-xs text-stone-400">
                              Received {new Date(selectedMessage.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedMessage(null)}
                            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-2 text-xs text-stone-700 bg-stone-50 p-4 rounded-xl">
                          <p>
                            <strong className="text-neutral-900 font-bold">From:</strong> {selectedMessage.name}
                          </p>
                          {selectedMessage.email && (
                            <p>
                              <strong className="text-neutral-900 font-bold">Email:</strong>{' '}
                              <a href={`mailto:${selectedMessage.email}`} className="text-blue-600 underline">
                                {selectedMessage.email}
                              </a>
                            </p>
                          )}
                          {selectedMessage.phone && (
                            <p>
                              <strong className="text-neutral-900 font-bold">Phone / WhatsApp:</strong>{' '}
                              <a href={`https://wa.me/${selectedMessage.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline font-semibold">
                                {selectedMessage.phone}
                              </a>
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                            Message
                          </label>
                          <div className="p-4 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">
                            {selectedMessage.message}
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmModal({ type: 'message', id: selectedMessage.id, name: `Message from ${selectedMessage.name}` })}
                            className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs rounded-xl cursor-pointer"
                          >
                            Delete Message
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedMessage(null)}
                            className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: Orders Management (Requirements 14) */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  {/* Orders Header & Navigation */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
                    <div>
                      <h3 className="font-heading font-bold text-lg text-neutral-900">
                        Customer Orders ({orders.length})
                      </h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Manage active orders, update delivery status, and export history to Excel format.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="inline-flex p-1 rounded-xl bg-neutral-100 border border-stone-200 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setOrdersFilter('active')}
                          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                            ordersFilter === 'active'
                              ? 'bg-neutral-900 text-white shadow-xs'
                              : 'text-neutral-600 hover:text-neutral-900'
                          }`}
                        >
                          Active ({orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled').length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrdersFilter('history')}
                          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                            ordersFilter === 'history'
                              ? 'bg-neutral-900 text-white shadow-xs'
                              : 'text-neutral-600 hover:text-neutral-900'
                          }`}
                        >
                          History ({orders.filter((o) => o.status === 'Delivered' || o.status === 'Cancelled').length})
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleExportOrdersToExcel}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
                        title="Download CSV formatted for Microsoft Excel"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        <span>Export to Excel</span>
                      </button>
                    </div>
                  </div>

                  {/* Search Orders */}
                  <div className="relative max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <input
                      type="text"
                      value={ordersSearchQuery}
                      onChange={(e) => setOrdersSearchQuery(e.target.value)}
                      placeholder="Search by Order ID, customer, phone, or city..."
                      className="w-full bg-white border border-stone-300 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 shadow-xs"
                    />
                  </div>

                  {/* Orders List */}
                  {(() => {
                    const activeList = orders.filter(
                      (o) => o.status !== 'Delivered' && o.status !== 'Cancelled'
                    );
                    const historyList = orders.filter(
                      (o) => o.status === 'Delivered' || o.status === 'Cancelled'
                    );
                    const currentList = (ordersFilter === 'active' ? activeList : historyList).filter((o) => {
                      if (!ordersSearchQuery.trim()) return true;
                      const q = ordersSearchQuery.toLowerCase();
                      return (
                        o.orderId.toLowerCase().includes(q) ||
                        (o.customerName || '').toLowerCase().includes(q) ||
                        (o.phone || '').toLowerCase().includes(q) ||
                        (o.email || '').toLowerCase().includes(q) ||
                        (o.city || '').toLowerCase().includes(q)
                      );
                    });

                    if (currentList.length === 0) {
                      return (
                        <div className="py-16 bg-neutral-50 rounded-3xl border border-dashed border-stone-300 text-center px-4">
                          <ShoppingBag className="h-10 w-10 text-stone-300 mx-auto mb-2" />
                          <p className="font-heading font-bold text-base text-neutral-700">
                            {ordersFilter === 'active' ? 'No active orders' : 'No order history'}
                          </p>
                          <p className="text-xs text-neutral-400 mt-1">
                            {ordersFilter === 'active'
                              ? 'New customer orders placed with Cash on Delivery will appear here.'
                              : 'Orders marked as Delivered or Cancelled will move into this history.'}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {currentList.map((order) => {
                          const isProcessing = isUpdatingOrder === order.orderId;

                          return (
                            <div
                              key={order.orderId}
                              className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden"
                            >
                              {/* Order Card Top Bar */}
                              <div className="p-4 sm:p-5 bg-neutral-50/80 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="font-mono font-bold text-sm text-neutral-900 bg-white px-2.5 py-1 rounded-lg border border-stone-200 shadow-xs">
                                    {order.orderId}
                                  </span>
                                  <span className="text-xs text-neutral-500 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(order.placedAt).toLocaleString()}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3">
                                  {/* Status Badge */}
                                  <span
                                    className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                                      order.status === 'Delivered'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : order.status === 'Shipped'
                                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                                        : order.status === 'Confirmed'
                                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                                        : order.status === 'Cancelled'
                                        ? 'bg-red-50 text-red-800 border-red-200'
                                        : 'bg-amber-50 text-amber-800 border-amber-200'
                                    }`}
                                  >
                                    {order.status}
                                  </span>

                                  {ordersFilter === 'history' && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setDeleteConfirmModal({
                                          type: 'order',
                                          id: order.orderId,
                                          name: `Order ${order.orderId}`,
                                          userId: order.userId
                                        })
                                      }
                                      className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg cursor-pointer transition-colors"
                                      title="Delete order record"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Order Card Content */}
                              <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
                                {/* Customer & Shipping Info */}
                                <div className="lg:col-span-4 space-y-2 text-xs border-b lg:border-b-0 lg:border-r border-stone-100 pb-4 lg:pb-0 lg:pr-4">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                                    Customer & Shipping
                                  </span>
                                  <p className="font-heading font-bold text-sm text-neutral-900">
                                    {order.customerName}
                                  </p>
                                  <p className="text-neutral-600">
                                    <strong>Phone:</strong>{' '}
                                    <a
                                      href={`tel:${order.phone}`}
                                      className="text-neutral-900 font-semibold underline"
                                    >
                                      {order.phone}
                                    </a>
                                  </p>
                                  <p className="text-neutral-600">
                                    <strong>Email:</strong> {order.email}
                                  </p>
                                  <div className="pt-1 text-neutral-700 leading-relaxed">
                                    <strong>Address:</strong>
                                    <p className="bg-stone-50 p-2 rounded-lg mt-1 border border-stone-100">
                                      {order.shippingAddress || `${order.street}, ${order.city}, ${order.country}`}
                                    </p>
                                  </div>
                                  <p className="text-[11px] text-stone-500 pt-1">
                                    Payment: <span className="font-bold text-neutral-800">{order.paymentMethod || 'Cash on Delivery'}</span>
                                  </p>
                                </div>

                                {/* Items List */}
                                <div className="lg:col-span-5 space-y-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                                    Items ({order.items.length})
                                  </span>
                                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {order.items.map((it, itIdx) => (
                                      <div
                                        key={itIdx}
                                        className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-100 text-xs"
                                      >
                                        <div className="flex items-center gap-2.5">
                                          <img
                                            src={it.product.image}
                                            alt={it.product.name}
                                            className="w-9 h-11 object-cover rounded-md bg-stone-200 shrink-0"
                                          />
                                          <div className="truncate max-w-[160px] sm:max-w-[220px]">
                                            <p className="font-semibold text-neutral-900 truncate">
                                              {it.product.name}
                                            </p>
                                            <span className="text-[11px] text-stone-500">
                                              Qty: {it.quantity} x {formatBDT(it.product.price)}
                                            </span>
                                          </div>
                                        </div>
                                        <span className="font-bold text-neutral-900 tabular-nums shrink-0">
                                          {formatBDT(it.product.price * it.quantity)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Order Financials & Quick Status Actions */}
                                <div className="lg:col-span-3 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-stone-100 pt-4 lg:pt-0 lg:pl-4">
                                  <div className="space-y-1.5 text-xs">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                                      Financial Summary
                                    </span>
                                    <div className="flex justify-between text-neutral-600">
                                      <span>Subtotal</span>
                                      <span className="tabular-nums">{formatBDT(order.subtotal || order.total)}</span>
                                    </div>
                                    <div className="flex justify-between text-neutral-600">
                                      <span>Shipping</span>
                                      <span>{order.shipping === 0 ? 'Free' : formatBDT(order.shipping || 0)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-neutral-900 text-sm pt-1 border-t border-stone-200">
                                      <span>Total</span>
                                      <span className="font-heading font-extrabold tabular-nums">
                                        {formatBDT(order.total)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Status Selector Dropdown */}
                                  <div className="mt-4 pt-3 border-t border-stone-100 space-y-2">
                                    <label className="block text-[11px] font-bold text-stone-700">
                                      Change Order Status:
                                    </label>
                                    <select
                                      disabled={isProcessing}
                                      value={order.status}
                                      onChange={(e) =>
                                        handleUpdateOrderStatus(
                                          order.orderId,
                                          e.target.value as OrderConfirmation['status'],
                                          order.userId
                                        )
                                      }
                                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-900 shadow-xs cursor-pointer"
                                    >
                                      <option value="Processing">Processing</option>
                                      <option value="Confirmed">Confirmed</option>
                                      <option value="Shipped">Shipped</option>
                                      <option value="Delivered">Delivered (Move to History)</option>
                                      <option value="Cancelled">Cancelled</option>
                                    </select>

                                    {/* Quick Shortcut Buttons for Active Orders */}
                                    {ordersFilter === 'active' && (
                                      <div className="flex gap-1.5 pt-1">
                                        {order.status === 'Processing' && (
                                          <button
                                            type="button"
                                            onClick={() => handleUpdateOrderStatus(order.orderId, 'Confirmed', order.userId)}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] py-1.5 rounded-lg cursor-pointer transition-colors"
                                          >
                                            Confirm
                                          </button>
                                        )}
                                        {(order.status === 'Processing' || order.status === 'Confirmed') && (
                                          <button
                                            type="button"
                                            onClick={() => handleUpdateOrderStatus(order.orderId, 'Shipped', order.userId)}
                                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] py-1.5 rounded-lg cursor-pointer transition-colors"
                                          >
                                            Ship
                                          </button>
                                        )}
                                        {order.status === 'Shipped' && (
                                          <button
                                            type="button"
                                            onClick={() => handleUpdateOrderStatus(order.orderId, 'Delivered', order.userId)}
                                            className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] py-1.5 rounded-lg cursor-pointer transition-colors"
                                          >
                                            Deliver
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Image Cropper Modal (3:4 ratio for products, 16:9 for banner) */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        onCropComplete={handleCropComplete}
        aspectRatio={cropperTarget.type === 'banner' ? 16 / 9 : 3 / 4}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-heading font-extrabold text-xl text-neutral-900">
              Confirm Deletion
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-neutral-900">"{deleteConfirmModal.name}"</span>? This will sync immediately with Firebase.
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
                  } else if (target.type === 'message') {
                    await executeDeleteMessage(target.id);
                  } else if (target.type === 'order') {
                    await executeDeleteOrder(target.id, target.userId);
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
