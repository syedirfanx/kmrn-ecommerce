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
  Layout,
  Megaphone,
  X,
  Image as ImageIcon,
  Sparkles,
  Mail,
  Search,
  ShoppingBag,
  Download,
  ChevronDown,
  User,
  Clock,
  BookOpen
} from 'lucide-react';
import {
  Product,
  CategoryData,
  Catalogue,
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
  subscribeCatalogues,
  saveCatalogueToDb,
  deleteCatalogueFromDb,
  saveBannerSlides,
  saveAnnouncements,
  saveFeaturedProductIds,
  subscribeContactMessages,
  deleteContactMessage,
  markContactMessageRead,
  subscribeAllOrders,
  updateOrderStatusInDb,
  deleteOrderInDb,
  DEFAULT_CATALOGUES
} from '../services/storeService';

interface AdminPortalProps {
  onNavigateToStore?: () => void;
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

  // Navigation options on the left side
  const [activeTab, setActiveTab] = useState<
    'products' | 'catalogues' | 'categories' | 'featured' | 'banner' | 'announcements' | 'messages' | 'orders'
  >('products');

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Catalogues State
  const [catalogues, setCatalogues] = useState<Catalogue[]>(DEFAULT_CATALOGUES);
  const [editingCatalogue, setEditingCatalogue] = useState<Catalogue | null>(null);
  const [isCatalogueFormOpen, setIsCatalogueFormOpen] = useState(false);
  const [catalogueFormData, setCatalogueFormData] = useState<Partial<Catalogue>>({
    name: '',
    description: '',
    image: '',
    category: "Elegant Women's Wear"
  });

  // Orders State
  const [orders, setOrders] = useState<OrderConfirmation[]>([]);
  const [ordersFilter, setOrdersFilter] = useState<'active' | 'history'>('active');
  const [ordersSearchQuery, setOrdersSearchQuery] = useState('');
  const [isUpdatingOrder, setIsUpdatingOrder] = useState<string | null>(null);

