import React, { useState, useEffect, useMemo } from 'react';
import {
  User as UserIcon,
  ShoppingBag,
  Heart,
  Package,
  ArrowLeft,
  LogOut,
  Check,
  AlertCircle,
  Trash2,
  Plus,
  Minus,
  XCircle,
  X,
  CheckCircle2,
  MapPin,
  Edit2,
  Star,
  Home,
  AlertTriangle
} from 'lucide-react';
import { User, updateProfile } from 'firebase/auth';
import { Product, CartItem, UserProfile, OrderConfirmation, UserAddress } from '../types';
import { formatBDT } from '../utils/format';
import {
  saveUserProfileToDb,
  cancelUserOrderInDb,
  saveUserAddressInDb,
  deleteUserAddressInDb,
  setDefaultUserAddressInDb
} from '../services/storeService';
import { Logo } from './Logo';
import { BANGLADESH_DISTRICTS, DeliveryZoneOption } from '../data/bangladeshDistricts';

interface AccountPageProps {
  currentUser: User | null;
  userProfile: UserProfile | null;
  cart: CartItem[];
  wishlistProductIds: string[];
  products: Product[];
  orders: OrderConfirmation[];
  initialTab?: 'profile' | 'addresses' | 'cart' | 'wishlist' | 'orders';
  logoUrl?: string;
  onNavigateToStore: () => void;
  onLogout: () => void;
  onUpdateCartQuantity: (productId: string, quantity: number, selectedColour?: string, selectedSize?: string) => void;
  onRemoveFromCart: (productId: string, selectedColour?: string, selectedSize?: string) => void;
  onProceedToCheckout: () => void;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onViewProductDetails: (product: Product) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  currentUser,
  userProfile,
  cart,
  wishlistProductIds,
  products,
  orders,
  initialTab = 'profile',
  logoUrl,
  onNavigateToStore,
  onLogout,
  onUpdateCartQuantity,
  onRemoveFromCart,
  onProceedToCheckout,
  onToggleWishlist,
  onAddToCart,
  onViewProductDetails
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'cart' | 'wishlist' | 'orders'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Profile form state
  const [displayName, setDisplayName] = useState(
    userProfile?.displayName || currentUser?.displayName || ''
  );
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState<'Cash on Delivery' | 'bKash'>(
    (userProfile?.preferredPaymentMethod as 'Cash on Delivery' | 'bKash') || 'Cash on Delivery'
  );
  const [preferredBkashNumber, setPreferredBkashNumber] = useState(userProfile?.preferredBkashNumber || '');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Address management state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressFormData, setAddressFormData] = useState({
    label: 'Home',
    recipientName: '',
    phone: '',
    district: 'Dhaka',
    subDistrict: '',
    street: '',
    deliveryZone: 'Inside Dhaka City' as DeliveryZoneOption,
    isDefault: false
  });
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressFeedback, setAddressFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<UserAddress | null>(null);

  // Normalized list of user addresses
  const userAddresses: UserAddress[] = useMemo(() => {
    if (userProfile?.addresses && userProfile.addresses.length > 0) {
      return userProfile.addresses;
    }
    if (userProfile?.district || userProfile?.street || userProfile?.address) {
      return [
        {
          id: 'addr-default',
          label: 'Default Address',
          recipientName: userProfile.displayName || currentUser?.displayName || '',
          phone: userProfile.phone || '',
          district: userProfile.district || 'Dhaka',
          subDistrict: userProfile.subDistrict || '',
          street: userProfile.street || userProfile.address || '',
          deliveryZone: (userProfile.deliveryZone as DeliveryZoneOption) || (userProfile.district === 'Dhaka' ? 'Inside Dhaka City' : 'Outside Dhaka City'),
          isDefault: true,
          createdAt: userProfile.updatedAt || new Date().toISOString()
        }
      ];
    }
    return [];
  }, [userProfile, currentUser]);

  // Order cancellation state
  const [orderToCancel, setOrderToCancel] = useState<OrderConfirmation | null>(null);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    setIsCancellingOrder(true);
    setCancelFeedback(null);

    try {
      const res = await cancelUserOrderInDb(orderToCancel.orderId, currentUser?.uid);
      if (res.success) {
        setCancelFeedback({
          type: 'success',
          message: `Order #${orderToCancel.orderId} was successfully cancelled.`
        });
        setOrderToCancel(null);
        setTimeout(() => setCancelFeedback(null), 5000);
      } else {
        setCancelFeedback({
          type: 'error',
          message: res.error || 'Failed to cancel order.'
        });
      }
    } catch {
      setCancelFeedback({
        type: 'error',
        message: 'An unexpected error occurred while cancelling the order.'
      });
    } finally {
      setIsCancellingOrder(false);
    }
  };

  // Update form fields when userProfile changes
  useEffect(() => {
    if (userProfile) {
      if (userProfile.displayName) setDisplayName(userProfile.displayName);
      if (userProfile.phone) setPhone(userProfile.phone);
      if (userProfile.preferredPaymentMethod) {
        setPreferredPaymentMethod(userProfile.preferredPaymentMethod as 'Cash on Delivery' | 'bKash');
      }
      if (userProfile.preferredBkashNumber) {
        setPreferredBkashNumber(userProfile.preferredBkashNumber);
      }
    }
  }, [userProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess('');
    setSaveError('');

    try {
      if (currentUser) {
        if (displayName.trim() && displayName !== currentUser.displayName) {
          await updateProfile(currentUser, { displayName: displayName.trim() });
        }

        const res = await saveUserProfileToDb(currentUser.uid, {
          displayName: displayName.trim(),
          email: currentUser.email || '',
          phone: phone.trim(),
          preferredPaymentMethod: preferredPaymentMethod,
          preferredBkashNumber: preferredBkashNumber.trim()
        });

        if (res.success) {
          setSaveSuccess('Personal details and payment preferences saved successfully');
          setTimeout(() => setSaveSuccess(''), 3000);
        } else {
          setSaveError(res.error || 'Failed to save profile');
        }
      } else {
        // Save guest profile details to localStorage
        try {
          const guestInfo = {
            displayName: displayName.trim(),
            phone: phone.trim(),
            preferredPaymentMethod: preferredPaymentMethod,
            preferredBkashNumber: preferredBkashNumber.trim()
          };
          localStorage.setItem('maison_guest_profile', JSON.stringify(guestInfo));
          setSaveSuccess('Personal details saved locally');
          setTimeout(() => setSaveSuccess(''), 3000);
        } catch {
          setSaveError('Failed to save details');
        }
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddressDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setAddressFormData((prev) => ({
      ...prev,
      district: selected,
      deliveryZone: selected === 'Dhaka' ? 'Inside Dhaka City' : 'Outside Dhaka City'
    }));
  };

  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddressFormData({
      label: 'Home',
      recipientName: displayName || currentUser?.displayName || '',
      phone: phone || '',
      district: 'Dhaka',
      subDistrict: '',
      street: '',
      deliveryZone: 'Inside Dhaka City',
      isDefault: userAddresses.length === 0
    });
    setAddressFeedback(null);
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr: UserAddress) => {
    setEditingAddressId(addr.id);
    setAddressFormData({
      label: addr.label || 'Home',
      recipientName: addr.recipientName || displayName || '',
      phone: addr.phone || phone || '',
      district: addr.district || 'Dhaka',
      subDistrict: addr.subDistrict || '',
      street: addr.street || '',
      deliveryZone: (addr.deliveryZone as DeliveryZoneOption) || (addr.district === 'Dhaka' ? 'Inside Dhaka City' : 'Outside Dhaka City'),
      isDefault: addr.isDefault
    });
    setAddressFeedback(null);
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressFormData.street.trim()) {
      setAddressFeedback({ type: 'error', message: 'Street address is required.' });
      return;
    }
    if (!addressFormData.subDistrict.trim()) {
      setAddressFeedback({ type: 'error', message: 'Sub District / Thana / Union is required.' });
      return;
    }

    setIsSavingAddress(true);
    setAddressFeedback(null);

    const addrToSave: UserAddress = {
      id: editingAddressId || `addr-${Date.now()}`,
      label: addressFormData.label.trim() || 'Home',
      recipientName: addressFormData.recipientName.trim() || displayName || 'Recipient',
      phone: addressFormData.phone.trim() || phone,
      district: addressFormData.district,
      subDistrict: addressFormData.subDistrict.trim(),
      street: addressFormData.street.trim(),
      deliveryZone: addressFormData.deliveryZone,
      isDefault: addressFormData.isDefault || userAddresses.length === 0,
      createdAt: new Date().toISOString()
    };

    try {
      if (currentUser) {
        const res = await saveUserAddressInDb(currentUser.uid, addrToSave);
        if (res.success) {
          setIsAddressModalOpen(false);
          setAddressFeedback({ type: 'success', message: 'Address saved to your account.' });
          setTimeout(() => setAddressFeedback(null), 3000);
        } else {
          setAddressFeedback({ type: 'error', message: res.error || 'Failed to save address.' });
        }
      } else {
        // Guest mode fallback: save to localStorage
        const updated = editingAddressId
          ? userAddresses.map((a) => (a.id === editingAddressId ? addrToSave : a))
          : [...userAddresses, addrToSave];
        localStorage.setItem('maison_guest_addresses', JSON.stringify(updated));
        setIsAddressModalOpen(false);
        setAddressFeedback({ type: 'success', message: 'Address saved locally.' });
        setTimeout(() => setAddressFeedback(null), 3000);
      }
    } catch {
      setAddressFeedback({ type: 'error', message: 'An unexpected error occurred.' });
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    if (!currentUser) return;
    try {
      const res = await setDefaultUserAddressInDb(currentUser.uid, addressId);
      if (res.success) {
        setAddressFeedback({ type: 'success', message: 'Default address updated.' });
        setTimeout(() => setAddressFeedback(null), 3000);
      } else {
        setAddressFeedback({ type: 'error', message: res.error || 'Failed to update default address.' });
      }
    } catch {
      setAddressFeedback({ type: 'error', message: 'Failed to update default address.' });
    }
  };

  const handleDeleteAddress = async () => {
    if (!addressToDelete || !currentUser) return;
    try {
      const res = await deleteUserAddressInDb(currentUser.uid, addressToDelete.id);
      if (res.success) {
        setAddressToDelete(null);
        setAddressFeedback({ type: 'success', message: 'Address removed from your account.' });
        setTimeout(() => setAddressFeedback(null), 3000);
      } else {
        setAddressFeedback({ type: 'error', message: res.error || 'Failed to delete address.' });
      }
    } catch {
      setAddressFeedback({ type: 'error', message: 'Failed to delete address.' });
    }
  };

  // Derived calculations
  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistProducts = products.filter((p) => wishlistProductIds.includes(p.id));

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToStore}
              className="cursor-pointer"
            >
              <Logo variant="light" size="sm" customLogoUrl={logoUrl} />
            </button>
            <span className="text-neutral-300">/</span>
            <span className="font-heading font-bold text-sm sm:text-base text-neutral-700">
              Account
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToStore}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Go to Home</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Account View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-8">
        {/* Mobile & Tablet Header & Horizontal Segmented Tab Bar */}
        <div className="lg:hidden mb-4 space-y-3">
          {/* User Bio Card for Mobile/Tablet */}
          <div className="bg-white rounded-2xl p-4 shadow-2xs border border-stone-200/70 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 rounded-full bg-neutral-900 text-white font-heading font-extrabold text-base flex items-center justify-center shrink-0 shadow-2xs">
                {(displayName || currentUser?.email || 'G')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="font-heading font-bold text-sm sm:text-base text-neutral-900 truncate">
                  {displayName || currentUser?.displayName || 'Guest Customer'}
                </h2>
                <p className="text-[11px] text-stone-500 truncate">
                  {currentUser?.email || 'Guest Account'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="p-2 text-stone-500 hover:text-red-600 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer shrink-0"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {/* Smooth Horizontal Scrollable Tab Bar for Mobile & Tablet */}
          <div className="bg-white rounded-2xl p-1.5 shadow-2xs border border-stone-200/70 overflow-x-auto scrollbar-none flex gap-1 items-center">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-category font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                activeTab === 'profile'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-neutral-900 hover:bg-stone-50'
              }`}
            >
              <UserIcon className="h-3.5 w-3.5" />
              <span>Details</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('addresses')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-category font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                activeTab === 'addresses'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-neutral-900 hover:bg-stone-50'
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>Addresses</span>
              {userAddresses.length > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'addresses' ? 'bg-white text-neutral-900' : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {userAddresses.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cart')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-category font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                activeTab === 'cart'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-neutral-900 hover:bg-stone-50'
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Cart</span>
              {cartItemCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'cart' ? 'bg-white text-neutral-900' : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {cartItemCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('wishlist')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-category font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                activeTab === 'wishlist'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-neutral-900 hover:bg-stone-50'
              }`}
            >
              <Heart className="h-3.5 w-3.5" />
              <span>Wishlist</span>
              {wishlistProductIds.length > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'wishlist' ? 'bg-white text-neutral-900' : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {wishlistProductIds.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-category font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                activeTab === 'orders'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-neutral-900 hover:bg-stone-50'
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              <span>Orders</span>
              {orders.length > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'orders' ? 'bg-white text-neutral-900' : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {orders.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar Navigation (Desktop only) */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                {/* User Bio Header */}
                <div className="flex items-center gap-3 pb-5 mb-5 bg-neutral-50 p-4 rounded-2xl">
                  <div className="h-12 w-12 rounded-full bg-neutral-900 text-white font-heading font-extrabold text-lg flex items-center justify-center shrink-0">
                    {(displayName || currentUser?.email || 'G')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-heading font-bold text-base text-neutral-900 truncate">
                      {displayName || currentUser?.displayName || 'Guest Customer'}
                    </h2>
                    <p className="text-xs text-neutral-500 truncate">
                      {currentUser?.email || 'Guest Checkout Account'}
                    </p>
                  </div>
                </div>

                {/* Nav Links */}
                <nav className="space-y-1.5" aria-label="Account navigation">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-colors cursor-pointer ${
                      activeTab === 'profile'
                        ? 'bg-neutral-900 text-white'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-4 w-4" />
                      <span>Personal Details</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('addresses')}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-colors cursor-pointer ${
                      activeTab === 'addresses'
                        ? 'bg-neutral-900 text-white'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4" />
                      <span>Saved Addresses</span>
                    </div>
                    {userAddresses.length > 0 && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          activeTab === 'addresses' ? 'bg-white text-neutral-900' : 'bg-neutral-200 text-neutral-800'
                        }`}
                      >
                        {userAddresses.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('cart')}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-colors cursor-pointer ${
                      activeTab === 'cart'
                        ? 'bg-neutral-900 text-white'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="h-4 w-4" />
                      <span>My Cart</span>
                    </div>
                    {cartItemCount > 0 && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          activeTab === 'cart' ? 'bg-white text-neutral-900' : 'bg-neutral-200 text-neutral-800'
                        }`}
                      >
                        {cartItemCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('wishlist')}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-colors cursor-pointer ${
                      activeTab === 'wishlist'
                        ? 'bg-neutral-900 text-white'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Heart className="h-4 w-4" />
                      <span>Wishlist</span>
                    </div>
                    {wishlistProductIds.length > 0 && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          activeTab === 'wishlist' ? 'bg-white text-neutral-900' : 'bg-neutral-200 text-neutral-800'
                        }`}
                      >
                        {wishlistProductIds.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-colors cursor-pointer ${
                      activeTab === 'orders'
                        ? 'bg-neutral-900 text-white'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4" />
                      <span>Order History</span>
                    </div>
                    {orders.length > 0 && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          activeTab === 'orders' ? 'bg-white text-neutral-900' : 'bg-neutral-200 text-neutral-800'
                        }`}
                      >
                        {orders.length}
                      </span>
                    )}
                  </button>
                </nav>
              </div>

              {/* Logout Button */}
              <div className="pt-6 mt-6">
                <button
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-neutral-100 text-red-600 hover:bg-red-50 text-sm font-bold transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Account View Content */}
          <div className="lg:col-span-9">
            {/* TAB 1: Personal Details */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="pb-4 mb-6">
                  <h3 className="font-heading font-extrabold text-2xl text-neutral-900">
                    Personal Details
                  </h3>
                </div>

                {saveSuccess && (
                  <div className="mb-6 p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-sm font-semibold flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>{saveSuccess}</span>
                  </div>
                )}

                {saveError && (
                  <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-2xl text-sm font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span>{saveError}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-5 max-w-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        disabled
                        value={currentUser?.email || userProfile?.email || 'Guest Checkout Account'}
                        className="w-full bg-neutral-100 border border-stone-200 rounded-xl px-4 py-3 text-sm text-neutral-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                      Phone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      placeholder="+880 1700-000000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                    />
                  </div>

                  {/* Payment Method Selection (COD / bKash Payment) */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                      Preferred Payment Method
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div
                        onClick={() => setPreferredPaymentMethod('Cash on Delivery')}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          preferredPaymentMethod === 'Cash on Delivery'
                            ? 'border-neutral-900 bg-stone-50 shadow-xs'
                            : 'border-stone-200 bg-white hover:border-stone-300'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-neutral-900">Cash on Delivery</p>
                        </div>
                        <div
                          className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                            preferredPaymentMethod === 'Cash on Delivery' ? 'border-neutral-900' : 'border-stone-300'
                          }`}
                        >
                          {preferredPaymentMethod === 'Cash on Delivery' && <div className="h-2 w-2 rounded-full bg-neutral-900" />}
                        </div>
                      </div>

                      <div
                        onClick={() => setPreferredPaymentMethod('bKash')}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          preferredPaymentMethod === 'bKash'
                            ? 'border-[#e2136e] bg-pink-50/50 shadow-xs'
                            : 'border-stone-200 bg-white hover:border-stone-300'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-neutral-900">bKash Payment</p>
                        </div>
                        <div
                          className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                            preferredPaymentMethod === 'bKash' ? 'border-[#e2136e]' : 'border-stone-300'
                          }`}
                        >
                          {preferredPaymentMethod === 'bKash' && <div className="h-2 w-2 rounded-full bg-[#e2136e]" />}
                        </div>
                      </div>
                    </div>

                    {preferredPaymentMethod === 'bKash' && (
                      <div className="p-3.5 bg-pink-50/60 border border-pink-200 rounded-xl space-y-2 animate-in fade-in">
                        <label className="block text-[11px] font-bold text-neutral-800">
                          Saved bKash Number
                        </label>
                        <input
                          type="tel"
                          value={preferredBkashNumber}
                          onChange={(e) => setPreferredBkashNumber(e.target.value)}
                          placeholder="01XXXXXXXXX"
                          className="w-full bg-white border border-pink-200 rounded-xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-[#e2136e]"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    {isSaving ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* TAB: Saved Addresses (Multi-address support with Default setting) */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
                  <div>
                    <h3 className="font-heading font-extrabold text-2xl text-neutral-900">
                      Saved Addresses
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddAddress}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2 shrink-0 self-start sm:self-auto"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add New Address</span>
                  </button>
                </div>

                {addressFeedback && (
                  <div
                    className={`p-4 rounded-2xl flex items-center justify-between text-xs font-medium animate-in fade-in ${
                      addressFeedback.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {addressFeedback.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                      )}
                      <span>{addressFeedback.message}</span>
                    </div>
                    <button
                      onClick={() => setAddressFeedback(null)}
                      className="p-1 hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {userAddresses.length === 0 ? (
                  <div className="text-center py-16 bg-neutral-50 rounded-2xl border border-dashed border-stone-200">
                    <MapPin className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-base font-bold text-neutral-700 mb-1">No saved addresses yet</p>
                    <p className="text-xs text-neutral-400 mb-6 max-w-sm mx-auto">
                      Add your home, office, or apartment addresses to make checkout faster and effortless.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenAddAddress}
                      className="bg-neutral-900 text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-neutral-800 cursor-pointer shadow-xs inline-flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add First Address</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-4 ${
                          addr.isDefault
                            ? 'border-neutral-900 bg-stone-50/70 shadow-xs ring-1 ring-neutral-900/10'
                            : 'border-stone-200 bg-white hover:border-stone-300'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-heading font-extrabold text-sm text-neutral-900">
                                {addr.label || 'Delivery Address'}
                              </span>
                              {addr.isDefault && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                                  <Star className="h-2.5 w-2.5 fill-amber-700 text-amber-700" />
                                  DEFAULT
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-semibold text-neutral-600 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                              {addr.deliveryZone || (addr.district === 'Dhaka' ? 'Inside Dhaka City (৳80)' : 'Outside Dhaka City (৳150)')}
                            </span>
                          </div>

                          <div className="text-xs space-y-1 text-neutral-700">
                            {addr.recipientName && (
                              <p className="font-bold text-neutral-900">{addr.recipientName}</p>
                            )}
                            {addr.phone && (
                              <p className="text-stone-600">Phone: {addr.phone}</p>
                            )}
                            <p className="text-stone-800 leading-relaxed pt-1">
                              {addr.street}
                            </p>
                            <p className="text-stone-500 font-medium">
                              {addr.subDistrict}, {addr.district}, Bangladesh
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between gap-2">
                          {!addr.isDefault ? (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-xs font-bold text-neutral-800 hover:text-neutral-950 underline underline-offset-2 cursor-pointer"
                            >
                              Set as Default
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                              <Check className="h-3.5 w-3.5" />
                              Primary Address
                            </span>
                          )}

                          <div className="flex items-center gap-1.5 ml-auto">
                            <button
                              type="button"
                              onClick={() => handleOpenEditAddress(addr)}
                              className="p-1.5 text-stone-500 hover:text-neutral-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Address"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setAddressToDelete(addr)}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Address"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Cart */}
            {activeTab === 'cart' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="pb-4 mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-extrabold text-2xl text-neutral-900">
                      My Shopping Cart
                    </h3>
                    <p className="text-sm text-neutral-500 mt-1">
                      {cart.length === 0 ? 'Your cart is empty' : `${cartItemCount} items selected`}
                    </p>
                  </div>

                </div>

                {/* Out of Stock Warning Banner in Cart */}
                {cart.some((item) => item.product.inStock === false) && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-red-700 leading-relaxed">
                        Some items in your bag are currently out of stock. Please remove them before proceeding to checkout.
                      </p>
                    </div>
                  </div>
                )}

                {cart.length === 0 ? (
                  <div className="text-center py-16 bg-neutral-50 rounded-2xl">
                    <ShoppingBag className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-base font-bold text-neutral-700 mb-1">Your cart is empty</p>
                    <p className="text-xs text-neutral-400 mb-6">Discover elevated essentials in our catalog.</p>
                    <button
                      onClick={onNavigateToStore}
                      className="bg-neutral-900 text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-neutral-800 cursor-pointer shadow-xs"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item, idx) => {
                      const itemColour = item.selectedColour || item.product.selectedColour;
                      const itemSize = item.selectedSize || item.product.selectedSize;
                      const currentProduct = products.find(p => p.id === item.product.id);
                      const isOutOfStock = currentProduct ? currentProduct.inStock === false : item.product.inStock === false;
                      const uniqueKey = `${item.product.id}-${itemColour || ''}-${itemSize || ''}-${idx}`;

                      return (
                      <div
                        key={uniqueKey}
                        className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${isOutOfStock ? 'bg-red-50/60 border border-red-200' : 'bg-neutral-50'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative shrink-0">
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className={`w-16 h-16 rounded-xl object-cover bg-white shadow-xs ${isOutOfStock ? 'grayscale opacity-75' : ''}`}
                            />
                            {isOutOfStock && (
                              <span className="absolute inset-x-0 bottom-0 bg-red-600 text-white text-[8px] font-bold uppercase tracking-wider text-center py-0.5 rounded-b-xl">
                                Out of Stock
                              </span>
                            )}
                          </div>
                          <div>
                            <h4 className="font-heading font-bold text-base text-neutral-900">
                              {item.product.name}
                            </h4>
                            {isOutOfStock && (
                              <p className="text-xs font-bold text-red-600 mt-0.5 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Out of stock
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                              <span className="text-xs text-neutral-500 font-semibold">
                                {formatBDT(item.product.price)} each
                              </span>
                              {itemColour && (
                                <span className="text-[11px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md font-medium">
                                  Colour: {itemColour}
                                </span>
                              )}
                              {itemSize && (
                                <span className="text-[11px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md font-medium">
                                  Size: {itemSize}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="flex items-center bg-white rounded-xl px-2 py-1 shadow-xs">
                            <button
                              onClick={() => onUpdateCartQuantity(item.product.id, item.quantity - 1, itemColour, itemSize)}
                              className="p-1 text-neutral-600 hover:text-neutral-900 cursor-pointer"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="px-3 text-xs font-bold text-neutral-900">{item.quantity}</span>
                            <button
                              disabled={isOutOfStock}
                              onClick={() => onUpdateCartQuantity(item.product.id, item.quantity + 1, itemColour, itemSize)}
                              className="p-1 text-neutral-600 hover:text-neutral-900 disabled:opacity-30 cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <span className="font-heading font-extrabold text-base text-neutral-900 min-w-[90px] text-right">
                            {formatBDT(item.product.price * item.quantity)}
                          </span>

                          <button
                            onClick={() => onRemoveFromCart(item.product.id, itemColour, itemSize)}
                            className={`p-2 rounded-lg cursor-pointer transition-colors ${isOutOfStock ? 'text-red-600 bg-red-100 hover:bg-red-200' : 'text-neutral-400 hover:text-red-600'}`}
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                    })}

                    <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <span className="text-xs text-neutral-500 block">Subtotal</span>
                        <span className="font-heading font-extrabold text-2xl text-neutral-900">
                          {formatBDT(cartSubtotal)}
                        </span>
                      </div>

                      <button
                        disabled={cart.some((item) => {
                          const p = products.find(prod => prod.id === item.product.id);
                          return (p ? p.inStock === false : item.product.inStock === false);
                        })}
                        onClick={onProceedToCheckout}
                        className="w-full sm:w-auto bg-neutral-900 hover:bg-neutral-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-lg cursor-pointer"
                      >
                        {cart.some((item) => {
                          const p = products.find(prod => prod.id === item.product.id);
                          return (p ? p.inStock === false : item.product.inStock === false);
                        })
                          ? 'Remove Out-of-Stock Items'
                          : `Checkout Now (${formatBDT(cartSubtotal)})`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Wishlist */}
            {activeTab === 'wishlist' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="pb-4 mb-6">
                  <h3 className="font-heading font-extrabold text-2xl text-neutral-900">
                    Saved Wishlist
                  </h3>
                  <p className="text-sm text-neutral-500 mt-1">
                    {wishlistProducts.length} items saved to your personal catalog.
                  </p>
                </div>

                {wishlistProducts.length === 0 ? (
                  <div className="text-center py-16 bg-neutral-50 rounded-2xl">
                    <Heart className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-base font-bold text-neutral-700 mb-1">Your wishlist is empty</p>
                    <p className="text-xs text-neutral-400 mb-6">Save items to easily find and purchase them later.</p>
                    <button
                      onClick={onNavigateToStore}
                      className="bg-neutral-900 text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-neutral-800 cursor-pointer shadow-xs"
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wishlistProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="bg-neutral-50 rounded-2xl p-4 flex flex-col justify-between shadow-xs"
                      >
                        <div>
                          <div className="aspect-4/3 rounded-xl overflow-hidden bg-white mb-3 shadow-xs">
                            <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                            {prod.category}
                          </span>
                          <h4 className="font-heading font-bold text-base text-neutral-900 mb-1">
                            {prod.name}
                          </h4>
                          <span className="font-heading font-extrabold text-base text-neutral-900 block mb-3">
                            {formatBDT(prod.price)}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => onAddToCart(prod, 1)}
                            className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs py-2 rounded-xl shadow-xs cursor-pointer"
                          >
                            Add to Cart
                          </button>
                          <button
                            onClick={() => onToggleWishlist(prod.id)}
                            className="p-2 bg-white text-red-500 rounded-xl shadow-xs cursor-pointer hover:bg-red-50"
                            title="Remove from wishlist"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Orders */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="pb-4 mb-6">
                  <h3 className="font-heading font-extrabold text-2xl text-neutral-900">
                    Order History
                  </h3>
                  <p className="text-sm text-neutral-500 mt-1">
                    Track and manage your orders.
                  </p>
                </div>

                {cancelFeedback && (
                  <div
                    className={`mb-6 p-4 rounded-2xl flex items-center justify-between text-xs font-medium animate-in fade-in ${
                      cancelFeedback.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {cancelFeedback.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                      )}
                      <span>{cancelFeedback.message}</span>
                    </div>
                    <button
                      onClick={() => setCancelFeedback(null)}
                      className="p-1 hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {orders.length === 0 ? (
                  <div className="text-center py-16 bg-neutral-50 rounded-2xl">
                    <Package className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-base font-bold text-neutral-700 mb-1">No orders placed yet</p>
                    <p className="text-xs text-neutral-400 mb-6">Orders placed through your account appear here.</p>
                    <button
                      onClick={onNavigateToStore}
                      className="bg-neutral-900 text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-neutral-800 cursor-pointer shadow-xs"
                    >
                      Explore Store
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((ord) => {
                      const isProcessing = !ord.status || ord.status === 'Processing';
                      const isConfirmed = ord.status === 'Confirmed';
                      const isShipped = ord.status === 'Shipped';
                      const isDelivered = ord.status === 'Delivered';
                      const isCancelled = ord.status === 'Cancelled';

                      return (
                        <div key={ord.orderId} className="bg-neutral-50 rounded-2xl p-5 shadow-xs space-y-3 border border-stone-200/80">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200/70">
                            <div>
                              <span className="font-heading font-bold text-sm text-neutral-900 block">
                                Order #{ord.orderId}
                              </span>
                              <span className="text-xs text-neutral-400">
                                Placed on {new Date(ord.placedAt).toLocaleDateString()} at {new Date(ord.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                  isDelivered
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : isShipped
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : isConfirmed
                                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                    : isCancelled
                                    ? 'bg-red-100 text-red-800 border border-red-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {isProcessing ? 'Processing' : ord.status}
                              </span>

                              <span className="font-heading font-extrabold text-base text-neutral-900">
                                {formatBDT(ord.total)}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {(ord.items || []).map((it, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs text-neutral-700 bg-white p-2.5 rounded-xl shadow-xs border border-stone-200/60">
                                <div className="flex items-center gap-2.5">
                                  <img
                                    src={it?.product?.image || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=300&q=80'}
                                    alt={it?.product?.name || 'Product'}
                                    className="w-9 h-9 rounded-lg object-cover"
                                  />
                                  <div>
                                    <span className="font-medium text-neutral-900 block">{it?.product?.name || 'Product'}</span>
                                    <span className="text-[11px] text-stone-500">
                                      Qty: {it?.quantity || 1}
                                      {it?.selectedColour ? ` • ${it.selectedColour}` : ''}
                                      {it?.selectedSize ? ` • ${it.selectedSize}` : ''}
                                    </span>
                                  </div>
                                </div>
                                <span className="font-semibold tabular-nums text-neutral-900">
                                  {formatBDT((it?.product?.price || 0) * (it?.quantity || 1))}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Address & Payment Info */}
                          <div className="pt-2 border-t border-stone-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-neutral-600">
                            <div>
                              <p className="font-medium text-neutral-900">
                                Delivery: {ord.shippingAddress}
                              </p>
                              {ord.district && (
                                <p className="text-[11px] text-stone-500">
                                  {ord.subDistrict ? `${ord.subDistrict}, ` : ''}{ord.district} ({ord.deliveryZone || 'Standard Delivery'})
                                </p>
                              )}
                            </div>
                            <div className="text-left sm:text-right shrink-0">
                              <span className="font-semibold text-neutral-900 block">
                                {ord.paymentMethod || 'Cash on Delivery'}
                              </span>
                              {ord.bkashNumber && (
                                <span className="text-[11px] text-pink-700 block">
                                  bKash: {ord.bkashNumber}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Order Action / Cancellation Restriction Bar */}
                          <div className="pt-3 border-t border-stone-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            {isProcessing && (
                              <div className="w-full flex items-center justify-end">
                                <button
                                  type="button"
                                  onClick={() => setOrderToCancel(ord)}
                                  className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  <span>Cancel Order</span>
                                </button>
                              </div>
                            )}

                            {isConfirmed && (
                              <div className="w-full flex items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-1.5 font-medium text-neutral-900">
                                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                                  <span>Order confirmed</span>
                                </div>
                                <button
                                  type="button"
                                  disabled
                                  className="text-xs font-bold text-stone-400 bg-stone-100 border border-stone-200 px-3.5 py-1.5 rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5 opacity-60"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  <span>Cancel Order</span>
                                </button>
                              </div>
                            )}

                            {isShipped && (
                              <div className="w-full flex items-center justify-between gap-2 text-xs">
                                <span className="font-medium text-stone-600">Shipped</span>
                                <button
                                  type="button"
                                  disabled
                                  className="text-xs font-bold text-stone-400 bg-stone-100 border border-stone-200 px-3.5 py-1.5 rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5 opacity-60"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  <span>Cancel Order</span>
                                </button>
                              </div>
                            )}

                            {isDelivered && (
                              <div className="w-full flex items-center justify-between gap-2 text-xs">
                                <span className="font-medium text-emerald-700">Delivered</span>
                              </div>
                            )}

                            {isCancelled && (
                              <div className="w-full flex items-center justify-between gap-2 text-xs">
                                <span className="font-medium text-red-600">Cancelled</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Cancel Order Confirmation Modal */}
      {orderToCancel && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <AlertCircle className="h-6 w-6" />
            </div>

            <div>
              <h3 className="font-heading font-extrabold text-xl text-neutral-900">
                Cancel Order #{orderToCancel.orderId}?
              </h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Are you sure you want to cancel this order? Once cancelled, this order cannot be reopened and items must be reordered.
              </p>
            </div>

            <div className="bg-neutral-50 p-3 rounded-xl border border-stone-200 text-xs space-y-1">
              <div className="flex justify-between text-neutral-700">
                <span>Items:</span>
                <span className="font-semibold">{orderToCancel.items?.length || 0} items</span>
              </div>
              <div className="flex justify-between text-neutral-700">
                <span>Total Amount:</span>
                <span className="font-bold text-neutral-900">{formatBDT(orderToCancel.total)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isCancellingOrder}
                onClick={() => setOrderToCancel(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={isCancellingOrder}
                onClick={handleCancelOrder}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isCancellingOrder ? (
                  <span>Cancelling...</span>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    <span>Yes, Cancel Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Address Modal with all address options */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-lg text-neutral-900">
                    {editingAddressId ? 'Edit Address' : 'Add New Address'}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Enter delivery information for your orders.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-neutral-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              {/* Address Label Presets */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                  Address Label
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {['Home', 'Office', 'Apartment', 'Other'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAddressFormData((prev) => ({ ...prev, label: preset }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        addressFormData.label === preset
                          ? 'bg-neutral-900 text-white shadow-xs'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Syed Ahmed"
                    value={addressFormData.recipientName}
                    onChange={(e) =>
                      setAddressFormData((prev) => ({ ...prev, recipientName: e.target.value }))
                    }
                    className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="01XXXXXXXXX"
                    value={addressFormData.phone}
                    onChange={(e) =>
                      setAddressFormData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                  />
                </div>
              </div>

              {/* District & Sub District Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                    District *
                  </label>
                  <select
                    value={addressFormData.district}
                    onChange={handleAddressDistrictChange}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs cursor-pointer font-medium"
                  >
                    {BANGLADESH_DISTRICTS.map((dist) => (
                      <option key={dist.name} value={dist.name}>
                        {dist.name} ({dist.division} Division)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                    Sub District / Thana / Union *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dhanmondi, Gulshan, Savar"
                    value={addressFormData.subDistrict}
                    onChange={(e) =>
                      setAddressFormData((prev) => ({ ...prev, subDistrict: e.target.value }))
                    }
                    className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                  />
                </div>
              </div>

              {/* Delivery Zone Auto Rate Badge */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                <span className="text-stone-600 font-medium">Standard Delivery Rate:</span>
                <span className="font-bold text-neutral-900 bg-white px-2.5 py-1 rounded-lg border border-stone-200 shadow-2xs">
                  {addressFormData.deliveryZone} ({addressFormData.deliveryZone === 'Inside Dhaka City' ? '৳80' : '৳150'})
                </span>
              </div>

              {/* Street Address Details */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                  Delivery Street Address (House, Road, Area) *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="House number, Road name, Block or Village details"
                  value={addressFormData.street}
                  onChange={(e) =>
                    setAddressFormData((prev) => ({ ...prev, street: e.target.value }))
                  }
                  className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                />
              </div>

              {/* Set as Default Address */}
              <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={addressFormData.isDefault}
                  onChange={(e) =>
                    setAddressFormData((prev) => ({ ...prev, isDefault: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-stone-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer accent-neutral-900"
                />
                <span className="text-xs font-bold text-neutral-800">
                  Set as my default delivery address
                </span>
              </label>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSavingAddress ? 'Saving...' : editingAddressId ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Address Confirmation Modal */}
      {addressToDelete && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <Trash2 className="h-6 w-6" />
            </div>

            <div>
              <h3 className="font-heading font-extrabold text-lg text-neutral-900">
                Delete Address?
              </h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Are you sure you want to remove &quot;{addressToDelete.label || 'this address'}&quot; ({addressToDelete.street})?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAddressToDelete(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAddress}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2 rounded-xl transition-colors shadow-xs cursor-pointer"
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
              Are you sure you want to sign out of your account?
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
                  onLogout();
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
