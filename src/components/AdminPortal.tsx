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
  Sparkles
} from 'lucide-react';
import { Product, CategoryData } from '../types';
import { formatBDT } from '../utils/format';
import { ADMIN_CREDENTIALS } from '../config/adminAuth';
import { ImageCropperModal } from './ImageCropperModal';
import {
  saveProductToDb,
  deleteProductFromDb,
  saveCategoryToDb,
  deleteCategoryFromDb,
  saveBannerSettings
} from '../services/storeService';

interface AdminPortalProps {
  onNavigateToStore: () => void;
  products: Product[];
  categories: CategoryData[];
  bannerProductIds: string[];
  onBannerProductIdsChange?: (ids: string[]) => void;
  onProductSavedLocally: (product: Product) => void;
  onProductDeletedLocally: (productId: string) => void;
  onCategorySavedLocally: (category: CategoryData) => void;
  onCategoryDeletedLocally: (categoryId: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  onNavigateToStore,
  products,
  categories,
  bannerProductIds,
  onBannerProductIdsChange,
  onProductSavedLocally,
  onProductDeletedLocally,
  onCategorySavedLocally,
  onCategoryDeletedLocally
}) => {
  // Admin authentication state based on hardcoded credentials
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

  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'banner'>('products');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Banner selection state for exactly 3 products
  const [selectedBannerIds, setSelectedBannerIds] = useState<string[]>(() => {
    if (bannerProductIds && bannerProductIds.length >= 3) {
      return bannerProductIds.slice(0, 3);
    }
    return products.slice(0, 3).map((p) => p.id);
  });
  const [isSavingBanner, setIsSavingBanner] = useState(false);

  useEffect(() => {
    if (bannerProductIds && bannerProductIds.length > 0) {
      setSelectedBannerIds(bannerProductIds.slice(0, 3));
    } else if (products.length >= 3 && selectedBannerIds.length < 3) {
      setSelectedBannerIds(products.slice(0, 3).map((p) => p.id));
    }
  }, [bannerProductIds, products]);

  // Product form state
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: categories[0]?.name || 'Audio',
    subcategory: '',
    price: 10000,
    description: '',
    details: '',
    image: '',
    inStock: true
  });

  // Category form state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCatForSub, setSelectedCatForSub] = useState<string>(categories[0]?.id || '');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [statusNotice, setStatusNotice] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (
      usernameInput.trim() === ADMIN_CREDENTIALS.username &&
      passwordInput.trim() === ADMIN_CREDENTIALS.password
    ) {
      setIsAdminLoggedIn(true);
      try {
        localStorage.setItem('maison_admin_session', 'active');
      } catch {
        // fallback
      }
      setUsernameInput('');
      setPasswordInput('');
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

  const openNewProductForm = () => {
    setEditingProduct(null);
    setFormData({
      id: `prod-${Date.now()}`,
      name: '',
      category: categories[0]?.name || 'Audio',
      subcategory: categories[0]?.subcategories[0] || '',
      price: 15000,
      description: '',
      details: '',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
      specs: [{ label: 'Origin', value: 'Imported' }],
      inStock: true,
      rating: 0,
      reviewsCount: 0
    });
    setIsProductFormOpen(true);
  };

  const openEditProductForm = (product: Product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setIsProductFormOpen(true);
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    setFormData((prev) => ({ ...prev, image: croppedDataUrl }));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!formData.name || !formData.category || !formData.price || !formData.image) return;

    const targetProduct: Product = {
      id: editingProduct ? editingProduct.id : formData.id || `prod-${Date.now()}`,
      name: formData.name,
      category: formData.category,
      subcategory: formData.subcategory || '',
      price: Number(formData.price),
      description: formData.description || '',
      details: formData.details || formData.description || '',
      specs: formData.specs || [{ label: 'Quality', value: 'Premium Grade' }],
      image: formData.image,
      inStock: formData.inStock ?? true,
      rating: editingProduct ? editingProduct.rating : 5.0,
      reviewsCount: editingProduct ? editingProduct.reviewsCount : 1
    };

    onProductSavedLocally(targetProduct);
    setIsProductFormOpen(false);

    const res = await saveProductToDb(targetProduct);
    if (res.success) {
      setStatusNotice(editingProduct ? 'Product updated in live database' : 'Product published to live database');
      setTimeout(() => setStatusNotice(''), 3000);
    } else if (res.error) {
      setErrorMessage(res.error);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    setErrorMessage('');

    onProductDeletedLocally(id);

    const res = await deleteProductFromDb(id);
    if (res.success) {
      setStatusNotice('Product removed from live database');
      setTimeout(() => setStatusNotice(''), 3000);
    } else if (res.error) {
      setErrorMessage(res.error);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const name = newCategoryName.trim();
    if (!name) return;

    const newCat: CategoryData = {
      id: `cat-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
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

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
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

  const handleBannerSlotChange = (slotIndex: number, newProductId: string) => {
    setSelectedBannerIds((prev) => {
      const next = [...prev];
      next[slotIndex] = newProductId;
      return next;
    });
  };

  const handleSaveBannerSelection = async () => {
    setErrorMessage('');
    setIsSavingBanner(true);
    const res = await saveBannerSettings(selectedBannerIds);
    setIsSavingBanner(false);
    if (res.success) {
      setStatusNotice('Banner advertisement selection saved to live database');
      onBannerProductIdsChange?.(selectedBannerIds);
      setTimeout(() => setStatusNotice(''), 3500);
    } else {
      setErrorMessage(res.error || 'Failed to save banner selection');
    }
  };

  const currentCategoryObj = categories.find((c) => c.name === formData.category);
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.category.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans">
      {/* Top Standalone Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-xl text-neutral-900">
                Admin Portal
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdminLoggedIn && (
              <div className="flex items-center gap-2">
                <span className="text-xs bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded-lg font-mono font-bold">
                  {ADMIN_CREDENTIALS.username}
                </span>
                <button
                  onClick={handleAdminLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 text-xs font-semibold cursor-pointer"
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

      {/* Main Page Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {!isAdminLoggedIn ? (
          /* Separate Login Page View */
          <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm flex flex-col items-center">
            <div className="h-14 w-14 rounded-2xl bg-neutral-900 text-white flex items-center justify-center mb-5 shadow-xs">
              <Lock className="h-7 w-7" />
            </div>
            <h2 className="font-heading font-extrabold text-2xl text-neutral-900 mb-6 text-center">
              Owner Sign In
            </h2>

            <form onSubmit={handleAdminLogin} className="w-full space-y-4">
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
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
                  className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2.5 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 shadow-xs"
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
                  className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2.5 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 shadow-xs"
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
          /* Separate Admin Dashboard View */
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
            {/* Tab Navigation */}
            <div className="px-6 pt-5 border-b border-neutral-200 flex gap-6 bg-neutral-50/50">
              <button
                onClick={() => setActiveTab('products')}
                className={`pb-3.5 px-1 border-b-2 font-heading font-bold text-base transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === 'products'
                    ? 'border-neutral-900 text-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Package className="h-4 w-4" />
                <span>Products ({products.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('categories')}
                className={`pb-3.5 px-1 border-b-2 font-heading font-bold text-base transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === 'categories'
                    ? 'border-neutral-900 text-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>Categories ({categories.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('banner')}
                className={`pb-3.5 px-1 border-b-2 font-heading font-bold text-base transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === 'banner'
                    ? 'border-neutral-900 text-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Layout className="h-4 w-4" />
                <span>Banner Ads (3 Selected)</span>
              </button>
            </div>

            {/* Notification Toast */}
            {statusNotice && (
              <div className="mx-6 mt-4 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-sm font-semibold flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>{statusNotice}</span>
              </div>
            )}

            {/* Error Notice */}
            {errorMessage && (
              <div className="mx-6 mt-4 p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Tab Contents */}
            <div className="p-6">
              {activeTab === 'products' && (
                <div>
                  {/* Action Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      aria-label="Search products"
                      className="border border-neutral-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 sm:max-w-xs"
                    />

                    <button
                      onClick={openNewProductForm}
                      className="flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm px-4 py-2.5 rounded-xl cursor-pointer shadow-xs"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Product</span>
                    </button>
                  </div>

                  {/* Product Form */}
                  {isProductFormOpen && (
                    <form
                      onSubmit={handleSaveProduct}
                      className="mb-8 p-6 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-4"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                        <h3 className="font-heading font-bold text-base text-neutral-900">
                          {editingProduct ? 'Edit Product' : 'Add New Product'}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setIsProductFormOpen(false)}
                          className="text-neutral-500 hover:text-neutral-900 p-1 cursor-pointer font-bold text-sm"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="sm:col-span-2">
                          <label className="block font-semibold text-neutral-800 mb-1">
                            Product Name
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-neutral-800 mb-1">
                            Category
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
                            className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold text-neutral-800 mb-1">
                            Subcategory
                          </label>
                          <input
                            type="text"
                            value={formData.subcategory || ''}
                            onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                            list="subcategories-datalist"
                            className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                          />
                          <datalist id="subcategories-datalist">
                            {currentCategoryObj?.subcategories.map((sub, i) => (
                              <option key={i} value={sub} />
                            ))}
                          </datalist>
                        </div>

                        <div>
                          <label className="block font-semibold text-neutral-800 mb-1">
                            Price (BDT)
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={formData.price || ''}
                            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                            className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                          />
                        </div>

                        {/* Image Upload & Crop Integration */}
                        <div className="sm:col-span-2">
                          <label className="block font-semibold text-neutral-800 mb-1">
                            Product Photo
                          </label>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <input
                              type="text"
                              required
                              value={formData.image || ''}
                              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                              className="flex-1 bg-white border border-neutral-300 rounded-xl px-3.5 py-2 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                            />

                            <button
                              type="button"
                              onClick={() => setIsCropperOpen(true)}
                              className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-xs"
                            >
                              <Upload className="h-4 w-4" />
                              <span>Upload & Crop Photo</span>
                            </button>
                          </div>

                          {/* Image Thumbnail Preview in Fixed 4:3 Aspect Ratio */}
                          {formData.image && (
                            <div className="mt-3 flex items-center gap-4 p-3 bg-white border border-neutral-200 rounded-xl">
                              <div
                                className="w-24 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100 shrink-0"
                                style={{ aspectRatio: '4/3' }}
                              >
                                <img
                                  src={formData.image}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="text-xs text-neutral-600">
                                <span className="font-bold text-neutral-900 block mb-0.5">
                                  Current Photo Preview (Fixed 4:3 Ratio)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setIsCropperOpen(true)}
                                  className="text-neutral-900 underline font-semibold cursor-pointer"
                                >
                                  Re-crop or change photo
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block font-semibold text-neutral-800 mb-1">
                            Short Description
                          </label>
                          <textarea
                            required
                            rows={2}
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block font-semibold text-neutral-800 mb-1">
                            Full Product Details
                          </label>
                          <textarea
                            rows={3}
                            value={formData.details || ''}
                            onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                            className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                          />
                        </div>

                        <div className="flex items-center gap-2 sm:col-span-2 pt-1">
                          <input
                            type="checkbox"
                            id="inStockCheck"
                            checked={formData.inStock ?? true}
                            onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                            className="h-4 w-4 text-neutral-900 rounded"
                          />
                          <label htmlFor="inStockCheck" className="font-semibold text-neutral-900">
                            In Stock & Available
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
                        <button
                          type="button"
                          onClick={() => setIsProductFormOpen(false)}
                          className="px-4 py-2 border border-neutral-300 rounded-xl font-semibold text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold cursor-pointer"
                        >
                          {editingProduct ? 'Save Changes' : 'Publish Product'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Products Table */}
                  <div className="border border-neutral-200 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                          <tr>
                            <th className="py-3 px-4">Product</th>
                            <th className="py-3 px-4">Category</th>
                            <th className="py-3 px-4">Price</th>
                            <th className="py-3 px-4">Stock</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                          {filteredProducts.map((p) => (
                            <tr key={p.id} className="hover:bg-neutral-50/50">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-12 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100 shrink-0"
                                    style={{ aspectRatio: '4/3' }}
                                  >
                                    <img
                                      src={p.image}
                                      alt={p.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div>
                                    <p className="font-heading font-bold text-neutral-900">
                                      {p.name}
                                    </p>
                                    {p.subcategory && (
                                      <p className="text-xs text-neutral-500">
                                        {p.subcategory}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-neutral-700">
                                {p.category}
                              </td>
                              <td className="py-3 px-4 font-heading font-bold text-neutral-900">
                                {formatBDT(p.price)}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                                    p.inStock
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {p.inStock ? 'Available' : 'Out of Stock'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => openEditProductForm(p)}
                                    className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg cursor-pointer"
                                    aria-label={`Edit ${p.name}`}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                                    aria-label={`Delete ${p.name}`}
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
                  </div>
                </div>
              )}

              {activeTab === 'categories' && (
                <div className="space-y-8">
                  {/* Add New Category */}
                  <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200">
                    <h3 className="font-heading font-bold text-base text-neutral-900 mb-3">
                      Add New Category
                    </h3>
                    <form onSubmit={handleAddCategory} className="flex gap-3">
                      <input
                        type="text"
                        required
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="flex-1 bg-white border border-neutral-300 rounded-xl px-3.5 py-2 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                      <button
                        type="submit"
                        className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm px-5 py-2 rounded-xl cursor-pointer shadow-xs shrink-0"
                      >
                        Add Category
                      </button>
                    </form>
                  </div>

                  {/* Add Subcategory */}
                  <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200">
                    <h3 className="font-heading font-bold text-base text-neutral-900 mb-3">
                      Add Subcategory
                    </h3>
                    <form onSubmit={handleAddSubcategory} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <select
                        value={selectedCatForSub}
                        onChange={(e) => setSelectedCatForSub(e.target.value)}
                        className="bg-white border border-neutral-300 rounded-xl px-3.5 py-2 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        required
                        value={newSubcategoryName}
                        onChange={(e) => setNewSubcategoryName(e.target.value)}
                        className="bg-white border border-neutral-300 rounded-xl px-3.5 py-2 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />

                      <button
                        type="submit"
                        className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm px-5 py-2 rounded-xl cursor-pointer shadow-xs shrink-0"
                      >
                        Add Subcategory
                      </button>
                    </form>
                  </div>

                  {/* Existing Categories & Subcategories List */}
                  <div className="space-y-4">
                    <h3 className="font-heading font-bold text-lg text-neutral-900">
                      Current Categories & Subcategories
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categories.map((cat) => (
                        <div
                          key={cat.id}
                          className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-100">
                              <h4 className="font-heading font-bold text-lg text-neutral-900">
                                {cat.name}
                              </h4>
                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="text-neutral-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                                aria-label={`Delete category ${cat.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Subcategory chips */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              {cat.subcategories.length === 0 ? (
                                <span className="text-xs text-neutral-400">
                                  No subcategories yet
                                </span>
                              ) : (
                                cat.subcategories.map((sub, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-800 px-3 py-1 rounded-lg text-xs font-semibold"
                                  >
                                    <span>{sub}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSubcategory(cat.id, sub)}
                                      className="text-neutral-400 hover:text-neutral-900 cursor-pointer"
                                      aria-label={`Remove subcategory ${sub}`}
                                    >
                                      <span className="text-neutral-400 hover:text-neutral-900 text-xs">x</span>
                                    </button>
                                  </span>
                                ))
                              )}
                            </div>
                          </div>

                          <div className="text-xs text-neutral-400 font-medium">
                            {products.filter((p) => p.category === cat.name).length} products in this category
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'banner' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
                    <div>
                      <h2 className="font-heading font-extrabold text-xl text-neutral-900">
                        Cover Banner Advertisements
                      </h2>
                      <p className="text-sm text-neutral-600 mt-1">
                        Select which 3 products appear in the top rotating advertisement banner on the website.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveBannerSelection}
                      disabled={isSavingBanner}
                      className="bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      <span>{isSavingBanner ? 'Saving...' : 'Save Banner Selection'}</span>
                    </button>
                  </div>

                  {/* 3 Slot Selectors */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[0, 1, 2].map((slotIndex) => {
                      const selectedId = selectedBannerIds[slotIndex];
                      const selectedProduct = products.find((p) => p.id === selectedId);

                      return (
                        <div
                          key={slotIndex}
                          className="bg-white border-2 border-neutral-200 hover:border-neutral-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-heading font-bold text-sm text-neutral-900 uppercase tracking-wider">
                                Slot {slotIndex + 1} ({slotIndex === 0 ? 'Lead Slide' : slotIndex === 1 ? 'Second Slide' : 'Third Slide'})
                              </span>
                              <span className="text-xs bg-neutral-100 text-neutral-700 font-bold px-2 py-0.5 rounded">
                                Slide {slotIndex + 1}
                              </span>
                            </div>

                            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                              Select Featured Product:
                            </label>
                            <select
                              value={selectedId || ''}
                              onChange={(e) => handleBannerSlotChange(slotIndex, e.target.value)}
                              className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2.5 text-sm text-neutral-900 font-semibold focus:outline-none focus:ring-2 focus:ring-neutral-900 mb-4 cursor-pointer shadow-xs"
                            >
                              <option value="" disabled>Choose a product</option>
                              {products.map((prod) => (
                                <option key={prod.id} value={prod.id}>
                                  {prod.name} ({prod.category}) - {formatBDT(prod.price)}
                                </option>
                              ))}
                            </select>

                            {/* Product Preview Card */}
                            {selectedProduct ? (
                              <div className="rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 p-3">
                                <div className="aspect-4/3 rounded-lg overflow-hidden bg-neutral-200 mb-3 border border-neutral-200">
                                  <img
                                    src={selectedProduct.image}
                                    alt={selectedProduct.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                                  {selectedProduct.category}
                                </span>
                                <h3 className="font-heading font-bold text-base text-neutral-900 truncate mb-1">
                                  {selectedProduct.name}
                                </h3>
                                <span className="font-heading font-extrabold text-base text-neutral-900 block">
                                  {formatBDT(selectedProduct.price)}
                                </span>
                              </div>
                            ) : (
                              <div className="p-8 text-center bg-neutral-50 rounded-xl border border-dashed border-neutral-300 text-neutral-400 text-sm">
                                No product chosen for this slot
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-between text-xs text-neutral-600">
                    <span>
                      The customer homepage rotates through these 3 chosen products in order.
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveBannerSelection}
                      disabled={isSavingBanner}
                      className="bg-neutral-900 text-white font-bold px-4 py-2 rounded-lg hover:bg-neutral-800 cursor-pointer shadow-xs"
                    >
                      {isSavingBanner ? 'Saving...' : 'Save Changes'}
                    </button>
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
        aspectRatio={4 / 3}
      />
    </div>
  );
};
