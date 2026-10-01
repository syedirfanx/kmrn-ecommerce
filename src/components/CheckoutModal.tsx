import React, { useState, useEffect } from 'react';
import { X, CheckCircle, CreditCard, ShieldCheck, Truck } from 'lucide-react';
import { CartItem, OrderConfirmation } from '../types';
import { formatBDT } from '../utils/format';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onOrderComplete: (order: OrderConfirmation) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  onOrderComplete
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Bangladesh',
    paymentMethod: 'card',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderConfirmation | null>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const order: OrderConfirmation = {
        orderId: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
        customerName: formData.fullName,
        email: formData.email,
        shippingAddress: `${formData.address}, ${formData.city} ${formData.postalCode}, ${formData.country}`,
        items: [...items],
        subtotal,
        shipping,
        total,
        placedAt: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      };

      setCompletedOrder(order);
      setIsSubmitting(false);
      onOrderComplete(order);
    }, 600);
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

      <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl z-10 my-4 sm:my-8">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between bg-neutral-50 sticky top-0 z-20">
          <h2 id="checkout-modal-title" className="font-heading font-extrabold text-xl sm:text-2xl text-neutral-900">
            {completedOrder ? 'Order Confirmation' : 'Checkout'}
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
                Thank you for your purchase
              </h3>
              <p className="text-sm text-neutral-600">
                Order confirmation has been sent to <span className="font-semibold text-neutral-900">{completedOrder.email}</span>.
              </p>
            </div>

            <div className="bg-neutral-50 rounded-2xl p-5 space-y-3 text-sm">
              <div className="flex justify-between pb-2">
                <span className="text-neutral-600">Order Number</span>
                <span className="font-mono font-bold text-neutral-900">{completedOrder.orderId}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-neutral-600">Date</span>
                <span className="font-medium text-neutral-900">{completedOrder.placedAt}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-neutral-600">Shipping Address</span>
                <span className="font-medium text-neutral-900 text-right max-w-xs">{completedOrder.shippingAddress}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-neutral-900 font-bold">Total Paid</span>
                <span className="font-heading font-extrabold text-xl text-neutral-900">{formatBDT(completedOrder.total)}</span>
              </div>
            </div>

            <div className="bg-neutral-50 rounded-2xl p-4 space-y-2">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-neutral-400 mb-2">
                Purchased Items ({completedOrder.items.length})
              </h4>
              {completedOrder.items.map((it) => (
                <div key={it.product.id} className="py-2 flex items-center justify-between text-sm bg-white p-2.5 rounded-xl shadow-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={it.product.image}
                      alt={it.product.name}
                      className="w-10 h-10 rounded-lg object-cover bg-neutral-100"
                    />
                    <div>
                      <p className="font-heading font-bold text-neutral-900">{it.product.name}</p>
                      <p className="text-xs text-neutral-500">Qty: {it.quantity}</p>
                    </div>
                  </div>
                  <span className="font-heading font-bold text-neutral-900">{formatBDT(it.product.price * it.quantity)}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleFinish}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-base py-3.5 px-6 rounded-xl transition-colors cursor-pointer shadow-md"
            >
              Back to Store
            </button>
          </div>
        ) : (
          /* Checkout Form View */
          <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-6">
            {/* Contact & Shipping Section */}
            <div>
              <h3 className="font-heading font-bold text-base text-neutral-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Truck className="h-4 w-4 text-neutral-600" />
                Shipping Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    required
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">
                    City / Division
                  </label>
                  <input
                    type="text"
                    required
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">
                    Country
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

            {/* Payment Section */}
            <div>
              <h3 className="font-heading font-bold text-base text-neutral-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-neutral-600" />
                Payment Method
              </h3>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <label className={`p-4 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${formData.paymentMethod === 'card' ? 'bg-neutral-900 text-white shadow-md' : 'bg-neutral-50 text-neutral-700'}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={formData.paymentMethod === 'card'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <CreditCard className="h-5 w-5 mb-1" />
                  <span className="text-xs font-bold">Credit / Debit Card</span>
                </label>

                <label className={`p-4 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${formData.paymentMethod === 'cod' ? 'bg-neutral-900 text-white shadow-md' : 'bg-neutral-50 text-neutral-700'}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={formData.paymentMethod === 'cod'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <Truck className="h-5 w-5 mb-1" />
                  <span className="text-xs font-bold">Cash on Delivery</span>
                </label>
              </div>

              {formData.paymentMethod === 'card' && (
                <div className="p-4 bg-neutral-50 rounded-2xl space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      required={formData.paymentMethod === 'card'}
                      name="cardNumber"
                      placeholder="4000 1234 5678 9010"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        required={formData.paymentMethod === 'card'}
                        name="cardExpiry"
                        placeholder="MM/YY"
                        value={formData.cardExpiry}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1">
                        CVC
                      </label>
                      <input
                        type="text"
                        required={formData.paymentMethod === 'card'}
                        name="cardCvc"
                        placeholder="123"
                        value={formData.cardCvc}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Total & Submit */}
            <div className="p-4 bg-neutral-50 rounded-2xl space-y-2">
              <div className="flex justify-between text-xs text-neutral-600">
                <span>Subtotal</span>
                <span>{formatBDT(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-600">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : formatBDT(shipping)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-neutral-900 pt-1">
                <span>Total</span>
                <span>{formatBDT(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#283618] hover:bg-[#1f2b12] disabled:bg-neutral-400 text-white font-bold text-base py-3.5 px-6 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-98 border border-[#445837]"
            >
              <ShieldCheck className="h-5 w-5 text-stone-200" />
              <span>
                {isSubmitting
                  ? 'Processing Order...'
                  : formData.paymentMethod === 'cod'
                    ? `Confirm Order (${formatBDT(total)})`
                    : `Pay ${formatBDT(total)}`}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
