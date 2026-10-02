import React, { useState, useEffect } from 'react';
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
  Minus
} from 'lucide-react';
import { User, updateProfile } from 'firebase/auth';
import { Product, CartItem, UserProfile, OrderConfirmation } from '../types';
import { formatBDT } from '../utils/format';
import { saveUserProfileToDb } from '../services/storeService';
import { Logo } from './Logo';

interface AccountPageProps {
  currentUser: User | null;
  userProfile: UserProfile | null;
  cart: CartItem[];
  wishlistProductIds: string[];
  products: Product[];
  orders: OrderConfirmation[];
  initialTab?: 'profile' | 'cart' | 'wishlist' | 'orders';
  logoUrl?: string;
  onNavigateToStore: () => void;
  onLogout: () => void;
  onUpdateCartQuantity: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
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
  const [activeTab, setActiveTab] = useState<'profile' | 'cart' | 'wishlist' | 'orders'>(initialTab);

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
  const [address, setAddress] = useState(userProfile?.address || '');
  const [city, setCity] = useState(userProfile?.city || '');
  const [postalCode, setPostalCode] = useState(userProfile?.postalCode || '');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

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
          address: address.trim(),
          city: city.trim(),
          postalCode: postalCode.trim()
        });

        if (res.success) {
          setSaveSuccess('Profile details saved successfully');
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
            address: address.trim(),
            city: city.trim(),
            postalCode: postalCode.trim()
          };
          localStorage.setItem('maison_guest_profile', JSON.stringify(guestInfo));
          setSaveSuccess('Guest details saved locally');
          setTimeout(() => setSaveSuccess(''), 3000);
        } catch {
          setSaveError('Failed to save guest details');
        }
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3">
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
                  onClick={onLogout}
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
                  <p className="text-sm text-neutral-500 mt-1">
                    Manage your shipping information and profile contact details.
                  </p>
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                        Phone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        placeholder="+880 1700-000000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                        City / Division
                      </label>
                      <input
                        type="text"
                        placeholder="Dhaka"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                      Delivery Address
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Apartment, Road, Area, Dhaka"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                    />
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

                  {cart.length > 0 && (
                    <button
                      onClick={onProceedToCheckout}
                      className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
                    >
                      Proceed to Checkout
                    </button>
                  )}
                </div>

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
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="p-4 bg-neutral-50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-16 h-16 rounded-xl object-cover bg-white shrink-0 shadow-xs"
                          />
                          <div>
                            <h4 className="font-heading font-bold text-base text-neutral-900">
                              {item.product.name}
                            </h4>
                            <span className="text-xs text-neutral-500 block">
                              {formatBDT(item.product.price)} each
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="flex items-center bg-white rounded-xl px-2 py-1 shadow-xs">
                            <button
                              onClick={() => onUpdateCartQuantity(item.product.id, item.quantity - 1)}
                              className="p-1 text-neutral-600 hover:text-neutral-900 cursor-pointer"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="px-3 text-xs font-bold text-neutral-900">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateCartQuantity(item.product.id, item.quantity + 1)}
                              className="p-1 text-neutral-600 hover:text-neutral-900 cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <span className="font-heading font-extrabold text-base text-neutral-900 min-w-[90px] text-right">
                            {formatBDT(item.product.price * item.quantity)}
                          </span>

                          <button
                            onClick={() => onRemoveFromCart(item.product.id)}
                            className="p-2 text-neutral-400 hover:text-red-600 cursor-pointer"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <span className="text-xs text-neutral-500 block">Subtotal</span>
                        <span className="font-heading font-extrabold text-2xl text-neutral-900">
                          {formatBDT(cartSubtotal)}
                        </span>
                      </div>

                      <button
                        onClick={onProceedToCheckout}
                        className="w-full sm:w-auto bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-lg cursor-pointer"
                      >
                        Checkout Now ({formatBDT(cartSubtotal)})
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
                    Track past and confirmed orders.
                  </p>
                </div>

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
                    {orders.map((ord) => (
                      <div key={ord.orderId} className="bg-neutral-50 rounded-2xl p-5 shadow-xs space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3">
                          <div>
                            <span className="font-heading font-bold text-sm text-neutral-900 block">
                              Order #{ord.orderId}
                            </span>
                            <span className="text-xs text-neutral-400">
                              Placed on {new Date(ord.placedAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                ord.status === 'Delivered'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : ord.status === 'Shipped'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : ord.status === 'Confirmed'
                                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                  : ord.status === 'Cancelled'
                                  ? 'bg-red-100 text-red-800 border border-red-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {ord.status || 'Processing'}
                            </span>
                            <span className="font-heading font-extrabold text-base text-neutral-900">
                              {formatBDT(ord.total)}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {(ord.items || []).map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs text-neutral-700 bg-white p-2.5 rounded-xl shadow-xs">
                              <div className="flex items-center gap-2.5">
                                <img src={it?.product?.image || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=300&q=80'} alt={it?.product?.name || 'Product'} className="w-8 h-8 rounded-lg object-cover" />
                                <span>{it?.product?.name || 'Product'} x {it?.quantity || 1}</span>
                              </div>
                              <span className="font-semibold">{formatBDT((it?.product?.price || 0) * (it?.quantity || 1))}</span>
                            </div>
                          ))}
                        </div>

                        <p className="text-xs text-neutral-500 pt-1">
                          Delivery to: {ord.shippingAddress} ({ord.customerName})
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