  // Image Cropper State (3:4 portrait for products/catalogues, 16:9 for banner)
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropperTarget, setCropperTarget] = useState<{
    type: 'product' | 'banner' | 'catalogue';
    index?: number;
  }>({ type: 'product' });

  // Customer Inquiries / Messages State
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('maison_local_messages') || '[]');
    } catch {
      return [];
    }
  });
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  // Up to 15 images for product
  const [productImages, setProductImages] = useState<string[]>(['']);

  // Colours and sizes for product
  const [availableColours, setAvailableColours] = useState<string[]>([]);
  const [newColourInput, setNewColourInput] = useState('');
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [newSizeInput, setNewSizeInput] = useState('');

  // Specifications State for Product Form
  const [productSpecs, setProductSpecs] = useState<{ label: string; value: string }[]>([]);

  // Product Form Data
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: categories[0]?.name || "Elegant Women's Wear",
    subcategory: '',
    catalogueId: '',
    catalogueName: '',
    price: 10000,
    description: '',
    details: '',
    inStock: true
  });

  // Featured Products Picker State
  const [localFeaturedIds, setLocalFeaturedIds] = useState<string[]>(() => {
    if (featuredProductIds && featuredProductIds.length > 0) {
      return featuredProductIds;
    }
    return products.filter((p) => p.featured).map((p) => p.id);
  });
  const [featuredSearchQuery, setFeaturedSearchQuery] = useState('');
  const [isSavingFeatured, setIsSavingFeatured] = useState(false);

  // Category Form State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCatForSub, setSelectedCatForSub] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');

  // Banner Slides State
  const [localBannerSlides, setLocalBannerSlides] = useState<BannerSlide[]>(() => {
    return bannerSlides && bannerSlides.length >= 2 ? bannerSlides : [];
  });
  const [isSavingBanner, setIsSavingBanner] = useState(false);

  // Announcements State
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
    type: 'product' | 'catalogue' | 'category' | 'banner' | 'announcement' | 'message' | 'order';
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
    const unsubCatg = subscribeCatalogues((liveCatgs) => {
      setCatalogues(liveCatgs);
    });
    return () => {
      unsubMsgs();
      unsubOrders();
      unsubCatg();
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
        { label: 'Dupatta', value: '' },
        { label: 'Work', value: '' }
      ];
    }
    return [
      { label: 'Material', value: '' },
      { label: 'Dimensions', value: '' }
    ];
  };

  // Open New Product Form
  const openNewProductForm = () => {
    setEditingProduct(null);
    setProductImages(['']);
    setAvailableColours(['Original']);
    setAvailableSizes(['Unstitched']);
    const defaultCat = categories[0]?.name || "Elegant Women's Wear";
    setFormData({
      id: `prod-${Date.now()}`,
      name: '',
      image: '',
      additionalImages: [],
      category: defaultCat,
      subcategory: categories[0]?.subcategories[0] || '',
      catalogueId: catalogues[0]?.id || '',
      catalogueName: catalogues[0]?.name || '',
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
    const allImgs = [product.image || '', ...(product.additionalImages || [])].filter((img) => img && img.trim().length > 0);
    setProductImages(allImgs.length > 0 ? allImgs : ['']);
    setAvailableColours(product.availableColours && product.availableColours.length > 0 ? product.availableColours : ['Classic Original']);
    setAvailableSizes(product.availableSizes && product.availableSizes.length > 0 ? product.availableSizes : ['Standard']);
    setFormData({
      ...product,
      catalogueId: product.catalogueId || '',
      catalogueName: product.catalogueName || ''
    });

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
        const next = [...prev];
        next[idx] = croppedDataUrl;
        return next;
      });
    } else if (cropperTarget.type === 'catalogue') {
      setCatalogueFormData((prev) => ({ ...prev, image: croppedDataUrl }));
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

  // Product Images Actions (up to 15)
  const handleAddImageSlot = () => {
    if (productImages.length >= 15) {
      setErrorMessage('Maximum 15 photos allowed per product.');
      return;
    }
    setProductImages((prev) => [...prev, '']);
  };

  const handleRemoveImageSlot = (index: number) => {
    if (productImages.length <= 1) {
      setProductImages(['']);
      return;
    }
    setProductImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Colour Tags Actions
  const handleAddColour = () => {
    const val = newColourInput.trim();
    if (!val) return;
    if (!availableColours.includes(val)) {
      setAvailableColours((prev) => [...prev, val]);
    }
    setNewColourInput('');
  };

  const handleRemoveColour = (colour: string) => {
    setAvailableColours((prev) => prev.filter((c) => c !== colour));
  };

  // Size Tags Actions
  const handleAddSize = () => {
    const val = newSizeInput.trim();
    if (!val) return;
    if (!availableSizes.includes(val)) {
      setAvailableSizes((prev) => [...prev, val]);
    }
    setNewSizeInput('');
  };

  const handleRemoveSize = (size: string) => {
    setAvailableSizes((prev) => prev.filter((s) => s !== size));
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

    const validImages = productImages.filter((img) => img && img.trim().length > 0);
    if (validImages.length === 0) {
      setErrorMessage('Primary photo (Photo 1) is mandatory.');
      return;
    }

    const primaryImage = validImages[0];
    const additionalImgs = validImages.slice(1, 15);

    const validSpecs = productSpecs
      .filter((s) => s.label.trim().length > 0 && s.value.trim().length > 0)
      .slice(0, 10);

    const isFeatured = localFeaturedIds.includes(formData.id || '');

    const selectedCatgObj = catalogues.find((c) => c.id === formData.catalogueId);
    const catalogueName = selectedCatgObj ? selectedCatgObj.name : (formData.catalogueName || '');

    const creationDate = editingProduct?.createdAt || formData.createdAt || new Date().toISOString();

    const productToSave: Product = {
      ...(formData as Product),
      id: formData.id || `prod-${Date.now()}`,
      name: formData.name || 'Untitled Product',
      category: formData.category || (categories[0]?.name || "Elegant Women's Wear"),
      subcategory: formData.subcategory || '',
      catalogueId: formData.catalogueId || '',
      catalogueName: catalogueName,
      availableColours: availableColours.length > 0 ? availableColours : ['Classic Original'],
      availableSizes: availableSizes.length > 0 ? availableSizes : ['Standard'],
      price: Number(formData.price) || 1000,
      description: formData.description || '',
      details: formData.details || formData.description || '',
      image: primaryImage,
      additionalImages: additionalImgs,
      inStock: formData.inStock !== false,
      featured: isFeatured,
      specs: validSpecs,
      rating: formData.rating || 0,
      reviewsCount: formData.reviewsCount || 0,
      createdAt: creationDate,
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

  // Catalogue Actions
  const openNewCatalogueForm = () => {
    setEditingCatalogue(null);
    setCatalogueFormData({
      id: `catg-${Date.now()}`,
      name: '',
      description: '',
      image: '',
      category: "Elegant Women's Wear"
    });
    setIsCatalogueFormOpen(true);
  };

  const openEditCatalogueForm = (catg: Catalogue) => {
    setEditingCatalogue(catg);
    setCatalogueFormData({ ...catg });
    setIsCatalogueFormOpen(true);
  };

  const handleSaveCatalogue = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!catalogueFormData.name?.trim()) {
      setErrorMessage('Catalogue name is required.');
      return;
    }
    if (!catalogueFormData.image?.trim()) {
      setErrorMessage('Cover image is required.');
      return;
    }

    const catalogueToSave: Catalogue = {
      id: catalogueFormData.id || `catg-${Date.now()}`,
      name: catalogueFormData.name.trim(),
      description: catalogueFormData.description?.trim() || '',
      image: catalogueFormData.image.trim(),
      category: catalogueFormData.category || "Elegant Women's Wear",
      createdAt: editingCatalogue?.createdAt || new Date().toISOString()
    };

    setCatalogues((prev) => [
      catalogueToSave,
      ...prev.filter((c) => c.id !== catalogueToSave.id)
    ]);
    setIsCatalogueFormOpen(false);

    const res = await saveCatalogueToDb(catalogueToSave);
    if (res.success) {
      setStatusNotice('Catalogue saved to live database');
      setTimeout(() => setStatusNotice(''), 3000);
    } else {
      setErrorMessage(res.error || 'Failed to save catalogue');
    }
  };

  const executeDeleteCatalogue = async (catalogueId: string) => {
    setErrorMessage('');
    setCatalogues((prev) => prev.filter((c) => c.id !== catalogueId));
    const res = await deleteCatalogueFromDb(catalogueId);
    if (res.success) {
      setStatusNotice('Catalogue deleted from live database');
      setTimeout(() => setStatusNotice(''), 3000);
    } else {
      setErrorMessage(res.error || 'Failed to delete catalogue');
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

  // Category Actions
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

    const catSubs = cat.subcategories || [];
    if (catSubs.length >= 10) {
      setErrorMessage('Maximum 10 subcategories allowed for this category.');
      return;
    }

    if (catSubs.includes(sub)) {
      setErrorMessage('Subcategory already exists.');
      return;
    }

    const updatedCat: CategoryData = {
      ...cat,
      subcategories: [...catSubs, sub]
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
      subcategories: (cat.subcategories || []).filter((s) => s !== sub)
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
    if (localBannerSlides.length >= 15) {
      setErrorMessage('Maximum 15 banner slides allowed.');
      return;
    }
    const newSlide: BannerSlide = {
      id: `slide-${Date.now()}`,
      type: 'custom',
      title: 'Seasonal Offer',
      subtitle: 'Special promotion across curated items',
      image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1600&q=80',
      buttonText: 'Explore',
      linkUrl: '#home',
      hideButton: false
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

  // Announcements Actions
  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncementText.trim()) return;
    const newItem: AnnouncementItem = {
      id: `ann-${Date.now()}`,
      text: newAnnouncementText.trim(),
      linkText: newAnnouncementLinkText.trim() || '',
      linkUrl: newAnnouncementLinkUrl.trim() || '',
      startDate: newAnnouncementStartDate || undefined,
      endDate: newAnnouncementEndDate || undefined,
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
      setStatusNotice('Announcement published to live database');
      onAnnouncementsChange?.(updated);
      setTimeout(() => setStatusNotice(''), 3000);
    } else {
      setErrorMessage(res.error || 'Failed to save announcement');
    }
  };

  const handleToggleAnnouncementActive = async (id: string) => {
    const updated = localAnnouncements.map((a) => (a.id === id ? { ...a, active: !a.active } : a));
    setLocalAnnouncements(updated);
    onAnnouncementsChange?.(updated);
    await saveAnnouncements(updated);
  };

  const executeDeleteAnnouncement = async (id: string) => {
    const updated = localAnnouncements.filter((a) => a.id !== id);
    setLocalAnnouncements(updated);
    onAnnouncementsChange?.(updated);
    const res = await saveAnnouncements(updated);
    if (res.success) {
      setStatusNotice('Announcement removed from live database');
      setTimeout(() => setStatusNotice(''), 3000);
    }
  };

  // Messages Actions
  const handleMarkMessageRead = async (msgId: string) => {
    setContactMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, read: true } : m))
    );
    await markContactMessageRead(msgId);
  };

  const executeDeleteMessage = async (msgId: string) => {
    setContactMessages((prev) => prev.filter((m) => m.id !== msgId));
    if (selectedMessage?.id === msgId) setSelectedMessage(null);
    const res = await deleteContactMessage(msgId);
    if (res.success) {
      setStatusNotice('Message removed from database');
      setTimeout(() => setStatusNotice(''), 3000);
    }
  };

  // Orders Actions
  const handleUpdateOrderStatus = async (
    orderId: string,
    status: OrderConfirmation['status'],
    userId?: string
  ) => {
    setIsUpdatingOrder(orderId);
    setOrders((prev) =>
      prev.map((o) => (o.orderId === orderId ? { ...o, status } : o))
    );
    const res = await updateOrderStatusInDb(orderId, status, userId);
    setIsUpdatingOrder(null);
    if (res.success) {
      setStatusNotice(`Order ${orderId} updated to ${status}`);
      setTimeout(() => setStatusNotice(''), 3000);
    } else {
      setErrorMessage(res.error || 'Failed to update order status');
    }
  };

  const executeDeleteOrder = async (orderId: string, userId?: string) => {
    setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
    const res = await deleteOrderInDb(orderId, userId);
    if (res.success) {
      setStatusNotice(`Order ${orderId} deleted permanently`);
      setTimeout(() => setStatusNotice(''), 3000);
    } else {
      setErrorMessage(res.error || 'Failed to delete order');
    }
  };

  const handleExportOrdersToCSV = () => {
    const targetOrders = ordersFilter === 'history'
      ? orders.filter((o) => o.status === 'Delivered' || o.status === 'Cancelled')
      : orders;

    if (targetOrders.length === 0) {
      setErrorMessage('No orders available to export.');
      return;
    }

    const headers = [
      'Order ID',
      'Placed At',
      'Customer Name',
      'Customer Type',
      'Phone',
      'Email',
      'Shipping Address',
      'Payment Method',
      'Status',
      'Items Count',
      'Subtotal BDT',
      'Shipping BDT',
      'Total BDT'
    ];

    const rows = targetOrders.map((o) => [
      `"${o.orderId}"`,
      `"${new Date(o.placedAt).toLocaleString()}"`,
      `"${(o.customerName || '').replace(/"/g, '""')}"`,
      `"${o.isGuest || !o.userId ? 'Guest Checkout' : 'Registered Account'}"`,
      `"${(o.phone || '').replace(/"/g, '""')}"`,
      `"${(o.email || '').replace(/"/g, '""')}"`,
      `"${(o.shippingAddress || `${o.street}, ${o.city}, ${o.country}`).replace(/"/g, '""')}"`,
      `"${o.paymentMethod || 'Cash on Delivery'}"`,
      `"${o.status}"`,
      `"${(o.items || []).length}"`,
      `"${o.subtotal || o.total}"`,
      `"${o.shipping || 0}"`,
      `"${o.total}"`
    ]);

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
    p.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (p.catalogueName && p.catalogueName.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const featuredPool = products.filter((p) =>
    !localFeaturedIds.includes(p.id) &&
    (p.name.toLowerCase().includes(featuredSearchQuery.toLowerCase()) ||
     p.category.toLowerCase().includes(featuredSearchQuery.toLowerCase()))
  );

  const currentFeaturedProducts = localFeaturedIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined);

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-md flex flex-col items-center">
          <div className="h-14 w-14 rounded-2xl bg-neutral-900 text-white flex items-center justify-center mb-4 shadow-xs">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-neutral-900 mb-1 text-center">
            Admin Access
          </h2>
          <p className="text-xs text-stone-500 mb-6 text-center">Sign in to manage your luxury store</p>

          <form onSubmit={handleAdminLogin} className="w-full space-y-4">
            {loginError && (
              <div className="p-3 bg-red-50 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Username
              </label>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 shadow-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm py-3 px-4 rounded-xl transition-all shadow-md cursor-pointer mt-2"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-stone-100 flex flex-col md:flex-row font-sans">
      {/* LEFT SIDEBAR: Navigation Options (Fixed, scrollable only if items exceed height) */}
      <aside className="w-full md:w-64 lg:w-72 bg-neutral-950 text-white flex flex-col justify-between shrink-0 border-r border-neutral-800 md:h-screen md:overflow-y-auto">
        <div className="p-5 sm:p-6">
          {/* Logo & Admin Branding */}
          <div className="pb-6 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex flex-col">
              <Logo variant="dark" size="sm" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 mt-1">
                Admin
              </span>
            </div>
          </div>

          {/* Vertical Navigation Tabs */}
          <nav className="mt-6 space-y-1.5" aria-label="Admin Navigation">
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-white text-neutral-950 shadow-md font-extrabold'
                  : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className="h-4 w-4" />
                <span>Products</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeTab === 'products' ? 'bg-neutral-950 text-white' : 'bg-neutral-800 text-neutral-300'
              }`}>
                {products.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('catalogues')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'catalogues'
                  ? 'bg-white text-neutral-950 shadow-md font-extrabold'
                  : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="h-4 w-4" />
                <span>Catalogues</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeTab === 'catalogues' ? 'bg-neutral-950 text-white' : 'bg-neutral-800 text-neutral-300'
              }`}>
                {catalogues.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-white text-neutral-950 shadow-md font-extrabold'
                  : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="h-4 w-4" />
                <span>Categories</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeTab === 'categories' ? 'bg-neutral-950 text-white' : 'bg-neutral-800 text-neutral-300'
              }`}>
                {categories.length}/5
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('featured')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'featured'
                  ? 'bg-white text-neutral-950 shadow-md font-extrabold'
                  : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Featured Homepage</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeTab === 'featured' ? 'bg-neutral-950 text-white' : 'bg-neutral-800 text-neutral-300'
              }`}>
                {localFeaturedIds.length}/4
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('banner')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'banner'
                  ? 'bg-white text-neutral-950 shadow-md font-extrabold'
                  : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layout className="h-4 w-4" />
                <span>Banner Ads</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeTab === 'banner' ? 'bg-neutral-950 text-white' : 'bg-neutral-800 text-neutral-300'
              }`}>
                {localBannerSlides.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('announcements')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'announcements'
                  ? 'bg-white text-neutral-950 shadow-md font-extrabold'
                  : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Megaphone className="h-4 w-4" />
                <span>News & Offers</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeTab === 'announcements' ? 'bg-neutral-950 text-white' : 'bg-neutral-800 text-neutral-300'
              }`}>
                {localAnnouncements.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('messages')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'messages'
                  ? 'bg-white text-neutral-950 shadow-md font-extrabold'
                  : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4" />
                <span>Messages</span>
              </div>
              {contactMessages.filter((m) => !m.read).length > 0 && (
                <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-white text-neutral-950 shadow-md font-extrabold'
                  : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="h-4 w-4" />
                <span>Orders</span>
              </div>
              {orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled').length > 0 ? (
                <span className="text-[10px] bg-amber-400 text-neutral-950 font-bold px-1.5 py-0.5 rounded-full tabular-nums">
                  {orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled').length}
                </span>
              ) : (
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  activeTab === 'orders' ? 'bg-neutral-950 text-white' : 'bg-neutral-800 text-neutral-300'
                }`}>
                  {orders.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* User profile & Sign Out at bottom of sidebar */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <div className="h-8 w-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300 font-bold text-xs">
                {ADMIN_CREDENTIALS.username.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{ADMIN_CREDENTIALS.username}</p>
                <p className="text-[10px] text-neutral-400">Owner Access</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAdminLogout}
              className="p-2 text-neutral-400 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Sign Out of Admin"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 h-full md:h-screen overflow-y-auto">
        {/* Top feedback notifications */}
        {statusNotice && (
          <div className="m-4 sm:m-6 mb-0 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{statusNotice}</span>
          </div>
        )}

        {errorMessage && (
          <div className="m-4 sm:m-6 mb-0 p-3 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          {/* TAB 1: Products */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search product name, category, catalogue..."
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-4 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <button
                  type="button"
                  onClick={openNewProductForm}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New Product</span>
                </button>
              </div>

              {/* Products Table */}
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-[11px] uppercase text-stone-500 font-semibold border-b border-stone-200">
                      <tr>
                        <th className="py-3 px-4">Photo</th>
                        <th className="py-3 px-4">Product Details</th>
                        <th className="py-3 px-4">Category & Catalogue</th>
                        <th className="py-3 px-4">Colours & Sizes</th>
                        <th className="py-3 px-4">Price</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-stone-400">
                            No products found matching your search.
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((p) => (
                          <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                            <td className="py-3 px-4">
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-11 h-14 object-cover rounded-lg bg-stone-100 shrink-0 border border-stone-200"
                              />
                            </td>
                            <td className="py-3 px-4 max-w-xs">
                              <p className="font-bold text-neutral-900 truncate">{p.name}</p>
                              <p className="text-[11px] text-stone-500 truncate">{p.description}</p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-medium text-neutral-800">{p.category}</p>
                              {p.catalogueName ? (
                                <span className="inline-block mt-0.5 text-[10px] font-semibold bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                                  {p.catalogueName}
                                </span>
                              ) : p.subcategory ? (
                                <span className="inline-block mt-0.5 text-[10px] text-stone-500">
                                  {p.subcategory}
                                </span>
                              ) : null}
                            </td>
                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                {p.availableColours && p.availableColours.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {p.availableColours.slice(0, 3).map((c, i) => (
                                      <span key={i} className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-neutral-700">
                                        {c}
                                      </span>
                                    ))}
                                    {p.availableColours.length > 3 && (
                                      <span className="text-[10px] text-stone-400">+{p.availableColours.length - 3}</span>
                                    )}
                                  </div>
                                )}
                                {p.availableSizes && p.availableSizes.length > 0 && (
                                  <div className="text-[10px] text-stone-500">
                                    Sizes: {p.availableSizes.join(', ')}
                                  </div>
                                )}
                              </div>
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
                              <div className="flex items-center justify-end gap-1">
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
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add / Edit Product Modal */}
              {isProductFormOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
                  <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl my-4">
                    <div className="flex items-center justify-between pb-4 mb-5 border-b border-stone-100">
                      <div>
                        <h2 className="font-heading font-extrabold text-xl text-neutral-900">
                          {editingProduct ? 'Edit Product' : 'Add New Product'}
                        </h2>
                        <p className="text-xs text-stone-500">Provide product details, catalogue, available colours, sizes, and up to 15 photos.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsProductFormOpen(false)}
                        className="p-2 rounded-full bg-stone-100 text-stone-500 hover:text-neutral-900 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveProduct} className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-neutral-800 mb-1">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-neutral-900"
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
                            className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
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
                            Catalogue
                          </label>
                          <select
                            value={formData.catalogueId || ''}
                            onChange={(e) => {
                              const catgId = e.target.value;
                              const catgObj = catalogues.find((c) => c.id === catgId);
                              setFormData({
                                ...formData,
                                catalogueId: catgId,
                                catalogueName: catgObj ? catgObj.name : ''
                              });
                            }}
                            className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                          >
                            <option value="">None / Custom</option>
                            {catalogues.map((catg) => (
                              <option key={catg.id} value={catg.id}>
                                {catg.name}
                              </option>
                            ))}
                          </select>
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
                            className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                          />
                        </div>
                      </div>

                      {/* Available Colours Selector (Chips input) */}
                      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                        <label className="block text-xs font-bold text-neutral-800 mb-1">
                          Available Colours
                        </label>
                        <p className="text-[11px] text-stone-500 mb-2">Customers can select from these colours before adding to bag.</p>
                        
                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                          {availableColours.map((col, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 bg-white border border-stone-300 px-2.5 py-1 rounded-lg text-xs font-semibold text-neutral-800 shadow-xs"
                            >
                              <span>{col}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveColour(col)}
                                className="text-stone-400 hover:text-red-500 cursor-pointer"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>

                        <div className="flex gap-2 max-w-sm">
                          <input
                            type="text"
                            placeholder="Add colour (e.g. Maroon, Emerald, Navy)..."
                            value={newColourInput}
                            onChange={(e) => setNewColourInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddColour();
                              }
                            }}
                            className="flex-1 bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                          />
                          <button
                            type="button"
                            onClick={handleAddColour}
                            className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {/* Available Sizes Selector (Chips input) */}
                      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                        <label className="block text-xs font-bold text-neutral-800 mb-1">
                          Available Sizes
                        </label>
                        <p className="text-[11px] text-stone-500 mb-2">Customers can select from these sizes (e.g. Unstitched, Small, Medium, Large, Free Size).</p>
                        
                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                          {availableSizes.map((sz, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 bg-white border border-stone-300 px-2.5 py-1 rounded-lg text-xs font-semibold text-neutral-800 shadow-xs"
                            >
                              <span>{sz}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSize(sz)}
                                className="text-stone-400 hover:text-red-500 cursor-pointer"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>

                        <div className="flex gap-2 max-w-sm">
                          <input
                            type="text"
                            placeholder="Add size (e.g. Unstitched, S, M, L, King Size)..."
                            value={newSizeInput}
                            onChange={(e) => setNewSizeInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSize();
                              }
                            }}
                            className="flex-1 bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                          />
                          <button
                            type="button"
                            onClick={handleAddSize}
                            className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {/* Up to 15 Images Upload Manager */}
                      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="block text-xs font-bold text-neutral-800">
                              Product Photos ({productImages.filter(Boolean).length} / 15)
                            </span>
                            <span className="text-[11px] text-stone-500">
                              Photo 1 is the main primary thumbnail. You can add up to 15 photos in vertical 3:4 ratio.
                            </span>
                          </div>
                          {productImages.length < 15 && (
                            <button
                              type="button"
                              onClick={handleAddImageSlot}
                              className="inline-flex items-center gap-1 bg-white hover:bg-stone-100 text-neutral-900 border border-stone-300 text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Add Photo Slot</span>
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
                          {productImages.map((imgUrl, slotIdx) => {
                            const isPrimary = slotIdx === 0;
                            return (
                              <div key={slotIdx} className="bg-white p-2 rounded-xl border border-stone-200 flex flex-col justify-between shadow-xs">
                                <div>
                                  <div className="flex items-center justify-between mb-1 text-[10px] font-bold text-stone-600">
                                    <span>{isPrimary ? 'Photo 1 (Main)' : `Photo ${slotIdx + 1}`}</span>
                                    {!isPrimary && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveImageSlot(slotIdx)}
                                        className="text-stone-400 hover:text-red-500 cursor-pointer"
                                        title="Remove slot"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>

                                  {imgUrl ? (
                                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-stone-100 mb-2 border border-stone-200">
                                      <img src={imgUrl} alt={`Slot ${slotIdx + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                  ) : (
                                    <div className="aspect-[3/4] rounded-lg bg-stone-100 flex flex-col items-center justify-center text-stone-400 text-xs mb-2 border border-dashed border-stone-300">
                                      <ImageIcon className="h-5 w-5 mb-1" />
                                      <span className="text-[10px]">No photo</span>
                                    </div>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setCropperTarget({ type: 'product', index: slotIdx });
                                    setIsCropperOpen(true);
                                  }}
                                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Upload className="h-3 w-3" />
                                  <span>{imgUrl ? 'Change' : 'Upload'}</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Specifications Editor */}
                      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-xs text-neutral-900 block">
                              Specifications ({productSpecs.length}/10)
                            </span>
                            <span className="text-[11px] text-stone-500">
                              Attributes shown in product specifications accordion.
                            </span>
                          </div>

                          {productSpecs.length < 10 && (
                            <button
                              type="button"
                              onClick={handleAddSpecification}
                              className="inline-flex items-center gap-1 bg-white hover:bg-stone-100 text-neutral-900 border border-stone-300 text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Add Spec</span>
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
                                placeholder="Value (e.g. Pure Lawn)"
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
                          Short Description *
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={formData.description || ''}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-800 mb-1">
                          Additional Details (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={formData.details || ''}
                          onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                          className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={() => setIsProductFormOpen(false)}
                          className="px-4 py-2.5 bg-stone-100 text-stone-700 font-semibold rounded-xl text-xs hover:bg-stone-200 cursor-pointer"
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

          {/* TAB 2: Catalogues Management */}
          {activeTab === 'catalogues' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <div>
                  <h3 className="font-heading font-bold text-lg text-neutral-900">
                    Product Catalogues
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Pre-add designer catalogues and collections. Products can be assigned to these catalogues and displayed as thumbnails on the Women's Wear page.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openNewCatalogueForm}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Catalogue</span>
                </button>
              </div>

              {/* Catalogues Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {catalogues.map((catg) => {
                  const assignedCount = products.filter((p) => p.catalogueId === catg.id || p.catalogueName === catg.name).length;
                  return (
                    <div
                      key={catg.id}
                      className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs flex flex-col justify-between"
                    >
                      <div className="relative aspect-[16/10] bg-stone-100 overflow-hidden">
                        <img
                          src={catg.image}
                          alt={catg.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] font-bold text-neutral-900 shadow-xs">
                          {assignedCount} Products
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                            {catg.category}
                          </span>
                          <h4 className="font-heading font-bold text-base text-neutral-900 mb-1">
                            {catg.name}
                          </h4>
                          {catg.description && (
                            <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed mb-3">
                              {catg.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                          <span className="text-[11px] text-stone-400 font-mono">
                            ID: {catg.id}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditCatalogueForm(catg)}
                              className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 hover:text-neutral-900 cursor-pointer"
                              title="Edit Catalogue"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmModal({ type: 'catalogue', id: catg.id, name: catg.name })}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                              title="Delete Catalogue"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add / Edit Catalogue Modal */}
              {isCatalogueFormOpen && (
                <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                      <h3 className="font-heading font-bold text-lg text-neutral-900">
                        {editingCatalogue ? 'Edit Catalogue' : 'Add New Catalogue'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsCatalogueFormOpen(false)}
                        className="p-1.5 rounded-full bg-stone-100 text-stone-500 hover:text-neutral-900 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveCatalogue} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-800 mb-1">
                          Catalogue Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Original Pakistani Lawn, Luxury Chiffon..."
                          value={catalogueFormData.name || ''}
                          onChange={(e) => setCatalogueFormData({ ...catalogueFormData, name: e.target.value })}
                          className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-800 mb-1">
                          Category
                        </label>
                        <select
                          value={catalogueFormData.category || "Elegant Women's Wear"}
                          onChange={(e) => setCatalogueFormData({ ...catalogueFormData, category: e.target.value })}
                          className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-800 mb-1">
                          Description
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Short summary of this catalogue collection..."
                          value={catalogueFormData.description || ''}
                          onChange={(e) => setCatalogueFormData({ ...catalogueFormData, description: e.target.value })}
                          className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-800 mb-1">
                          Cover Image *
                        </label>
                        <div className="flex items-center gap-3">
                          {catalogueFormData.image ? (
                            <img
                              src={catalogueFormData.image}
                              alt="Cover Preview"
                              className="w-16 h-16 object-cover rounded-xl border border-stone-200 shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 shrink-0 border border-dashed border-stone-300">
                              <ImageIcon className="h-6 w-6" />
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setCropperTarget({ type: 'catalogue' });
                              setIsCropperOpen(true);
                            }}
                            className="bg-stone-100 hover:bg-stone-200 text-neutral-900 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            <span>{catalogueFormData.image ? 'Change Image' : 'Upload Image'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-stone-100 justify-end">
                        <button
                          type="button"
                          onClick={() => setIsCatalogueFormOpen(false)}
                          className="px-4 py-2 bg-stone-100 text-stone-700 font-semibold rounded-xl text-xs hover:bg-stone-200 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-neutral-900 text-white font-bold rounded-xl text-xs hover:bg-neutral-800 cursor-pointer shadow-md"
                        >
                          Save Catalogue
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Categories & Subcategories */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs">
                <h3 className="font-heading font-bold text-lg text-neutral-900 mb-1">
                  Store Categories ({categories.length}/5)
                </h3>
                <p className="text-xs text-stone-500 mb-5">
                  Manage categories and navigation hierarchy. Maximum 5 top-level categories.
                </p>

                <form onSubmit={handleAddCategory} className="flex gap-3 max-w-lg mb-6">
                  <input
                    type="text"
                    placeholder="Category Name..."
                    value={newCategoryName}
                    disabled={categories.length >= 5}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 bg-white border border-stone-300 rounded-xl px-4 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                  <button
                    type="submit"
                    disabled={categories.length >= 5}
                    className="bg-neutral-900 hover:bg-neutral-800 disabled:bg-stone-300 text-white font-bold text-xs px-5 py-2 rounded-xl cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    Add Category
                  </button>
                </form>

                <div className="space-y-4">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-heading font-bold text-sm text-neutral-900">
                            {cat.name}
                          </h4>
                          <span className="text-[11px] text-stone-500">
                            {(cat.subcategories || []).length} / 10 subcategories
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmModal({ type: 'category', id: cat.id, name: cat.name })}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-stone-200">
                        {(cat.subcategories || []).length === 0 ? (
                          <span className="text-xs text-stone-400">No subcategories.</span>
                        ) : (
                          (cat.subcategories || []).map((sub, sIdx) => (
                            <span
                              key={sIdx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-neutral-800 text-xs font-medium"
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
              <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs">
                <h3 className="font-heading font-bold text-lg text-neutral-900 mb-1">
                  Add Subcategory
                </h3>
                <p className="text-xs text-stone-500 mb-4">
                  Select a category and add subcategories for product categorization.
                </p>

                <form onSubmit={handleAddSubcategory} className="grid grid-cols-1 sm:grid-cols-12 gap-3 max-w-xl">
                  <div className="sm:col-span-5">
                    <select
                      value={selectedCatForSub}
                      onChange={(e) => setSelectedCatForSub(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                    >
                      <option value="">Select Category...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
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
                      className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="submit"
                      disabled={!selectedCatForSub || !newSubcategoryName.trim()}
                      className="w-full bg-neutral-900 hover:bg-neutral-800 disabled:bg-stone-300 text-white font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer transition-all"
                    >
                      Add Sub
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: Featured Homepage */}
          {activeTab === 'featured' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-stone-100">
                  <div>
                    <h3 className="font-heading font-bold text-lg text-neutral-900">
                      Homepage Featured Collection
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Select up to 4 products to highlight on the homepage.
                    </p>
                  </div>

                  <span className="text-xs bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-xl font-bold text-neutral-800 tabular-nums">
                    {currentFeaturedProducts.length} / 4 Selected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {currentFeaturedProducts.map((prod, idx) => (
                    <div
                      key={prod.id}
                      className="bg-stone-50 rounded-xl p-3 border border-stone-200 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase text-stone-500 bg-white px-2 py-0.5 rounded border border-stone-200">
                          Slot {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveProductFromFeatured(prod.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-white mb-2 border border-stone-200">
                        <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold uppercase text-stone-400 block truncate">{prod.category}</span>
                        <p className="font-heading font-bold text-xs text-neutral-900 truncate">{prod.name}</p>
                        <p className="text-xs font-semibold text-neutral-800 mt-0.5">{formatBDT(prod.price)}</p>
                      </div>
                    </div>
                  ))}

                  {Array.from({ length: 4 - currentFeaturedProducts.length }).map((_, idx) => (
                    <div
                      key={`empty-slot-${idx}`}
                      className="bg-stone-50/50 rounded-xl p-4 border border-dashed border-stone-300 flex flex-col items-center justify-center text-center aspect-[3/4]"
                    >
                      <span className="text-[10px] font-bold uppercase text-stone-400 bg-white px-2 py-0.5 rounded mb-2 border border-stone-200">
                        Slot {currentFeaturedProducts.length + idx + 1}
                      </span>
                      <p className="text-xs font-semibold text-stone-500">Available Slot</p>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-stone-100">
                  <span className="font-bold text-xs uppercase tracking-wider text-stone-400 block mb-3">
                    Search and Select Products to Feature
                  </span>

                  <div className="relative mb-4 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <input
                      type="text"
                      value={featuredSearchQuery}
                      onChange={(e) => setFeaturedSearchQuery(e.target.value)}
                      placeholder="Search product name or category..."
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-4 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                  </div>

                  <div className="max-h-72 overflow-y-auto rounded-xl border border-stone-200 divide-y divide-stone-100">
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
                              <p className="font-bold text-xs text-neutral-900">{prod.name}</p>
                              <span className="text-[11px] text-stone-500">
                                {prod.category} | {formatBDT(prod.price)}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddProductToFeatured(prod)}
                            disabled={localFeaturedIds.length >= 4}
                            className="bg-neutral-900 hover:bg-neutral-800 disabled:bg-stone-300 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer"
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

          {/* TAB 5: Banner Ads */}
          {activeTab === 'banner' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-stone-100">
                  <div>
                    <h3 className="font-heading font-bold text-lg text-neutral-900">
                      Hero Banner Carousel ({localBannerSlides.length}/15)
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Configure carousel slides displayed at the top of the homepage.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleAddBannerSlide}
                      disabled={localBannerSlides.length >= 15}
                      className="bg-stone-100 hover:bg-stone-200 text-neutral-900 font-bold text-xs py-2 px-3.5 rounded-xl cursor-pointer"
                    >
                      <Plus className="h-4 w-4 inline mr-1" />
                      Add Slide
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveBanner}
                      disabled={isSavingBanner}
                      className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer shadow-xs"
                    >
                      {isSavingBanner ? 'Saving...' : 'Save Banner'}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {localBannerSlides.map((slide, idx) => (
                    <div
                      key={slide.id || idx}
                      className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                        <span className="text-xs font-bold text-neutral-900">Slide {idx + 1}</span>
                        <div className="flex items-center gap-3">
                          <label className="inline-flex items-center gap-1.5 text-xs text-neutral-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={slide.hideButton === true}
                              onChange={(e) => handleUpdateBannerSlide(idx, { hideButton: e.target.checked })}
                              className="rounded border-stone-300 text-neutral-900 focus:ring-neutral-900"
                            />
                            <span>No Button</span>
                          </label>

                          {localBannerSlides.length > 2 && (
                            <button
                              type="button"
                              onClick={() => executeRemoveBanner(idx)}
                              className="text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                            >
                              Remove Slide
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                        <div className="sm:col-span-4">
                          <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-white border border-stone-200 mb-2">
                            <img src={slide.image} alt={slide.title || 'Banner'} className="w-full h-full object-cover" />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setCropperTarget({ type: 'banner', index: idx });
                              setIsCropperOpen(true);
                            }}
                            className="w-full bg-white hover:bg-stone-100 text-neutral-900 border border-stone-300 text-xs font-bold py-1.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            <span>Replace Banner Photo</span>
                          </button>
                        </div>

                        <div className="sm:col-span-8 space-y-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-stone-700 mb-1">Title</label>
                            <input
                              type="text"
                              value={slide.title || ''}
                              onChange={(e) => handleUpdateBannerSlide(idx, { title: e.target.value })}
                              className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-stone-700 mb-1">Subtitle</label>
                            <input
                              type="text"
                              value={slide.subtitle || ''}
                              onChange={(e) => handleUpdateBannerSlide(idx, { subtitle: e.target.value })}
                              className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                            />
                          </div>

                          {!slide.hideButton && (
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[11px] font-bold text-stone-700 mb-1">Button Text</label>
                                <input
                                  type="text"
                                  value={slide.buttonText || 'Explore Collection'}
                                  onChange={(e) => handleUpdateBannerSlide(idx, { buttonText: e.target.value })}
                                  className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-stone-700 mb-1">Link URL</label>
                                <input
                                  type="text"
                                  value={slide.linkUrl || '#shop'}
                                  onChange={(e) => handleUpdateBannerSlide(idx, { linkUrl: e.target.value })}
                                  className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Announcements */}
          {activeTab === 'announcements' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
                <h3 className="font-heading font-bold text-lg text-neutral-900 mb-1">
                  News & Offer Announcements
                </h3>
                <p className="text-xs text-stone-500 mb-5">
                  Announcements appear in the top ticker bar across the storefront.
                </p>

                <form onSubmit={handleAddAnnouncement} className="space-y-3 max-w-xl mb-8 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1">Announcement Text *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Free luxury express delivery across Bangladesh on orders over BDT 15,000"
                      value={newAnnouncementText}
                      onChange={(e) => setNewAnnouncementText(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">Link Text (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Shop Now"
                        value={newAnnouncementLinkText}
                        onChange={(e) => setNewAnnouncementLinkText(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">Link URL (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. #womens-wear"
                        value={newAnnouncementLinkUrl}
                        onChange={(e) => setNewAnnouncementLinkUrl(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingAnnouncements}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
                  >
                    Publish Announcement
                  </button>
                </form>

                <div className="space-y-3">
                  {localAnnouncements.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-xs text-neutral-900">{item.text}</p>
                        {item.linkText && (
                          <span className="text-[11px] text-stone-500 font-medium">
                            Link: {item.linkText} ({item.linkUrl})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleAnnouncementActive(item.id)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg cursor-pointer ${
                            item.active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {item.active ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          type="button"
                          onClick={() => executeDeleteAnnouncement(item.id)}
                          className="p-1.5 text-stone-400 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: Messages */}
          {activeTab === 'messages' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
                <h3 className="font-heading font-bold text-lg text-neutral-900 mb-1">
                  Customer Messages ({contactMessages.length})
                </h3>
                <p className="text-xs text-stone-500 mb-5">
                  Direct customer inquiries submitted through the contact page.
                </p>

                <div className="space-y-3">
                  {contactMessages.length === 0 ? (
                    <p className="py-8 text-center text-xs text-stone-400">
                      No customer messages yet.
                    </p>
                  ) : (
                    contactMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-xl border transition-all ${
                          msg.read ? 'bg-white border-stone-200' : 'bg-stone-50 border-neutral-900 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-neutral-900">{msg.name}</span>
                            <span className="text-stone-400 text-xs">•</span>
                            <span className="text-xs text-stone-600">{msg.email}</span>
                          </div>
                          <span className="text-[11px] text-stone-400">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-neutral-800 mb-1">{msg.subject}</p>
                        <p className="text-xs text-stone-600 leading-relaxed mb-3">{msg.message}</p>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                          {!msg.read && (
                            <button
                              type="button"
                              onClick={() => handleMarkMessageRead(msg.id)}
                              className="text-xs font-semibold text-neutral-900 hover:underline cursor-pointer"
                            >
                              Mark as Read
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => executeDeleteMessage(msg.id)}
                            className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: Orders */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-stone-100">
                  <div>
                    <h3 className="font-heading font-bold text-lg text-neutral-900">
                      Orders Management ({orders.length})
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Live synchronized orders with Firebase database. Deleting or updating an order updates all customer and admin views immediately.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex bg-stone-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setOrdersFilter('active')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          ordersFilter === 'active' ? 'bg-white text-neutral-900 shadow-xs' : 'text-stone-600'
                        }`}
                      >
                        Active Orders
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrdersFilter('history')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          ordersFilter === 'history' ? 'bg-white text-neutral-900 shadow-xs' : 'text-stone-600'
                        }`}
                      >
                        Order History
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleExportOrdersToCSV}
                      className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* Orders List */}
                <div className="space-y-4">
                  {(() => {
                    const filteredOrders = orders.filter((o) => {
                      const isHist = o.status === 'Delivered' || o.status === 'Cancelled';
                      if (ordersFilter === 'active' && isHist) return false;
                      if (ordersFilter === 'history' && !isHist) return false;
                      if (ordersSearchQuery.trim()) {
                        const q = ordersSearchQuery.toLowerCase();
                        return (
                          o.orderId.toLowerCase().includes(q) ||
                          o.customerName.toLowerCase().includes(q) ||
                          o.phone.toLowerCase().includes(q)
                        );
                      }
                      return true;
                    });

                    if (filteredOrders.length === 0) {
                      return (
                        <div className="py-12 text-center text-xs text-stone-400">
                          No orders found under this view.
                        </div>
                      );
                    }

                    return filteredOrders.map((ord) => (
                      <div
                        key={ord.orderId}
                        className="bg-stone-50 rounded-2xl border border-stone-200 overflow-hidden shadow-xs"
                      >
                        <div className="p-4 bg-white border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-mono font-bold text-xs bg-stone-100 text-neutral-900 px-2.5 py-1 rounded-lg border border-stone-200">
                              {ord.orderId}
                            </span>
                            <span className="text-xs text-stone-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(ord.placedAt).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <select
                              value={ord.status}
                              disabled={isUpdatingOrder === ord.orderId}
                              onChange={(e) => handleUpdateOrderStatus(ord.orderId, e.target.value as OrderConfirmation['status'], ord.userId)}
                              className="bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-900 cursor-pointer"
                            >
                              <option value="Processing">Processing</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => setDeleteConfirmModal({ type: 'order', id: ord.orderId, name: `Order ${ord.orderId}`, userId: ord.userId })}
                              className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg cursor-pointer"
                              title="Delete Order"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                          <div className="md:col-span-4 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-stone-400 block">Customer</span>
                            <p className="font-bold text-neutral-900">{ord.customerName}</p>
                            <p className="text-stone-600">Phone: {ord.phone}</p>
                            <p className="text-stone-600">Email: {ord.email}</p>
                            <p className="text-stone-600 pt-1">Address: {ord.shippingAddress}</p>
                          </div>

                          <div className="md:col-span-5 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase text-stone-400 block">Items ({(ord.items || []).length})</span>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {(ord.items || []).map((it, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-stone-200">
                                  <span className="font-medium text-neutral-800 truncate max-w-[180px]">
                                    {it.product?.name} (x{it.quantity})
                                  </span>
                                  <span className="font-semibold tabular-nums text-neutral-900">
                                    {formatBDT((it.product?.price || 0) * (it.quantity || 1))}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="md:col-span-3 flex flex-col justify-between border-t md:border-t-0 md:border-l border-stone-200 pt-3 md:pt-0 md:pl-4">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase text-stone-400 block">Summary</span>
                              <div className="flex justify-between text-stone-600">
                                <span>Subtotal</span>
                                <span>{formatBDT(ord.subtotal || ord.total)}</span>
                              </div>
                              <div className="flex justify-between text-stone-600">
                                <span>Shipping</span>
                                <span>{ord.shipping === 0 ? 'Free' : formatBDT(ord.shipping || 0)}</span>
                              </div>
                              <div className="flex justify-between font-bold text-neutral-900 pt-1 border-t border-stone-200">
                                <span>Total</span>
                                <span className="tabular-nums">{formatBDT(ord.total)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Image Cropper Modal */}
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
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-neutral-900">"{deleteConfirmModal.name}"</span>? This will sync immediately across all customer views.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(null)}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-neutral-900 font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer"
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
                  } else if (target.type === 'catalogue') {
                    await executeDeleteCatalogue(target.id);
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
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md cursor-pointer"
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
