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
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  User,
  Clock,
  BookOpen,
  Menu,
  Tag,
  Archive
} from 'lucide-react';
import {
  Product,
  CategoryData,
  Catalogue,
  BannerSlide,
  AnnouncementItem,
  ContactMessage,
  OrderConfirmation,
  PromoCode
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
  subscribePromoCodes,
  savePromoCodeToDb,
  deletePromoCodeFromDb,
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
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Navigation options on the left side
  const [activeTab, setActiveTab] = useState<
    'products' | 'catalogues' | 'categories' | 'featured' | 'banner' | 'announcements' | 'promocodes' | 'messages' | 'orders'
  >('products');

  // Promo Codes State
  const [promoCodesList, setPromoCodesList] = useState<PromoCode[]>([]);
  const [isPromoFormOpen, setIsPromoFormOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [promoFormData, setPromoFormData] = useState<{
    code: string;
    discountType: 'percentage' | 'fixed' | 'delivery';
    discountValue: number;
    hasMinOrder: boolean;
    minOrderAmount: number;
    active: boolean;
  }>({
    code: '',
    discountType: 'percentage',
    discountValue: 10,
    hasMinOrder: false,
    minOrderAmount: 0,
    active: true
  });

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
  const [ordersFilter, setOrdersFilter] = useState<'all' | 'active' | 'history'>('all');
  const [ordersSearchQuery, setOrdersSearchQuery] = useState('');
  const [isUpdatingOrder, setIsUpdatingOrder] = useState<string | null>(null);

  // Image Cropper State (3:4 portrait for products/catalogues, 16:9 for banner/hero, 1:1 for category logo)
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropperTarget, setCropperTarget] = useState<{
    type: 'product' | 'banner' | 'catalogue' | 'category' | 'category-edit' | 'category-hero';
    index?: number;
  }>({ type: 'product' });
  const [selectedCatalogueCategoryFilter, setSelectedCatalogueCategoryFilter] = useState<string>('All');

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
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);

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
    type: 'product' | 'catalogue' | 'category' | 'banner' | 'announcement' | 'message' | 'order' | 'promocode';
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
    const unsubPromos = subscribePromoCodes((livePromos) => {
      setPromoCodesList(livePromos);
    });
    return () => {
      unsubMsgs();
      unsubOrders();
      unsubCatg();
      unsubPromos();
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
      subcategory: catalogues[0]?.name || '',
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
    } else if (cropperTarget.type === 'category' || cropperTarget.type === 'category-edit') {
      setEditingCategory((prev) => (prev ? { ...prev, logo: croppedDataUrl } : null));
    } else if (cropperTarget.type === 'category-hero') {
      setEditingCategory((prev) => (prev ? { ...prev, heroImage: croppedDataUrl } : null));
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
      archived: Boolean(formData.archived),
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

  const handleToggleProductStock = async (product: Product) => {
    setErrorMessage('');
    const newStock = !product.inStock;
    const updated: Product = {
      ...product,
      inStock: newStock,
      updatedAt: new Date().toISOString()
    };

    onProductSavedLocally(updated);
    const res = await saveProductToDb(updated);
    if (res.success) {
      setStatusNotice(`"${product.name}" is now marked as ${newStock ? 'In Stock' : 'Out of Stock'}`);
      setTimeout(() => setStatusNotice(''), 3000);
    } else if (res.error) {
      setErrorMessage(res.error);
    }
  };

  const handleToggleProductArchive = async (product: Product) => {
    setErrorMessage('');
    const newArchived = !product.archived;
    const updated: Product = {
      ...product,
      archived: newArchived,
      updatedAt: new Date().toISOString()
    };

    onProductSavedLocally(updated);
    const res = await saveProductToDb(updated);
    if (res.success) {
      setStatusNotice(`"${product.name}" has been ${newArchived ? 'archived' : 'unarchived'}`);
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

  const handleMoveFeaturedProduct = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= localFeaturedIds.length) return;
    const nextIds = [...localFeaturedIds];
    const [moved] = nextIds.splice(fromIndex, 1);
    nextIds.splice(toIndex, 0, moved);

    setLocalFeaturedIds(nextIds);
    onFeaturedProductIdsChange?.(nextIds);

    setIsSavingFeatured(true);
    const res = await saveFeaturedProductIds(nextIds);
    setIsSavingFeatured(false);

    if (res.success) {
      setStatusNotice('Featured sequence updated');
      setTimeout(() => setStatusNotice(''), 2000);
    } else {
      setErrorMessage(res.error || 'Failed to update sequence');
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
      logo: '/images/aniq-logo.png'
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

  const handleSaveEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setErrorMessage('');
    const name = editingCategory.name.trim();
    if (!name) return;

    if (categories.some((c) => c.id !== editingCategory.id && c.name.toLowerCase() === name.toLowerCase())) {
      setErrorMessage('A category with this name already exists.');
      return;
    }

    const defaultLogoForCat =
      editingCategory.id === 'cat-womens-wear'
        ? '/images/aniq-1.png'
        : editingCategory.id === 'cat-home-decor'
        ? '/images/aniq-2.png'
        : '/images/aniq-logo.png';

    const updatedCat: CategoryData = {
      ...editingCategory,
      name,
      description: editingCategory.description !== undefined ? editingCategory.description.trim() : '',
      logo: editingCategory.logo?.trim() || defaultLogoForCat,
      heroImage: editingCategory.heroImage?.trim() || '',
      hideFromHome: Boolean(editingCategory.hideFromHome),
      tag: editingCategory.tag?.trim() || ''
    };

    onCategorySavedLocally(updatedCat);
    setEditingCategory(null);

    const res = await saveCategoryToDb(updatedCat);
    if (res.success) {
      setStatusNotice(`Category "${updatedCat.name}" updated successfully`);
      setTimeout(() => setStatusNotice(''), 3000);
    } else if (res.error) {
      setErrorMessage(res.error);
    }
  };

  const handleMoveCategory = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= categories.length) return;
    const reordered = [...categories];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    // Update order indices
    const updated = reordered.map((cat, idx) => ({ ...cat, order: idx }));
    updated.forEach((cat) => onCategorySavedLocally(cat));

    setStatusNotice('Category order updated');
    setTimeout(() => setStatusNotice(''), 3000);

    // Save to Firestore
    try {
      await Promise.all(updated.map((cat) => saveCategoryToDb(cat)));
    } catch {
      // offline fallback
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

  const handleMoveBannerSlide = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= localBannerSlides.length) return;
    const nextSlides = [...localBannerSlides];
    const [moved] = nextSlides.splice(fromIndex, 1);
    nextSlides.splice(toIndex, 0, moved);
    setLocalBannerSlides(nextSlides);
    setStatusNotice(`Slide moved to position ${toIndex + 1}. Click 'Save Banner' to confirm.`);
    setTimeout(() => setStatusNotice(''), 3000);
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
            next[index].subtitle = formatBDT(prod.price);
            next[index].buttonText = 'Shop Now';
            next[index].linkUrl = `/product/${prod.id}`;
            next[index].hideButton = false;
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
      try {
        localStorage.setItem('aniq_cached_banner_slides', JSON.stringify(localBannerSlides));
      } catch {
        // fallback
      }
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

  // Promo Codes Actions
  const handleOpenNewPromo = () => {
    setEditingPromo(null);
    setPromoFormData({
      code: '',
      discountType: 'percentage',
      discountValue: 10,
      hasMinOrder: false,
      minOrderAmount: 0,
      active: true
    });
    setIsPromoFormOpen(true);
  };

  const handleOpenEditPromo = (promo: PromoCode) => {
    setEditingPromo(promo);
    setPromoFormData({
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      hasMinOrder: promo.hasMinOrder ?? ((promo.minOrderAmount || 0) > 0),
      minOrderAmount: promo.minOrderAmount || 0,
      active: promo.active !== false
    });
    setIsPromoFormOpen(true);
  };

  const handleSavePromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = promoFormData.code.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage('Promo code name is required');
      return;
    }

    const promo: PromoCode = {
      id: editingPromo ? editingPromo.id : `promo-${Date.now()}`,
      code: cleanCode,
      discountType: promoFormData.discountType,
      discountValue: Number(promoFormData.discountValue) || 0,
      hasMinOrder: promoFormData.hasMinOrder,
      minOrderAmount: promoFormData.hasMinOrder ? Number(promoFormData.minOrderAmount) || 0 : 0,
      active: promoFormData.active,
      createdAt: editingPromo?.createdAt || new Date().toISOString()
    };

    const res = await savePromoCodeToDb(promo);
    if (res.success) {
      setIsPromoFormOpen(false);
      setEditingPromo(null);
      setStatusNotice(`Promo code ${promo.code} saved successfully`);
      setTimeout(() => setStatusNotice(''), 3000);
    } else {
      setErrorMessage(res.error || 'Failed to save promo code');
    }
  };

  const executeDeletePromoCode = async (promoId: string) => {
    const res = await deletePromoCodeFromDb(promoId);
    if (res.success) {
      setStatusNotice('Promo code deleted from database');
      setTimeout(() => setStatusNotice(''), 3000);
    } else {
      setErrorMessage(res.error || 'Failed to delete promo code');
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
      'District',
      'Sub District / Thana',
      'Delivery Zone',
      'Shipping Address',
      'Payment Method',
      'bKash Number',
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
      `"${(o.district || o.city || '').replace(/"/g, '""')}"`,
      `"${(o.subDistrict || '').replace(/"/g, '""')}"`,
      `"${(o.deliveryZone || '').replace(/"/g, '""')}"`,
      `"${(o.shippingAddress || `${o.street}, ${o.city}, ${o.country}`).replace(/"/g, '""')}"`,
      `"${o.paymentMethod || 'Cash on Delivery'}"`,
      `"${(o.bkashNumber || '').replace(/"/g, '""')}"`,
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
    <div className="h-screen w-full overflow-hidden bg-stone-100 flex flex-row font-sans relative">
      {/* 1. DESKTOP & TABLET NARROW ICON RAIL (Like ChatGPT) */}
      <aside className="hidden md:flex w-16 bg-neutral-950 text-white flex-col justify-between items-center py-4 shrink-0 border-r border-neutral-800 z-30 h-screen select-none">
        <div className="flex flex-col items-center gap-3 w-full">
          {/* Top Three-Line Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
            className="p-3 text-neutral-300 hover:text-white hover:bg-neutral-900 rounded-xl transition-all cursor-pointer group"
            title="Expand Navigation Menu"
            aria-label="Expand menu"
          >
            <Menu className="h-5 w-5 transition-transform group-hover:scale-110" />
          </button>

          <div className="w-8 h-px bg-neutral-800/80" />

          {/* Quick Icon List */}
          <nav className="flex flex-col items-center gap-1.5 w-full px-2" aria-label="Quick Navigation">
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                activeTab === 'products'
                  ? 'bg-white text-neutral-950 shadow-md font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
              title="Products"
            >
              <Package className="h-4.5 w-4.5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                activeTab === 'categories'
                  ? 'bg-white text-neutral-950 shadow-md font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
              title="Categories"
            >
              <Layers className="h-4.5 w-4.5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('catalogues')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                activeTab === 'catalogues'
                  ? 'bg-white text-neutral-950 shadow-md font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
              title="Catalogues"
            >
              <BookOpen className="h-4.5 w-4.5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('featured')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                activeTab === 'featured'
                  ? 'bg-white text-neutral-950 shadow-md font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
              title="Featured Homepage"
            >
              <Sparkles className="h-4.5 w-4.5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('banner')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                activeTab === 'banner'
                  ? 'bg-white text-neutral-950 shadow-md font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
              title="Banner Ads"
            >
              <Layout className="h-4.5 w-4.5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('announcements')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                activeTab === 'announcements'
                  ? 'bg-white text-neutral-950 shadow-md font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
              title="News & Offers"
            >
              <Megaphone className="h-4.5 w-4.5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('promocodes')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                activeTab === 'promocodes'
                  ? 'bg-white text-neutral-950 shadow-md font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
              title="Promo Codes"
            >
              <Tag className="h-4.5 w-4.5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('messages')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                activeTab === 'messages'
                  ? 'bg-white text-neutral-950 shadow-md font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
              title="Messages"
            >
              <Mail className="h-4.5 w-4.5" />
              {contactMessages.filter((m) => !m.read).length > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                activeTab === 'orders'
                  ? 'bg-white text-neutral-950 shadow-md font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
              title="Orders"
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              {orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled').length > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-400" />
              )}
            </button>
          </nav>
        </div>

        {/* Bottom Logout Button in Icon Strip */}
        <div className="flex flex-col items-center gap-3 w-full pb-2">
          <div className="w-8 h-px bg-neutral-800/80" />
          <button
            type="button"
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-400 hover:text-red-400 hover:bg-neutral-900 transition-colors cursor-pointer"
            title="Sign Out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* 2. THREE-LINE SLIDE DRAWER (Opens when 3-line hamburger menu is clicked) */}
      {/* Backdrop Overlay */}
      <div
        onClick={() => setIsAdminMenuOpen(false)}
        className={`fixed inset-0 bg-neutral-950/60 backdrop-blur-xs z-50 transition-opacity duration-300 ${
          isAdminMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!isAdminMenuOpen}
      />

      {/* Sliding Aside Menu */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-neutral-950 text-white flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out border-r border-neutral-800 ${
          isAdminMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {/* Logo, Admin Branding & Close X Button */}
          <div className="pb-5 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex flex-col">
              <Logo variant="dark" size="sm" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 mt-1">
                Admin
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsAdminMenuOpen(false)}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-xl transition-colors cursor-pointer"
              aria-label="Close menu"
              title="Close Menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Vertical Navigation Tabs */}
          <nav className="mt-6 space-y-1.5" aria-label="Admin Navigation">
            <button
              type="button"
              onClick={() => {
                setActiveTab('products');
                setIsAdminMenuOpen(false);
              }}
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
              onClick={() => {
                setActiveTab('categories');
                setIsAdminMenuOpen(false);
              }}
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
              onClick={() => {
                setActiveTab('catalogues');
                setIsAdminMenuOpen(false);
              }}
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
              onClick={() => {
                setActiveTab('featured');
                setIsAdminMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'featured'
                  ? 'bg-white text-neutral-950 shadow-md font-extrabold'
                  : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4" />
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
              onClick={() => {
                setActiveTab('banner');
                setIsAdminMenuOpen(false);
              }}
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
              onClick={() => {
                setActiveTab('announcements');
                setIsAdminMenuOpen(false);
              }}
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
              onClick={() => {
                setActiveTab('promocodes');
                setIsAdminMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'promocodes'
                  ? 'bg-white text-neutral-950 shadow-md font-extrabold'
                  : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Tag className="h-4 w-4" />
                <span>Promo Codes</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeTab === 'promocodes' ? 'bg-neutral-950 text-white' : 'bg-neutral-800 text-neutral-300'
              }`}>
                {promoCodesList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('messages');
                setIsAdminMenuOpen(false);
              }}
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
              onClick={() => {
                setActiveTab('orders');
                setIsAdminMenuOpen(false);
              }}
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
              onClick={() => setIsLogoutModalOpen(true)}
              className="p-2 text-neutral-400 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Sign Out of Admin"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 3. MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* TOP HEADER */}
        <header className="bg-white border-b border-stone-200 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 shrink-0 shadow-2xs z-20">
          <div className="flex items-center gap-3">
            {/* THREE-LINE HAMBURGER BUTTON (Mobile only, since desktop & tablet have the icon rail) */}
            <button
              type="button"
              onClick={() => setIsAdminMenuOpen(true)}
              className="p-2 rounded-xl bg-stone-100 hover:bg-neutral-900 hover:text-white text-neutral-800 border border-stone-200/80 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
              <span className="text-xs font-bold">Menu</span>
            </button>

            {/* Current Section Title */}
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-bold text-base sm:text-lg text-neutral-900 capitalize">
                {activeTab === 'featured'
                  ? 'Featured Homepage'
                  : activeTab === 'announcements'
                  ? 'News & Offers'
                  : activeTab === 'messages'
                  ? 'Contact Messages'
                  : activeTab === 'banner'
                  ? 'Banner Ads'
                  : activeTab}
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md border border-stone-200/60 hidden sm:inline-block">
                Admin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-red-600 hover:bg-red-50 rounded-xl border border-stone-200 transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* MAIN CONTENT SCROLL AREA */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
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
                              <div className="flex flex-col gap-1 items-start">
                                <button
                                  type="button"
                                  onClick={() => handleToggleProductStock(p)}
                                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all border ${
                                    p.inStock
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                      : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                                  }`}
                                  title="Click to toggle In Stock / Out of Stock"
                                >
                                  {p.inStock ? '● In Stock' : '○ Out of Stock'}
                                </button>
                                {p.archived && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                                    Archived
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleProductStock(p)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer text-xs font-semibold ${
                                    p.inStock
                                      ? 'text-stone-600 hover:bg-stone-100 hover:text-neutral-900'
                                      : 'text-emerald-700 hover:bg-emerald-50'
                                  }`}
                                  title={p.inStock ? 'Mark as Out of Stock' : 'Mark as In Stock'}
                                >
                                  <span className="text-[11px] font-bold">{p.inStock ? 'Out' : 'In'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleProductArchive(p)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    p.archived
                                      ? 'text-amber-600 hover:bg-amber-50 hover:text-amber-800'
                                      : 'text-stone-500 hover:bg-stone-100 hover:text-neutral-900'
                                  }`}
                                  title={p.archived ? 'Unarchive Product' : 'Archive Product'}
                                >
                                  <Archive className="h-4 w-4" />
                                </button>
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
                            value={formData.category || (categories[0]?.name || "Elegant Women's Wear")}
                            onChange={(e) => {
                              const catName = e.target.value;
                              const currentCategoryCatalogues = catalogues.filter((c) => c.category === catName);
                              const isCurrentStillValid = currentCategoryCatalogues.some((c) => c.id === formData.catalogueId);
                              setFormData({
                                ...formData,
                                category: catName,
                                catalogueId: isCurrentStillValid ? formData.catalogueId : '',
                                catalogueName: isCurrentStillValid ? formData.catalogueName : ''
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
                            Catalogue / Collection
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
                            {catalogues
                              .filter((catg) => catg.category === (formData.category || categories[0]?.name))
                              .map((catg) => (
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
                          Description *
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={formData.description || ''}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.inStock !== false}
                            onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                            className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900 accent-neutral-900"
                          />
                          <div>
                            <span className="text-xs font-bold text-neutral-900 block">In Stock</span>
                            <span className="text-[11px] text-stone-500">Uncheck to mark as Out of Stock in store</span>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(formData.archived)}
                            onChange={(e) => setFormData({ ...formData, archived: e.target.checked })}
                            className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900 accent-neutral-900"
                          />
                          <div>
                            <span className="text-xs font-bold text-neutral-900 block">Archive Product</span>
                            <span className="text-[11px] text-stone-500">Hides product from customer catalogs without deleting</span>
                          </div>
                        </label>
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

          {/* TAB 2: Categories Management (No subcategories) */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-stone-100">
                  <div>
                    <h3 className="font-heading font-bold text-lg text-neutral-900">
                      Store Categories ({categories.length}/5)
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Manage primary store categories. Each category can have its own dedicated catalogues and collections.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAddCategory} className="flex gap-3 max-w-lg mb-6">
                  <input
                    type="text"
                    placeholder="New category name (e.g. Pret Collection, Formal Wear)..."
                    value={newCategoryName}
                    disabled={categories.length >= 5}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 bg-white border border-stone-300 rounded-xl px-4 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                  <button
                    type="submit"
                    disabled={categories.length >= 5 || !newCategoryName.trim()}
                    className="bg-neutral-900 hover:bg-neutral-800 disabled:bg-stone-300 text-white font-bold text-xs px-5 py-2 rounded-xl cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    Add Category
                  </button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((cat, cIdx) => {
                    const catProductsCount = products.filter((p) => p.category === cat.name).length;
                    const catCataloguesCount = catalogues.filter((c) => c.category === cat.name).length;
                    const catLogo =
                      cat.logo ||
                      (cat.id === 'cat-womens-wear'
                        ? '/images/aniq-1.png'
                        : cat.id === 'cat-home-decor'
                        ? '/images/aniq-2.png'
                        : '/images/aniq-logo.png');

                    return (
                      <div
                        key={cat.id}
                        className="bg-stone-50 rounded-2xl p-5 border border-stone-200 flex flex-col justify-between shadow-xs hover:border-neutral-400 transition-colors"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {catLogo ? (
                                <div
                                  onClick={() =>
                                    setEditingCategory({
                                      ...cat,
                                      logo: catLogo || ''
                                    })
                                  }
                                  className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-xs cursor-pointer hover:border-neutral-900 transition-colors"
                                  title="Click to edit/change logo"
                                >
                                  <img
                                    src={catLogo}
                                    alt={cat.name}
                                    className="max-h-full max-w-full object-contain mix-blend-multiply"
                                  />
                                </div>
                              ) : (
                                <div
                                  onClick={() =>
                                    setEditingCategory({
                                      ...cat,
                                      logo: catLogo || ''
                                    })
                                  }
                                  className="w-10 h-10 rounded-xl bg-stone-200 flex items-center justify-center text-stone-500 shrink-0 cursor-pointer hover:bg-stone-300 transition-colors"
                                  title="Click to upload logo"
                                >
                                  <Layers className="h-5 w-5" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-heading font-bold text-sm sm:text-base text-neutral-900 truncate">
                                    {cat.name}
                                  </h4>
                                  {cat.tag && (
                                    <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                                      {cat.tag}
                                    </span>
                                  )}
                                  {cat.hideFromHome && (
                                    <span className="text-[9px] font-medium bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded border border-stone-200">
                                      Hidden on Home
                                    </span>
                                  )}
                                  {cat.locked && (
                                    <span className="text-[9px] font-bold uppercase tracking-wider bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded">
                                      Default
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Sequence Move Controls */}
                              <div className="flex items-center bg-white rounded-lg border border-stone-200 p-0.5 gap-0.5 shadow-2xs">
                                <button
                                  type="button"
                                  disabled={cIdx === 0}
                                  onClick={() => handleMoveCategory(cIdx, cIdx - 1)}
                                  className="p-1 text-stone-500 hover:text-neutral-900 disabled:opacity-20 disabled:cursor-not-allowed rounded hover:bg-stone-100 transition-colors cursor-pointer"
                                  title="Move Left / Earlier"
                                  aria-label="Move category left"
                                >
                                  <ArrowLeft className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={cIdx === categories.length - 1}
                                  onClick={() => handleMoveCategory(cIdx, cIdx + 1)}
                                  className="p-1 text-stone-500 hover:text-neutral-900 disabled:opacity-20 disabled:cursor-not-allowed rounded hover:bg-stone-100 transition-colors cursor-pointer"
                                  title="Move Right / Later"
                                  aria-label="Move category right"
                                >
                                  <ArrowRight className="h-3 w-3" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  setEditingCategory({
                                    ...cat,
                                    logo: catLogo || ''
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:text-neutral-900 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg cursor-pointer transition-colors shadow-2xs"
                                title="Edit Category & Logo"
                              >
                                <Edit2 className="h-3 w-3" />
                                <span className="hidden sm:inline">Edit</span>
                              </button>
                            </div>
                          </div>

                          {cat.description && (
                            <p className="text-[11px] text-stone-500 line-clamp-2 italic mb-3 leading-relaxed">
                              "{cat.description}"
                            </p>
                          )}

                          <div className="space-y-1 text-xs text-stone-600 mb-4">
                            <div className="flex items-center justify-between">
                              <span className="text-stone-500">Catalogues / Collections:</span>
                              <span className="font-bold text-neutral-900 tabular-nums">{catCataloguesCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-stone-500">Products assigned:</span>
                              <span className="font-bold text-neutral-900 tabular-nums">{catProductsCount}</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCatalogueCategoryFilter(cat.name);
                              setActiveTab('catalogues');
                            }}
                            className="text-xs font-bold text-neutral-900 hover:text-stone-600 cursor-pointer flex items-center gap-1"
                          >
                            <span>Manage Catalogues</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>

                          {!cat.locked && categories.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmModal({ type: 'category', id: cat.id, name: cat.name })}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Catalogues Management (Organized by Category, 16:9 cards, No IDs shown) */}
          {activeTab === 'catalogues' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <div>
                  <h3 className="font-heading font-bold text-lg text-neutral-900">
                    Product Catalogues & Collections
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Pre-add designer catalogues and collections for each category in 16:9 banner format.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedCatalogueCategoryFilter !== 'All') {
                      setCatalogueFormData({
                        name: '',
                        category: selectedCatalogueCategoryFilter,
                        description: '',
                        image: ''
                      });
                    }
                    openNewCatalogueForm();
                  }}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Catalogue</span>
                </button>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedCatalogueCategoryFilter('All')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCatalogueCategoryFilter === 'All'
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  All Categories ({catalogues.length})
                </button>
                {categories.map((cat) => {
                  const count = catalogues.filter((c) => c.category === cat.name).length;
                  const isSelected = selectedCatalogueCategoryFilter === cat.name;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCatalogueCategoryFilter(cat.name)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-neutral-900 text-white shadow-xs'
                          : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {cat.name} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Catalogues Cards Grid - 16:9 Aspect Ratio, No ID shown */}
              {(() => {
                const displayedCatalogues =
                  selectedCatalogueCategoryFilter === 'All'
                    ? catalogues
                    : catalogues.filter((c) => c.category === selectedCatalogueCategoryFilter);

                if (displayedCatalogues.length === 0) {
                  return (
                    <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
                      <BookOpen className="h-10 w-10 text-stone-300 mx-auto mb-2" />
                      <h4 className="font-heading font-bold text-sm text-neutral-900 mb-1">
                        No Catalogues Found
                      </h4>
                      <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
                        {selectedCatalogueCategoryFilter === 'All'
                          ? 'No catalogues have been created yet. Click "Add Catalogue" to create one.'
                          : `No catalogues created for "${selectedCatalogueCategoryFilter}". Add one for this category.`}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedCatalogueCategoryFilter !== 'All') {
                            setCatalogueFormData({
                              name: '',
                              category: selectedCatalogueCategoryFilter,
                              description: '',
                              image: ''
                            });
                          }
                          openNewCatalogueForm();
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 text-white text-xs font-bold rounded-xl"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Catalogue for {selectedCatalogueCategoryFilter === 'All' ? 'Store' : selectedCatalogueCategoryFilter}</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {displayedCatalogues.map((catg) => {
                      const assignedCount = products.filter(
                        (p) => p.catalogueId === catg.id || p.catalogueName === catg.name
                      ).length;
                      return (
                        <div
                          key={catg.id}
                          className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs flex flex-col justify-between"
                        >
                          {/* 16:9 Aspect Ratio Container */}
                          <div className="relative aspect-video bg-stone-100 overflow-hidden">
                            <img
                              src={catg.image}
                              alt={catg.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] font-bold text-neutral-900 shadow-xs">
                              {assignedCount} Products
                            </div>
                            <div className="absolute bottom-2.5 left-2.5 bg-neutral-900/80 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] font-bold text-white shadow-xs">
                              {catg.category}
                            </div>
                          </div>

                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
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
                              <span className="text-[11px] font-medium text-stone-500">
                                16:9 Showcase
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
                );
              })()}

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
                          placeholder="e.g. Original Pakistani Lawn, Luxury Chiffon, Summer Khadi..."
                          value={catalogueFormData.name || ''}
                          onChange={(e) => setCatalogueFormData({ ...catalogueFormData, name: e.target.value })}
                          className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-800 mb-1">
                          Assign to Category *
                        </label>
                        <select
                          value={catalogueFormData.category || categories[0]?.name || "Elegant Women's Wear"}
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
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-neutral-800">
                            Cover Image (16:9 Banner Shape) *
                          </label>
                          <span className="text-[10px] text-stone-400">16:9 aspect ratio</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {catalogueFormData.image ? (
                            <img
                              src={catalogueFormData.image}
                              alt="Cover Preview"
                              className="w-24 aspect-video object-cover rounded-xl border border-stone-200 shrink-0"
                            />
                          ) : (
                            <div className="w-24 aspect-video rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 shrink-0 border border-dashed border-stone-300">
                              <ImageIcon className="h-5 w-5" />
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
                            <span>{catalogueFormData.image ? 'Change Photo (16:9)' : 'Upload Photo (16:9)'}</span>
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
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase text-stone-500 bg-white px-2 py-0.5 rounded border border-stone-200">
                            Slot {idx + 1}
                          </span>
                          <div className="flex items-center bg-white rounded-lg border border-stone-200 p-0.5 gap-0.5">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveFeaturedProduct(idx, idx - 1)}
                              className="p-1 text-stone-500 hover:text-neutral-900 disabled:opacity-20 disabled:cursor-not-allowed rounded hover:bg-stone-100 transition-colors cursor-pointer"
                              title="Move Left / Earlier"
                              aria-label="Move slot left"
                            >
                              <ArrowLeft className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === currentFeaturedProducts.length - 1}
                              onClick={() => handleMoveFeaturedProduct(idx, idx + 1)}
                              className="p-1 text-stone-500 hover:text-neutral-900 disabled:opacity-20 disabled:cursor-not-allowed rounded hover:bg-stone-100 transition-colors cursor-pointer"
                              title="Move Right / Later"
                              aria-label="Move slot right"
                            >
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

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
                  {localBannerSlides.map((slide, idx) => {
                    const isProductSlide = slide.type === 'product';

                    return (
                      <div
                        key={slide.id || idx}
                        className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-4 shadow-xs"
                      >
                        {/* Slide Header: Index + Re-order + Type Switcher + Remove */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-200 gap-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-heading font-extrabold text-sm text-neutral-900">
                              Slide {idx + 1}
                            </span>

                            {/* Move Up/Down Controls Only */}
                            <div className="flex items-center bg-stone-200/80 rounded-lg p-0.5 gap-0.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveBannerSlide(idx, idx - 1)}
                                className="p-1 text-stone-600 hover:text-neutral-900 disabled:opacity-25 disabled:cursor-not-allowed rounded hover:bg-white transition-colors cursor-pointer"
                                title="Move Slide Up (Earlier)"
                                aria-label="Move slide up"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === localBannerSlides.length - 1}
                                onClick={() => handleMoveBannerSlide(idx, idx + 1)}
                                className="p-1 text-stone-600 hover:text-neutral-900 disabled:opacity-25 disabled:cursor-not-allowed rounded hover:bg-white transition-colors cursor-pointer"
                                title="Move Slide Down (Later)"
                                aria-label="Move slide down"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div className="flex rounded-lg bg-stone-200/80 p-0.5 text-xs font-bold">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isProductSlide) {
                                    const firstProd = products[0];
                                    if (firstProd) {
                                      handleUpdateBannerSlide(idx, {
                                        type: 'product',
                                        productId: firstProd.id,
                                        image: firstProd.image,
                                        title: firstProd.name,
                                        subtitle: formatBDT(firstProd.price),
                                        buttonText: 'Shop Now',
                                        linkUrl: `/product/${firstProd.id}`,
                                        hideButton: false
                                      });
                                    } else {
                                      handleUpdateBannerSlide(idx, { type: 'product' });
                                    }
                                  }
                                }}
                                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                                  isProductSlide
                                    ? 'bg-white text-neutral-900 shadow-xs'
                                    : 'text-stone-600 hover:text-neutral-900'
                                }`}
                              >
                                Add From Product
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isProductSlide) {
                                    handleUpdateBannerSlide(idx, { type: 'custom' });
                                  }
                                }}
                                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                                  !isProductSlide
                                    ? 'bg-white text-neutral-900 shadow-xs'
                                    : 'text-stone-600 hover:text-neutral-900'
                                }`}
                              >
                                Custom Banner
                              </button>
                            </div>
                          </div>

                          {localBannerSlides.length > 2 && (
                            <button
                              type="button"
                              onClick={() => executeRemoveBanner(idx)}
                              className="text-xs text-red-500 hover:text-red-700 font-bold cursor-pointer self-end sm:self-auto"
                            >
                              Remove Slide
                            </button>
                          )}
                        </div>

                        {/* If Add From Product: Product Selector */}
                        {isProductSlide && (
                          <div className="bg-white p-3.5 rounded-xl border border-stone-200 space-y-2">
                            <label className="block text-xs font-bold text-neutral-800">
                              Select Product (Photo, Title, Price & Link will be auto-added)
                            </label>
                            <select
                              value={slide.productId || ''}
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                const prod = products.find((p) => p.id === selectedId);
                                if (prod) {
                                  handleUpdateBannerSlide(idx, {
                                    type: 'product',
                                    productId: prod.id,
                                    image: prod.image,
                                    title: prod.name,
                                    subtitle: formatBDT(prod.price),
                                    buttonText: 'Shop Now',
                                    linkUrl: `/product/${prod.id}`,
                                    hideButton: false
                                  });
                                }
                              }}
                              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-neutral-900 font-medium focus:outline-none focus:border-neutral-900"
                            >
                              <option value="">-- Choose a Product --</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} — {formatBDT(p.price)} ({p.category})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Slide Body: Image Preview + Customization Controls */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
                          {/* 16:9 Image Preview & Upload */}
                          <div className="sm:col-span-4 space-y-2">
                            <div className="relative aspect-video rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shadow-xs">
                              <img
                                src={slide.image}
                                alt={slide.title || 'Banner Preview'}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 left-2 bg-neutral-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                                16:9 Banner
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setCropperTarget({ type: 'banner', index: idx });
                                setIsCropperOpen(true);
                              }}
                              className="w-full bg-white hover:bg-stone-100 text-neutral-900 border border-stone-300 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                            >
                              <Upload className="h-3.5 w-3.5" />
                              <span>Replace Banner Photo (16:9)</span>
                            </button>
                          </div>

                          {/* Text, Buttons & Link Controls */}
                          <div className="sm:col-span-8 space-y-3">
                            {/* Visibility Checkboxes */}
                            <div className="flex flex-wrap items-center gap-4 p-2.5 bg-white rounded-xl border border-stone-200 text-xs font-semibold text-neutral-800">
                              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={slide.title === ''}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      handleUpdateBannerSlide(idx, { title: '' });
                                    } else {
                                      const defaultTitle = isProductSlide
                                        ? products.find((p) => p.id === slide.productId)?.name || 'Featured Product'
                                        : 'Exclusive Collection';
                                      handleUpdateBannerSlide(idx, { title: defaultTitle });
                                    }
                                  }}
                                  className="rounded border-stone-300 text-neutral-900 focus:ring-neutral-900"
                                />
                                <span>No Heading</span>
                              </label>

                              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={slide.subtitle === ''}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      handleUpdateBannerSlide(idx, { subtitle: '' });
                                    } else {
                                      const prod = products.find((p) => p.id === slide.productId);
                                      const defaultSub = isProductSlide && prod
                                        ? formatBDT(prod.price)
                                        : 'Handcrafted luxury fabrics & designer embroidery';
                                      handleUpdateBannerSlide(idx, { subtitle: defaultSub });
                                    }
                                  }}
                                  className="rounded border-stone-300 text-neutral-900 focus:ring-neutral-900"
                                />
                                <span>No Subtitle</span>
                              </label>

                              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={slide.hideButton === true}
                                  onChange={(e) =>
                                    handleUpdateBannerSlide(idx, { hideButton: e.target.checked })
                                  }
                                  className="rounded border-stone-300 text-neutral-900 focus:ring-neutral-900"
                                />
                                <span>No Button</span>
                              </label>

                              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={slide.noLinkOverBanner === true}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    handleUpdateBannerSlide(idx, {
                                      noLinkOverBanner: checked,
                                      hasLinkOverBanner: false,
                                      ...(checked ? { linkUrl: '' } : {})
                                    });
                                  }}
                                  className="rounded border-stone-300 text-neutral-900 focus:ring-neutral-900"
                                />
                                <span className="font-semibold text-neutral-800">No Link Over Banner</span>
                              </label>
                            </div>

                            {/* Status callout if all 4 are selected */}
                            {slide.title === '' && slide.subtitle === '' && slide.hideButton && slide.noLinkOverBanner && (
                              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                <span><strong>Pure Image Mode:</strong> Heading, subtitle, button, and banner link are all disabled. The banner will render purely as the clean un-tinted image.</span>
                              </div>
                            )}

                            {/* Heading (Title) Input */}
                            {slide.title !== '' && (
                              <div>
                                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                                  Heading (Title)
                                </label>
                                <input
                                  type="text"
                                  placeholder="Banner heading..."
                                  value={slide.title || ''}
                                  onChange={(e) => handleUpdateBannerSlide(idx, { title: e.target.value })}
                                  className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                                />
                              </div>
                            )}

                            {/* Subtitle Input */}
                            {slide.subtitle !== '' && (
                              <div>
                                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                                  Subtitle (or Price)
                                </label>
                                <input
                                  type="text"
                                  placeholder="Subtitle or price note..."
                                  value={slide.subtitle || ''}
                                  onChange={(e) => handleUpdateBannerSlide(idx, { subtitle: e.target.value })}
                                  className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                                />
                              </div>
                            )}

                            {/* Button Configuration */}
                            {!slide.hideButton && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                                    Button Text
                                  </label>
                                  <input
                                    type="text"
                                    value={slide.buttonText || (isProductSlide ? 'Shop Now' : 'Explore Collection')}
                                    onChange={(e) => handleUpdateBannerSlide(idx, { buttonText: e.target.value })}
                                    className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                                    Button Link URL
                                  </label>
                                  <input
                                    type="text"
                                    list="banner-url-presets"
                                    placeholder={slide.productId ? `/product/${slide.productId}` : 'e.g. /womens-wear, /home-decor, or /about'}
                                    value={slide.linkUrl || ''}
                                    onChange={(e) => handleUpdateBannerSlide(idx, { linkUrl: e.target.value })}
                                    className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Banner Link URL (when button is hidden AND No Link Over Banner is NOT checked) */}
                            {slide.hideButton && !slide.noLinkOverBanner && (
                              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
                                <label className="block text-[11px] font-bold text-amber-950 mb-1">
                                  Entire Banner Click URL
                                </label>
                                <input
                                  type="text"
                                  list="banner-url-presets"
                                  placeholder={slide.productId ? `/product/${slide.productId}` : 'e.g. /womens-wear, /home-decor, or /product/id'}
                                  value={slide.linkUrl || ''}
                                  onChange={(e) => handleUpdateBannerSlide(idx, { linkUrl: e.target.value })}
                                  className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                                />
                                <p className="text-[10px] text-amber-700 mt-1">
                                  Clicking anywhere on this banner slide on the storefront will open this destination.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Datalist for preset URL suggestions */}
                <datalist id="banner-url-presets">
                  <option value="/womens-wear">Women's Wear Collection</option>
                  <option value="/home-decor">Home Decor Collection</option>
                  <option value="/about">About Aniq</option>
                  <option value="/contact">Contact & Boutique Location</option>
                  <option value="/account">Customer Account / Track Orders</option>
                  {products.slice(0, 10).map((p) => (
                    <option key={p.id} value={`/product/${p.id}`}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </datalist>
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

          {/* TAB: Promo Codes */}
          {activeTab === 'promocodes' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-100">
                  <div>
                    <h3 className="font-heading font-bold text-lg text-neutral-900">
                      Promo Codes ({promoCodesList.length})
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Create promotional coupon codes with percentage discount, free/discounted delivery charge, or fixed BDT discount.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenNewPromo}
                    className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Promo Code</span>
                  </button>
                </div>

                {/* Promo Code Form Modal / Panel */}
                {isPromoFormOpen && (
                  <form onSubmit={handleSavePromoCode} className="mb-6 p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                      <h4 className="font-heading font-bold text-sm text-neutral-900">
                        {editingPromo ? 'Edit Promo Code' : 'New Promo Code'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsPromoFormOpen(false)}
                        className="p-1 text-stone-400 hover:text-neutral-900 rounded-lg cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Code */}
                      <div>
                        <label className="block text-xs font-bold text-neutral-800 mb-1">
                          Promo Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={promoFormData.code}
                          onChange={(e) => setPromoFormData({ ...promoFormData, code: e.target.value.toUpperCase() })}
                          placeholder="e.g. SUMMER10, FREEDEL"
                          className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs font-mono uppercase text-neutral-900 focus:outline-none focus:border-neutral-900"
                        />
                      </div>

                      {/* Discount Type */}
                      <div>
                        <label className="block text-xs font-bold text-neutral-800 mb-1">
                          Discount Type *
                        </label>
                        <select
                          value={promoFormData.discountType}
                          onChange={(e) => setPromoFormData({ ...promoFormData, discountType: e.target.value as 'percentage' | 'fixed' | 'delivery' })}
                          className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-900 cursor-pointer"
                        >
                          <option value="percentage">Percentage Discount (%)</option>
                          <option value="delivery">Delivery Charge Discount (Free/Off)</option>
                          <option value="fixed">Fixed Amount Discount (BDT)</option>
                        </select>
                      </div>

                      {/* Discount Value */}
                      <div>
                        <label className="block text-xs font-bold text-neutral-800 mb-1">
                          {promoFormData.discountType === 'percentage'
                            ? 'Discount Percentage (%)'
                            : promoFormData.discountType === 'delivery'
                            ? 'Delivery Off in BDT (0 for Free Delivery)'
                            : 'Fixed Discount Amount (BDT)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={promoFormData.discountType === 'percentage' ? 100 : 50000}
                          value={promoFormData.discountValue}
                          onChange={(e) => setPromoFormData({ ...promoFormData, discountValue: Number(e.target.value) })}
                          className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                        />
                      </div>
                    </div>

                    {/* Minimum Order Toggle & Amount */}
                    <div className="pt-2 border-t border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-800">
                          <input
                            type="checkbox"
                            checked={promoFormData.hasMinOrder}
                            onChange={(e) => setPromoFormData({ ...promoFormData, hasMinOrder: e.target.checked })}
                            className="rounded text-neutral-900 focus:ring-neutral-900 h-4 w-4"
                          />
                          <span>Set Minimum Order Requirement</span>
                        </label>

                        {promoFormData.hasMinOrder && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-stone-500 font-medium">Min BDT:</span>
                            <input
                              type="number"
                              min="0"
                              value={promoFormData.minOrderAmount}
                              onChange={(e) => setPromoFormData({ ...promoFormData, minOrderAmount: Number(e.target.value) })}
                              className="w-28 bg-white border border-stone-300 rounded-xl px-2.5 py-1 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                              placeholder="e.g. 5000"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-800">
                          <input
                            type="checkbox"
                            checked={promoFormData.active}
                            onChange={(e) => setPromoFormData({ ...promoFormData, active: e.target.checked })}
                            className="rounded text-neutral-900 focus:ring-neutral-900 h-4 w-4"
                          />
                          <span>Active</span>
                        </label>

                        <button
                          type="submit"
                          className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                        >
                          {editingPromo ? 'Update Code' : 'Save Code'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Promo Codes List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {promoCodesList.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                      <Tag className="h-8 w-8 text-stone-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-stone-600 mb-0.5">No promo codes created yet</p>
                      <p className="text-[11px] text-stone-400">Click "Create Promo Code" to launch your first discount coupon.</p>
                    </div>
                  ) : (
                    promoCodesList.map((promo) => (
                      <div
                        key={promo.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                          promo.active
                            ? 'bg-white border-stone-200 hover:border-neutral-900 shadow-2xs'
                            : 'bg-stone-50/80 border-stone-200 opacity-60'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-extrabold text-sm tracking-wider bg-stone-100 text-neutral-950 px-2.5 py-1 rounded-lg border border-stone-300">
                              {promo.code}
                            </span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              promo.active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                            }`}>
                              {promo.active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </div>

                          <div className="pt-1">
                            <p className="text-sm font-heading font-extrabold text-neutral-900">
                              {promo.discountType === 'percentage'
                                ? `${promo.discountValue}% Off Total Order`
                                : promo.discountType === 'delivery'
                                ? (promo.discountValue ? `${formatBDT(promo.discountValue)} Off Delivery Charge` : '100% Free Delivery Charge')
                                : `${formatBDT(promo.discountValue)} Flat Discount`}
                            </p>
                            <p className="text-[11px] text-stone-500 mt-0.5">
                              {promo.hasMinOrder && promo.minOrderAmount
                                ? `Min. Order: ${formatBDT(promo.minOrderAmount)}`
                                : 'No minimum order required'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPromo(promo)}
                            className="font-bold text-stone-700 hover:text-neutral-950 flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmModal({ type: 'promocode', id: promo.id, name: `Promo Code "${promo.code}"` })}
                            className="text-stone-400 hover:text-red-600 p-1 cursor-pointer"
                            title="Delete promo code"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
                        onClick={() => setOrdersFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          ordersFilter === 'all' ? 'bg-white text-neutral-900 shadow-xs' : 'text-stone-600 hover:text-neutral-900'
                        }`}
                      >
                        All ({orders.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrdersFilter('active')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          ordersFilter === 'active' ? 'bg-white text-neutral-900 shadow-xs' : 'text-stone-600 hover:text-neutral-900'
                        }`}
                      >
                        Active ({orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrdersFilter('history')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          ordersFilter === 'history' ? 'bg-white text-neutral-900 shadow-xs' : 'text-stone-600 hover:text-neutral-900'
                        }`}
                      >
                        History ({orders.filter((o) => o.status === 'Delivered' || o.status === 'Cancelled').length})
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

                            {/* Payment Method Badge */}
                            {(ord.paymentMethod === 'bKash' || ord.paymentMethod?.toLowerCase().includes('bkash')) ? (
                              <span className="text-xs font-bold bg-pink-50 text-[#e2136e] border border-pink-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 shadow-xs">
                                <span className="h-2 w-2 rounded-full bg-[#e2136e]" />
                                bKash {ord.bkashNumber ? `(${ord.bkashNumber})` : 'Payment'}
                              </span>
                            ) : (
                              <span className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 shadow-xs">
                                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                                Cash on Delivery
                              </span>
                            )}
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
                            {(ord.district || ord.subDistrict) && (
                              <p className="text-stone-600 font-medium pt-0.5">
                                Location: {ord.subDistrict ? `${ord.subDistrict}, ` : ''}{ord.district || ord.city}
                              </p>
                            )}
                            <p className="text-stone-600 pt-0.5">Address: {ord.shippingAddress}</p>
                          </div>

                          <div className="md:col-span-5 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase text-stone-400 block">Items ({(ord.items || []).length})</span>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {(ord.items || []).map((it, idx) => {
                                const colour = it.selectedColour || it.product?.selectedColour;
                                const size = it.selectedSize || it.product?.selectedSize;
                                return (
                                  <div key={idx} className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-stone-200 shadow-2xs">
                                    {it.product?.image && (
                                      <img
                                        src={it.product.image}
                                        alt={it.product.name || 'Product'}
                                        className="w-12 h-14 object-cover rounded-lg shrink-0 bg-stone-100 border border-stone-200/80"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="font-bold text-neutral-900 truncate text-xs">
                                        {it.product?.name}
                                      </p>
                                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                        <span className="text-[11px] font-bold text-neutral-700 bg-stone-100 px-1.5 py-0.5 rounded">
                                          Qty: {it.quantity || 1}
                                        </span>
                                        {colour && (
                                          <span className="text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded">
                                            Colour: {colour}
                                          </span>
                                        )}
                                        {size && (
                                          <span className="text-[11px] font-medium bg-blue-50 text-blue-900 border border-blue-200 px-1.5 py-0.5 rounded">
                                            Size: {size}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <span className="font-heading font-bold tabular-nums text-xs text-neutral-900 shrink-0">
                                      {formatBDT((it.product?.price || 0) * (it.quantity || 1))}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="md:col-span-3 flex flex-col justify-between border-t md:border-t-0 md:border-l border-stone-200 pt-3 md:pt-0 md:pl-4">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase text-stone-400 block">Summary & Payment</span>
                              <div className="flex justify-between text-stone-600">
                                <span>Subtotal</span>
                                <span>{formatBDT(ord.subtotal || ord.total)}</span>
                              </div>
                              <div className="flex justify-between text-stone-600">
                                <span>Shipping {ord.deliveryZone ? `(${ord.deliveryZone === 'Inside Dhaka City' ? 'Dhaka' : 'Outside'})` : ''}</span>
                                <span>{ord.shipping === 0 ? 'Free' : formatBDT(ord.shipping || 0)}</span>
                              </div>
                              <div className="flex justify-between text-stone-700 pt-1 border-t border-stone-100">
                                <span className="font-semibold">Payment</span>
                                <span className="font-bold text-neutral-900">{ord.paymentMethod || 'Cash on Delivery'}</span>
                              </div>
                              {ord.bkashNumber && (
                                <div className="flex justify-between text-[11px] text-[#e2136e] font-medium">
                                  <span>bKash Sender</span>
                                  <span className="font-mono">{ord.bkashNumber}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-bold text-neutral-900 pt-1 border-t border-stone-200 text-sm">
                                <span>Total</span>
                                <span className="tabular-nums font-heading">{formatBDT(ord.total)}</span>
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
      </div>

      {/* Image Cropper Modal */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        onCropComplete={handleCropComplete}
        aspectRatio={
          cropperTarget.type === 'banner' || cropperTarget.type === 'catalogue' || cropperTarget.type === 'category-hero'
            ? 16 / 9
            : cropperTarget.type === 'category' || cropperTarget.type === 'category-edit'
            ? 1
            : 3 / 4
        }
      />

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-neutral-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-heading font-extrabold text-lg text-neutral-900">
                Edit Category
              </h3>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="p-1.5 text-stone-400 hover:text-neutral-900 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-neutral-800">
                    Category Page Description
                  </label>
                  <span className="text-[10px] text-stone-500">
                    Shown under heading on category page
                  </span>
                </div>
                <textarea
                  rows={3}
                  placeholder="Enter a descriptive subtitle/introduction for this category page..."
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Category Logo
                </label>
                <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  {editingCategory.logo ? (
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-white border border-stone-200 shrink-0 flex items-center justify-center p-1">
                      <img
                        src={editingCategory.logo}
                        alt="Logo"
                        className="max-h-full max-w-full object-contain mix-blend-multiply"
                      />
                      <button
                        type="button"
                        onClick={() => setEditingCategory({ ...editingCategory, logo: '' })}
                        className="absolute -top-1 -right-1 bg-neutral-900 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                        title="Remove custom logo (reverts to default ANIQ logo)"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-white border border-dashed border-stone-300 shrink-0 flex items-center justify-center p-1" title="Default ANIQ Logo">
                      <img
                        src={
                          editingCategory.id === 'cat-womens-wear'
                            ? '/images/aniq-1.png'
                            : editingCategory.id === 'cat-home-decor'
                            ? '/images/aniq-2.png'
                            : '/images/aniq-logo.png'
                        }
                        alt="Default ANIQ Logo"
                        className="max-h-full max-w-full object-contain opacity-60 mix-blend-multiply"
                      />
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCropperTarget({ type: 'category-edit' });
                        setIsCropperOpen(true);
                      }}
                      className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{editingCategory.logo ? 'Change Photo' : 'Upload Photo'}</span>
                    </button>
                    <input
                      type="text"
                      placeholder="Or paste image URL..."
                      value={editingCategory.logo || ''}
                      onChange={(e) => setEditingCategory({ ...editingCategory, logo: e.target.value })}
                      className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-[11px] text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Category Page Hero Cover Photo (16:9)
                </label>
                <div className="space-y-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  {editingCategory.heroImage ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-white border border-stone-200">
                      <img
                        src={editingCategory.heroImage}
                        alt="Hero Cover"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setEditingCategory({ ...editingCategory, heroImage: '' })}
                        className="absolute top-1.5 right-1.5 bg-neutral-900/80 hover:bg-red-600 text-white rounded-full p-1 transition-colors cursor-pointer"
                        title="Remove custom cover photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="aspect-video rounded-lg border border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400 p-2 text-center bg-white">
                      <ImageIcon className="h-6 w-6 mb-1 text-stone-300" />
                      <span className="text-[11px]">Using default cover photo</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCropperTarget({ type: 'category-hero' });
                        setIsCropperOpen(true);
                      }}
                      className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{editingCategory.heroImage ? 'Change Cover' : 'Upload Cover'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Or paste cover image URL..."
                    value={editingCategory.heroImage || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, heroImage: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-[11px] text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              {/* Tag option & Hide from Homepage Thumbnail toggle */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Badge / Tag (e.g. 'NEW', 'SALE', 'TRENDING')
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NEW (leave blank for none)"
                    value={editingCategory.tag || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, tag: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    Displays an eye-catching tag badge on this category in the navigation menu and cards.
                  </p>
                </div>

                {!editingCategory.locked && (
                  <div className="pt-2 border-t border-stone-200/80">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(editingCategory.hideFromHome)}
                        onChange={(e) =>
                          setEditingCategory({
                            ...editingCategory,
                            hideFromHome: e.target.checked
                          })
                        }
                        className="h-4 w-4 rounded border-stone-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-neutral-900 block">
                          Hide only from homepage thumbnails
                        </span>
                        <span className="text-[11px] text-stone-500 block">
                          Category will remain active and fully visible in the navigation and left menu, but hidden from the homepage grid.
                        </span>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-stone-100 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 font-semibold rounded-xl text-xs hover:bg-stone-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 text-white font-bold rounded-xl text-xs hover:bg-neutral-800 cursor-pointer shadow-md"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  } else if (target.type === 'promocode') {
                    await executeDeletePromoCode(target.id);
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

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <LogOut className="h-6 w-6" />
            </div>
            <h3 className="font-heading font-bold text-lg text-neutral-900 mb-1.5">
              Confirm Sign Out
            </h3>
            <p className="text-xs text-stone-500 mb-6 leading-relaxed">
              Are you sure you want to sign out of the Admin Portal?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-neutral-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  handleAdminLogout();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
