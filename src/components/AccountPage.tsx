import React, { useState } from 'react';
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

interface AccountPageProps {
  currentUser: User;
  userProfile: UserProfile | null;
  cart: CartItem[];
  wishlistProductIds: string[];
  products: Product[];
  orders: OrderConfirmation[];
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
  onNavigateToStore,
  onLogout,
  onUpdateCartQuantity,
  onRemoveFromCart,
  onProceedToCheckout,
  onToggleWishlist,
  onAddToCart,
  onViewProductDetails
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'cart' | 'wishlist' | 'orders'>('profile');

  // Profile form state
  const [displayName, setDisplayName] = useState(
    userProfile?.displayName || currentUser.displayName || ''
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
        setSaveError(res.error || 'Failed to update profile');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setSaveError(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const wishlistProducts = products.filter((p) => wishlistProductIds.includes(p.id));

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-xl text-neutral-900">
                My Account
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 text-xs font-semibold cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>

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

      {/* Main Account View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
          {/* User Welcome Banner */}
          <div className="px-6 py-5 bg-neutral-50 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-extrabold text-xl text-neutral-900">
                {displayName || currentUser.displayName || 'Customer'}
              </h2>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">
                {currentUser.email}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-neutral-600">
              <span className="bg-white border border-neutral-200 px-3 py-1.5 rounded-lg">
                {cart.length} items in cart
              </span>
              <span className="bg-white border border-neutral-200 px-3 py-1.5 rounded-lg">
                {wishlistProductIds.length} in wishlist
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 pt-4 border-b border-neutral-200 flex gap-6 bg-white overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-3.5 px-1 border-b-2 font-heading font-bold text-sm sm:text-base transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'profile'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <UserIcon className="h-4 w-4" />
              <span>Personal Details</span>
            </button>

            <button
              onClick={() => setActiveTab('cart')}
              className={`pb-3.5 px-1 border-b-2 font-heading font-bold text-sm sm:text-base transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'cart'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>My Cart ({cart.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('wishlist')}
              className={`pb-3.5 px-1 border-b-2 font-heading font-bold text-sm sm:text-base transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'wishlist'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Heart className="h-4 w-4" />
              <span>Wishlist ({wishlistProductIds.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`pb-3.5 px-1 border-b-2 font-heading font-bold text-sm sm:text-base transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'orders'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Orders ({orders.length})</span>
            </button>
          </div>

          {/* Tab 1: Profile & Details */}
          {activeTab === 'profile' && (
            <div className="p-6 max-w-2xl">
              {saveSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>{saveSuccess}</span>
                </div>
              )}

              {saveError && (
                <div className="mb-4 p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span>{saveError}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-800 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2.5 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-800 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={currentUser.email || ''}
                    className="w-full bg-neutral-100 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-base text-neutral-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-800 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2.5 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-800 mb-1.5">
                    Shipping Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2.5 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-800 mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2.5 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-800 mb-1.5">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2.5 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 shadow-xs"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl cursor-pointer shadow-xs transition-colors"
                  >
                    {isSaving ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 2: My Cart */}
          {activeTab === 'cart' && (
            <div className="p-6">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                  <p className="font-heading font-bold text-lg text-neutral-900 mb-1">
                    Your cart is empty
                  </p>
                  <p className="text-xs text-neutral-500 mb-5">
                    Explore products from the catalog to add items here.
                  </p>
                  <button
                    onClick={onNavigateToStore}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer"
                  >
                    Browse Catalog
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-2xl overflow-hidden">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-neutral-50/50"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="w-16 h-12 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100 shrink-0 cursor-pointer"
                            onClick={() => onViewProductDetails(item.product)}
                          >
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <button
                              onClick={() => onViewProductDetails(item.product)}
                              className="font-heading font-bold text-base text-neutral-900 text-left hover:underline cursor-pointer"
                            >
                              {item.product.name}
                            </button>
                            <p className="text-xs text-neutral-500">
                              {formatBDT(item.product.price)} each
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6">
                          {/* Quantity selector */}
                          <div className="flex items-center border border-neutral-300 rounded-xl overflow-hidden">
                            <button
                              onClick={() =>
                                onUpdateCartQuantity(item.product.id, item.quantity - 1)
                              }
                              className="p-2 text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-10 text-center font-bold text-sm text-neutral-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                onUpdateCartQuantity(item.product.id, item.quantity + 1)
                              }
                              className="p-2 text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <span className="font-heading font-bold text-base text-neutral-900 min-w-[90px] text-right">
                            {formatBDT(item.product.price * item.quantity)}
                          </span>

                          <button
                            onClick={() => onRemoveFromCart(item.product.id)}
                            className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary & Checkout */}
                  <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-neutral-500 font-semibold block">
                        Estimated Cart Subtotal
                      </span>
                      <span className="font-heading font-extrabold text-2xl text-neutral-900">
                        {formatBDT(cartTotal)}
                      </span>
                    </div>

                    <button
                      onClick={onProceedToCheckout}
                      className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm px-6 py-3 rounded-xl cursor-pointer shadow-xs"
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Wishlist */}
          {activeTab === 'wishlist' && (
            <div className="p-6">
              {wishlistProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                  <p className="font-heading font-bold text-lg text-neutral-900 mb-1">
                    Your wishlist is empty
                  </p>
                  <p className="text-xs text-neutral-500 mb-5">
                    Save items you like to review or purchase later.
                  </p>
                  <button
                    onClick={onNavigateToStore}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer"
                  >
                    Browse Catalog
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlistProducts.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div
                          className="w-full relative overflow-hidden bg-neutral-100 cursor-pointer"
                          style={{ aspectRatio: '4/3' }}
                          onClick={() => onViewProductDetails(p)}
                        >
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full object-cover hover:scale-102 transition-transform duration-300"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleWishlist(p.id);
                            }}
                            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-red-500 hover:bg-white shadow-xs cursor-pointer"
                            aria-label="Remove from wishlist"
                          >
                            <Heart className="h-4 w-4 fill-red-500" />
                          </button>
                        </div>

                        <div className="p-4">
                          <p className="text-xs text-neutral-500 mb-1">
                            {p.category}
                          </p>
                          <h3
                            className="font-heading font-bold text-base text-neutral-900 hover:underline cursor-pointer mb-2"
                            onClick={() => onViewProductDetails(p)}
                          >
                            {p.name}
                          </h3>
                          <p className="font-heading font-bold text-lg text-neutral-900">
                            {formatBDT(p.price)}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 pt-0">
                        <button
                          onClick={() => onAddToCart(p, 1)}
                          className="w-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Order History */}
          {activeTab === 'orders' && (
            <div className="p-6">
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                  <p className="font-heading font-bold text-lg text-neutral-900 mb-1">
                    No orders placed yet
                  </p>
                  <p className="text-xs text-neutral-500 mb-5">
                    Your completed orders and receipts will appear here.
                  </p>
                  <button
                    onClick={onNavigateToStore}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.orderId}
                      className="p-5 border border-neutral-200 rounded-2xl bg-white shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-neutral-100 gap-2">
                        <div>
                          <span className="font-mono font-bold text-sm text-neutral-900 block">
                            Order {order.orderId}
                          </span>
                          <span className="text-xs text-neutral-500">
                            {new Date(order.placedAt).toLocaleDateString()} at{' '}
                            {new Date(order.placedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="font-heading font-bold text-lg text-neutral-900 block">
                            {formatBDT(order.total)}
                          </span>
                          <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                            Confirmed
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs text-neutral-700">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>
                              {item.quantity}x {item.product.name}
                            </span>
                            <span className="font-semibold">
                              {formatBDT(item.product.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 pt-3 border-t border-neutral-100 text-xs text-neutral-500">
                        Shipping Address: {order.shippingAddress}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
