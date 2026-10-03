import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Truck, ShieldCheck, User as UserIcon } from 'lucide-react';
import { User } from 'firebase/auth';
import { CartItem, OrderConfirmation, UserProfile } from '../types';
import { formatBDT } from '../utils/format';
import { saveUserProfileToDb, saveUserOrderToDb } from '../services/storeService';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  currentUser?: User | null;
  userProfile?: UserProfile | null;
  onOpenAuth?: () => void;
  onOrderComplete: (order: OrderConfirmation) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  currentUser,
  userProfile,
  onOpenAuth,
  onOrderComplete
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    country: 'Bangladesh'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderConfirmation | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Prefill details from user profile or auth if signed in
  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: userProfile?.displayName || currentUser?.displayName || '',
        email: userProfile?.email || currentUser?.email || '',
        phone: userProfile?.phone || '',
        street: userProfile?.street || userProfile?.address || '',
        city: userProfile?.city || '',
        country: userProfile?.country || 'Bangladesh'
      });
      setErrorMsg('');
      setCompletedOrder(null);
    }
  }, [isOpen, userProfile, currentUser]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !completedOrder) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, completedOrder, onClose]);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = subtotal >= 15000 ? 0 : 500;
  const total = subtotal + shipping;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Strict validation for mandatory fields: name, phone, street, city, country
    if (!formData.fullName.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMsg('Phone number is required.');
      return;
    }
    if (!formData.email.trim()) {
      setErrorMsg('Email address is required.');
      return;
    }
    if (!formData.street.trim()) {
      setErrorMsg('Street address is required.');
      return;
    }
    if (!formData.city.trim()) {
      setErrorMsg('City is required.');
      return;
    }
    if (!formData.country.trim()) {
      setErrorMsg('Country is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. If signed in, update their user profile with address and phone in Firebase
      if (currentUser) {
        await saveUserProfileToDb(currentUser.uid, {
          displayName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          street: formData.street.trim(),
          address: formData.street.trim(),
          city: formData.city.trim(),
          country: formData.country.trim()
        });
      }

      // 2. Build full order
      const order: OrderConfirmation = {
        orderId: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
        customerName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        street: formData.street.trim(),
        city: formData.city.trim(),
        country: formData.country.trim(),
        shippingAddress: `${formData.street.trim()}, ${formData.city.trim()}, ${formData.country.trim()}`,
        items: items.map((item) => ({
          quantity: Number(item.quantity) || 1,
          product: {
            ...item.product,
            specs: item.product.specs || [],
            additionalImages: item.product.additionalImages || [],
            details: item.product.details || '',
            inStock: item.product.inStock !== false,
            rating: item.product.rating || 0,
            reviewsCount: item.product.reviewsCount || 0
          }
        })),
        subtotal: Number(subtotal) || 0,
        shipping: Number(shipping) || 0,
        total: Number(total) || 0,
        status: 'Processing',
        paymentMethod: 'Cash on Delivery',
        userId: currentUser?.uid || '',
        isGuest: !currentUser,
        customerType: currentUser ? 'Registered Account' : 'Guest Checkout',
        placedAt: new Date().toISOString()
      };

      // 3. Save order to Firestore (both central admin orders and user subcollection)
      await saveUserOrderToDb(currentUser?.uid, order);

      setCompletedOrder(order);
      onOrderComplete(order);
    } catch {
      setErrorMsg('An error occurred while placing your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    setCompletedOrder(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
    >
      <div className="fixed inset-0" onClick={completedOrder ? undefined : onClose} />

      <div className="relative bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl z-10 my-4 sm:my-8">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between bg-neutral-50 sticky top-0 z-20 border-b border-stone-200/80">
          <h2 id="checkout-modal-title" className="font-heading font-extrabold text-xl sm:text-2xl text-neutral-900">
            {completedOrder ? 'Order Confirmed' : 'Checkout'}
          </h2>
          {!completedOrder && (
            <button
              onClick={onClose}
              aria-label="Close checkout"
              className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-full hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Order Completed View */}
        {completedOrder ? (
          <div className="p-5 sm:p-8 space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-10 w-10" />
              </div>
              <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-900 mb-1">
                Order Placed Successfully
              </h3>
              <p className="text-sm text-neutral-600">
                Confirmation details have been saved for <span className="font-semibold text-neutral-900">{completedOrder.customerName}</span>.
              </p>
            </div>

            <div className="bg-neutral-50 rounded-2xl p-5 space-y-3 text-sm border border-stone-200/80">
              <div className="flex justify-between pb-2 border-b border-stone-200/60">
                <span className="text-neutral-600">Order ID</span>
                <span className="font-mono font-bold text-neutral-900">{completedOrder.orderId}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-stone-200/60">
                <span className="text-neutral-600">Phone</span>
                <span className="font-medium text-neutral-900">{completedOrder.phone}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-stone-200/60">
                <span className="text-neutral-600">Shipping Address</span>
                <span className="font-medium text-neutral-900 text-right max-w-xs">{completedOrder.shippingAddress}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-stone-200/60">
                <span className="text-neutral-600">Payment</span>
                <span className="font-medium text-neutral-900">{completedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-neutral-900 font-bold">Total Amount</span>
                <span className="font-heading font-extrabold text-xl text-neutral-900">{formatBDT(completedOrder.total)}</span>
              </div>
            </div>

            <div className="bg-neutral-50 rounded-2xl p-4 space-y-2 border border-stone-200/80">
              <span className="font-semibold text-xs uppercase tracking-wider text-neutral-400 block mb-2">
                Order Items ({completedOrder.items.length})
              </span>
              {completedOrder.items.map((it) => (
                <div key={it.product.id} className="py-2 flex items-center justify-between text-sm bg-white p-2.5 rounded-xl shadow-xs border border-stone-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={it.product.image}
                      alt={it.product.name}
                      className="w-10 h-12 rounded-lg object-cover bg-neutral-100"
                    />
                    <div>
                      <p className="font-heading font-bold text-neutral-900 text-xs sm:text-sm">{it.product.name}</p>
                      <p className="text-xs text-neutral-500">Qty: {it.quantity}</p>
                    </div>
                  </div>
                  <span className="font-heading font-bold text-neutral-900 text-xs sm:text-sm">{formatBDT(it.product.price * it.quantity)}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleFinish}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-base py-3.5 px-6 rounded-xl transition-colors cursor-pointer shadow-md"
            >
              Continue Shopping
            </button>
          </div>
        ) : !currentUser ? (
          /* Sign-in Required Screen (No Guest Checkout) */
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="h-16 w-16 bg-stone-100 text-neutral-900 rounded-full flex items-center justify-center mx-auto mb-2 shadow-xs">
              <UserIcon className="h-8 w-8 stroke-[1.8]" />
            </div>
            <div className="space-y-2">
              <h3 className="font-heading font-bold text-xl sm:text-2xl text-neutral-900">
                Sign in to complete checkout
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
                An account is required to place your order. Your delivery address and order tracking will be automatically saved and synced to your profile.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth?.();
                }}
                className="w-full sm:w-auto px-8 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md transition-all"
              >
                Sign In / Register
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3.5 bg-stone-100 hover:bg-stone-200 text-neutral-800 font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Form View */
          <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl">
                {errorMsg}
              </div>
            )}

            {/* Mandatory Shipping Details */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-bold text-sm text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                  <Truck className="h-4 w-4 text-neutral-600" />
                  Delivery Information
                </h3>
                {currentUser && (
                  <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                    Account Synced
                  </span>
                )}
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    name="fullName"
                    placeholder="Recipient full name"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      name="phone"
                      placeholder="e.g. +880 1554-555071"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      name="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    name="street"
                    placeholder="House, Road, Block / Area"
                    value={formData.street}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1">
                      City / District *
                    </label>
                    <input
                      type="text"
                      required
                      name="city"
                      placeholder="e.g. Dhaka, Chittagong, Sylhet"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1">
                      Country *
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                    >
                      <option value="Bangladesh">Bangladesh</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method: Cash on Delivery Only */}
            <div>
              <span className="block text-xs font-semibold text-neutral-800 mb-2 uppercase tracking-wider">
                Payment Method
              </span>

              <div className="p-4 rounded-2xl bg-neutral-900 text-white flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-neutral-800 flex items-center justify-center">
                    <Truck className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Cash on Delivery</p>
                    <p className="text-xs text-stone-300">Pay cash upon delivery at your doorstep</p>
                  </div>
                </div>
                <div className="h-5 w-5 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-white" />
                </div>
              </div>
            </div>

            {/* Order Cost Breakdown */}
            <div className="p-4 bg-neutral-50 rounded-2xl space-y-2 border border-stone-200/80">
              <div className="flex justify-between text-xs text-neutral-600">
                <span>Subtotal</span>
                <span>{formatBDT(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-600">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : formatBDT(shipping)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-neutral-900 pt-1 border-t border-stone-200">
                <span>Total Payable</span>
                <span>{formatBDT(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white font-bold text-base py-3.5 px-6 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              <ShieldCheck className="h-5 w-5 text-stone-200" />
              <span>
                {isSubmitting ? 'Confirming Order...' : `Place Order with Cash on Delivery`}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
