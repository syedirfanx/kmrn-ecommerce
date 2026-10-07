import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Truck, ShieldCheck, User as UserIcon, CreditCard, Smartphone, Tag } from 'lucide-react';
import { User } from 'firebase/auth';
import { CartItem, OrderConfirmation, UserProfile, PromoCode } from '../types';
import { formatBDT } from '../utils/format';
import { saveUserProfileToDb, saveUserOrderToDb, subscribePromoCodes } from '../services/storeService';
import { BANGLADESH_DISTRICTS, DELIVERY_OPTIONS, DeliveryZoneOption } from '../data/bangladeshDistricts';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  currentUser?: User | null;
  userProfile?: UserProfile | null;
  appliedPromo?: PromoCode | null;
  onApplyPromo?: (promo: PromoCode | null) => void;
  onOpenAuth?: () => void;
  onOrderComplete: (order: OrderConfirmation) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  currentUser,
  userProfile,
  appliedPromo: appliedPromoProp,
  onApplyPromo,
  onOpenAuth,
  onOrderComplete
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    district: 'Dhaka',
    subDistrict: '',
    street: '',
    country: 'Bangladesh'
  });

  const [deliveryZone, setDeliveryZone] = useState<DeliveryZoneOption>('Inside Dhaka City');
  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'bKash'>('Cash on Delivery');
  const [bkashNumber, setBkashNumber] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderConfirmation | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Promo Code States
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [promoInput, setPromoInput] = useState('');
  const [localAppliedPromo, setLocalAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  const appliedPromo = appliedPromoProp !== undefined ? appliedPromoProp : localAppliedPromo;

  const handleSetAppliedPromo = (promo: PromoCode | null) => {
    if (onApplyPromo) {
      onApplyPromo(promo);
    } else {
      setLocalAppliedPromo(promo);
    }
  };

  useEffect(() => {
    if (isOpen && appliedPromo) {
      setPromoInput(appliedPromo.code);
      if (appliedPromo.discountType === 'percentage') {
        setPromoSuccess(`Applied! ${appliedPromo.discountValue}% discount added`);
      } else if (appliedPromo.discountType === 'delivery') {
        setPromoSuccess('Applied! Delivery charge discount added');
      } else {
        setPromoSuccess(`Applied! ${formatBDT(appliedPromo.discountValue)} discount added`);
      }
    } else if (isOpen && !appliedPromo) {
      setPromoSuccess('');
      setPromoInput('');
    }
  }, [isOpen, appliedPromo]);

  useEffect(() => {
    const unsub = subscribePromoCodes((list) => {
      setPromoCodes(list.filter((p) => p.active));
    });
    return () => unsub();
  }, []);

  // Prefill details from user profile or auth if signed in
  useEffect(() => {
    if (isOpen) {
      const defaultAddr =
        userProfile?.addresses?.find((a) => a.isDefault || a.id === userProfile?.defaultAddressId) ||
        userProfile?.addresses?.[0];

      const initialDistrict = defaultAddr?.district || userProfile?.district || 'Dhaka';
      const initialZone: DeliveryZoneOption =
        (defaultAddr?.deliveryZone as DeliveryZoneOption) ||
        (userProfile?.deliveryZone as DeliveryZoneOption) ||
        (initialDistrict === 'Dhaka' ? 'Inside Dhaka City' : 'Outside Dhaka City');

      setFormData({
        fullName: defaultAddr?.recipientName || userProfile?.displayName || currentUser?.displayName || '',
        email: userProfile?.email || currentUser?.email || '',
        phone: defaultAddr?.phone || userProfile?.phone || '',
        district: initialDistrict,
        subDistrict: defaultAddr?.subDistrict || userProfile?.subDistrict || '',
        street: defaultAddr?.street || userProfile?.street || userProfile?.address || '',
        country: userProfile?.country || 'Bangladesh'
      });
      setDeliveryZone(initialZone);
      setPaymentMethod((userProfile?.preferredPaymentMethod as 'Cash on Delivery' | 'bKash') || 'Cash on Delivery');
      setBkashNumber(userProfile?.preferredBkashNumber || '');
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
  const baseShipping = deliveryZone === 'Inside Dhaka City' ? 80 : 150;

  // Calculate discount based on promo code type (percentage, fixed amount, or delivery charge)
  let discountAmount = 0;
  let shipping = baseShipping;

  if (appliedPromo) {
    if (appliedPromo.discountType === 'percentage') {
      discountAmount = Math.round((subtotal * (appliedPromo.discountValue || 0)) / 100);
    } else if (appliedPromo.discountType === 'delivery') {
      // Delivery charge discount: if discountValue is 0 or >= baseShipping, delivery is free; otherwise reduce by discountValue
      if (!appliedPromo.discountValue || appliedPromo.discountValue >= baseShipping) {
        discountAmount = baseShipping;
        shipping = 0;
      } else {
        discountAmount = appliedPromo.discountValue;
        shipping = Math.max(0, baseShipping - appliedPromo.discountValue);
      }
    } else {
      // Fixed amount discount
      discountAmount = Math.min(subtotal, appliedPromo.discountValue || 0);
    }
  }

  const total = Math.max(0, subtotal + shipping - (appliedPromo?.discountType === 'delivery' ? 0 : discountAmount));

  const handleApplyPromo = () => {
    setPromoError('');
    setPromoSuccess('');
    const cleanCode = promoInput.trim().toUpperCase();
    if (!cleanCode) return;

    const matched = promoCodes.find((p) => p.code.toUpperCase() === cleanCode);
    if (!matched) {
      setPromoError('Invalid promo code');
      return;
    }
    if (matched.hasMinOrder && matched.minOrderAmount && subtotal < matched.minOrderAmount) {
      setPromoError(`Minimum order of ${formatBDT(matched.minOrderAmount)} required for this code`);
      return;
    }

    handleSetAppliedPromo(matched);
    if (matched.discountType === 'percentage') {
      setPromoSuccess(`Applied! ${matched.discountValue}% discount added`);
    } else if (matched.discountType === 'delivery') {
      setPromoSuccess('Applied! Delivery charge discount added');
    } else {
      setPromoSuccess(`Applied! ${formatBDT(matched.discountValue)} discount added`);
    }
  };

  const handleRemovePromo = () => {
    handleSetAppliedPromo(null);
    setPromoInput('');
    setPromoError('');
    setPromoSuccess('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // When district changes, automatically adjust the delivery zone
    if (name === 'district') {
      if (value === 'Dhaka') {
        setDeliveryZone('Inside Dhaka City');
      } else {
        setDeliveryZone('Outside Dhaka City');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Strict validation for mandatory fields
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
    if (!formData.district.trim()) {
      setErrorMsg('Please select a district.');
      return;
    }
    if (!formData.subDistrict.trim()) {
      setErrorMsg('Sub District / Thana / Union is required.');
      return;
    }
    if (!formData.street.trim()) {
      setErrorMsg('Street address is required.');
      return;
    }

    if (paymentMethod === 'bKash') {
      if (!bkashNumber.trim()) {
        setErrorMsg('Please enter your bKash phone number.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const fullShippingAddress = `${formData.street.trim()}, ${formData.subDistrict.trim()}, ${formData.district.trim()}, Bangladesh`;

      // 1. If signed in, update their user profile with address and district in Firebase
      if (currentUser) {
        await saveUserProfileToDb(currentUser.uid, {
          displayName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          street: formData.street.trim(),
          address: formData.street.trim(),
          district: formData.district.trim(),
          subDistrict: formData.subDistrict.trim(),
          deliveryZone: deliveryZone,
          city: formData.district.trim(),
          country: formData.country.trim(),
          preferredPaymentMethod: paymentMethod,
          preferredBkashNumber: paymentMethod === 'bKash' ? bkashNumber.trim() : undefined
        });
      }

      // 2. Build full order
      const order: OrderConfirmation = {
        orderId: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
        customerName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        street: formData.street.trim(),
        city: formData.district.trim(),
        district: formData.district.trim(),
        subDistrict: formData.subDistrict.trim(),
        deliveryZone: deliveryZone,
        country: formData.country.trim(),
        shippingAddress: fullShippingAddress,
        items: items.map((item) => ({
          quantity: Number(item.quantity) || 1,
          selectedColour: item.selectedColour,
          selectedSize: item.selectedSize,
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
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        promoCode: appliedPromo ? appliedPromo.code : undefined,
        total: Number(total) || 0,
        status: 'Processing',
        paymentMethod: paymentMethod,
        bkashNumber: paymentMethod === 'bKash' ? bkashNumber.trim() : undefined,
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
                <span className="text-neutral-600">District & Area</span>
                <span className="font-medium text-neutral-900 text-right">{completedOrder.subDistrict}, {completedOrder.district}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-stone-200/60">
                <span className="text-neutral-600">Shipping Address</span>
                <span className="font-medium text-neutral-900 text-right max-w-xs">{completedOrder.shippingAddress}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-stone-200/60">
                <span className="text-neutral-600">Delivery Option</span>
                <span className="font-semibold text-neutral-900">{completedOrder.deliveryZone} ({formatBDT(completedOrder.shipping)})</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-stone-200/60">
                <span className="text-neutral-600">Payment Method</span>
                <span className="font-bold text-neutral-900">
                  {completedOrder.paymentMethod}
                  {completedOrder.bkashNumber && (
                    <span className="block text-xs text-stone-500 font-normal">bKash: {completedOrder.bkashNumber}</span>
                  )}
                </span>
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
              {completedOrder.items.map((it, itIdx) => (
                <div key={`${it.product.id}-${it.selectedColour || ''}-${it.selectedSize || ''}-${itIdx}`} className="py-2 flex items-center justify-between text-sm bg-white p-2.5 rounded-xl shadow-xs border border-stone-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={it.product.image}
                      alt={it.product.name}
                      className="w-10 h-12 rounded-lg object-cover bg-neutral-100"
                    />
                    <div>
                      <p className="font-heading font-bold text-neutral-900 text-xs sm:text-sm">{it.product.name}</p>
                      <p className="text-xs text-neutral-500">Qty: {it.quantity}</p>
                      {(it.selectedColour || it.selectedSize) && (
                        <p className="text-[11px] text-stone-500">
                          {[it.selectedColour, it.selectedSize].filter(Boolean).join(' • ')}
                        </p>
                      )}
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
              </div>

              <div className="space-y-3.5">
                {/* Saved Addresses Quick Selector */}
                {userProfile?.addresses && userProfile.addresses.length > 0 && (
                  <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/90 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900">
                        Choose Saved Delivery Address
                      </span>
                      <span className="text-[11px] text-stone-500 font-medium">
                        {userProfile.addresses.length} saved
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {userProfile.addresses.map((addr) => {
                        const isSelected =
                          formData.street === addr.street &&
                          formData.district === addr.district &&
                          formData.subDistrict === addr.subDistrict;
                        return (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => {
                              const zone: DeliveryZoneOption =
                                (addr.deliveryZone as DeliveryZoneOption) ||
                                (addr.district === 'Dhaka' ? 'Inside Dhaka City' : 'Outside Dhaka City');
                              setFormData((prev) => ({
                                ...prev,
                                fullName: addr.recipientName || prev.fullName,
                                phone: addr.phone || prev.phone,
                                district: addr.district,
                                subDistrict: addr.subDistrict,
                                street: addr.street
                              }));
                              setDeliveryZone(zone);
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'border-neutral-900 bg-white ring-1 ring-neutral-900/10 shadow-xs'
                                : 'border-stone-200 bg-white hover:border-stone-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-bold text-xs text-neutral-900 truncate">
                                {addr.label || 'Delivery Address'}
                              </span>
                              {addr.isDefault && (
                                <span className="text-[9px] font-extrabold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-full">
                                  DEFAULT
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-700 truncate">{addr.street}</p>
                            <p className="text-[10px] text-stone-500 truncate">
                              {addr.subDistrict}, {addr.district}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

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

                {/* District Dropdown Option */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1">
                      District *
                    </label>
                    <select
                      name="district"
                      required
                      value={formData.district}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs cursor-pointer font-medium"
                    >
                      {BANGLADESH_DISTRICTS.map((dist) => (
                        <option key={dist.name} value={dist.name}>
                          {dist.name} ({dist.division} Division)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sub District / Thana / Union Field */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1">
                      Sub District / Thana / Union *
                    </label>
                    <input
                      type="text"
                      required
                      name="subDistrict"
                      placeholder="e.g. Dhanmondi, Gulshan, Savar, Kotwali"
                      value={formData.subDistrict}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                    />
                  </div>
                </div>

                {/* Street Address */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">
                    Street Address / House & Road *
                  </label>
                  <input
                    type="text"
                    required
                    name="street"
                    placeholder="House number, Road name, Block or Village details"
                    value={formData.street}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Option Selection (Inside Dhaka City 80 taka / Outside Dhaka City 150 taka) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Delivery Option *
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DELIVERY_OPTIONS.map((opt) => {
                  const isSelected = deliveryZone === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setDeliveryZone(opt.id)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-neutral-900 bg-stone-50 shadow-xs ring-1 ring-neutral-900/10'
                          : 'border-stone-200 bg-white hover:border-stone-300 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-heading font-bold text-xs sm:text-sm text-neutral-900">
                          {opt.label}
                        </span>
                        <div
                          className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-neutral-900' : 'border-stone-300'
                          }`}
                        >
                          {isSelected && <div className="h-2 w-2 rounded-full bg-neutral-900" />}
                        </div>
                      </div>
                      <div className="flex items-baseline justify-end mt-1">
                        <span className="font-heading font-extrabold text-sm text-neutral-900 shrink-0 ml-2">
                          {formatBDT(opt.price)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Method Selection (COD / bKash Payment) */}
            <div>
              <span className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2">
                Payment Method *
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {/* 1. Cash on Delivery Card */}
                <div
                  onClick={() => setPaymentMethod('Cash on Delivery')}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                    paymentMethod === 'Cash on Delivery'
                      ? 'border-neutral-900 bg-stone-50 shadow-xs'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-neutral-900">Cash on Delivery</p>
                    </div>
                  </div>
                  <div
                    className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'Cash on Delivery' ? 'border-neutral-900' : 'border-stone-300'
                    }`}
                  >
                    {paymentMethod === 'Cash on Delivery' && <div className="h-2 w-2 rounded-full bg-neutral-900" />}
                  </div>
                </div>

                {/* 2. bKash Payment Card */}
                <div
                  onClick={() => setPaymentMethod('bKash')}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                    paymentMethod === 'bKash'
                      ? 'border-[#e2136e] bg-pink-50/50 shadow-xs'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-[#e2136e] text-white flex items-center justify-center shrink-0 font-extrabold text-xs">
                      bK
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-neutral-900">bKash Payment</p>
                    </div>
                  </div>
                  <div
                    className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'bKash' ? 'border-[#e2136e]' : 'border-stone-300'
                    }`}
                  >
                    {paymentMethod === 'bKash' && <div className="h-2 w-2 rounded-full bg-[#e2136e]" />}
                  </div>
                </div>
              </div>

              {/* bKash Payment Details Box */}
              {paymentMethod === 'bKash' && (
                <div className="p-4 bg-pink-50/60 border border-pink-200 rounded-2xl animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                    Your bKash Phone / Account Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={bkashNumber}
                    onChange={(e) => setBkashNumber(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full bg-white border border-pink-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#e2136e] focus:ring-1 focus:ring-[#e2136e]"
                  />
                </div>
              )}
            </div>

            {/* Promo Code Input Section */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
              <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Promo Code
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => {
                      setPromoInput(e.target.value.toUpperCase());
                      setPromoError('');
                    }}
                    placeholder="ENTER CODE"
                    className="w-full uppercase font-mono text-xs bg-white border border-stone-300 rounded-xl pl-9 pr-3 py-2.5 text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
                {appliedPromo ? (
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={!promoInput.trim()}
                    className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    Apply
                  </button>
                )}
              </div>
              {promoSuccess && (
                <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5 pt-0.5">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{promoSuccess}</span>
                </p>
              )}
              {promoError && (
                <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1.5 pt-0.5">
                  <span>{promoError}</span>
                </p>
              )}
            </div>

            {/* Order Cost Breakdown */}
            <div className="p-4 bg-neutral-50 rounded-2xl space-y-2 border border-stone-200/80">
              <div className="flex justify-between text-xs text-neutral-600">
                <span>Subtotal ({items.length} items)</span>
                <span>{formatBDT(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-600">
                <span>Shipping ({deliveryZone})</span>
                <span className="font-semibold text-neutral-900">{formatBDT(shipping)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-xs text-emerald-700 font-bold">
                  <span>Discount ({appliedPromo?.code})</span>
                  <span>-{formatBDT(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-neutral-900 pt-2 border-t border-stone-200">
                <span>Total Payable</span>
                <span className="font-heading font-extrabold text-xl text-neutral-900">{formatBDT(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white font-bold text-base py-3.5 px-6 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              <ShieldCheck className="h-5 w-5 text-stone-200" />
              <span>
                {isSubmitting ? 'Confirming Order...' : 'Place Order'}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
