import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Tag, Check } from 'lucide-react';
import { CartItem } from '../types';
import { formatBDT } from '../utils/format';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout
}) => {
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = appliedPromo === 'WELCOME10' ? Math.round(subtotal * 0.1) : 0;
  const shippingThreshold = 15000;
  const shippingCost = subtotal === 0 ? 0 : subtotal >= shippingThreshold ? 0 : 500;
  const total = Math.max(0, subtotal - discountAmount + shippingCost);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    const code = promoInput.trim().toUpperCase();
    if (code === 'WELCOME10') {
      setAppliedPromo('WELCOME10');
      setPromoInput('');
    } else {
      setPromoError('Invalid promo code. Use code WELCOME10 for 10% off.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-heading"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between bg-neutral-50">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="h-5 w-5 text-neutral-900" />
              <h2 id="cart-drawer-heading" className="font-heading font-extrabold text-xl sm:text-2xl text-neutral-900">
                Your Cart ({items.reduce((acc, it) => acc + it.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close cart drawer"
              className="p-2 text-neutral-500 hover:text-neutral-900 rounded-full hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4">
                <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-4">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <h3 className="font-heading font-bold text-xl text-neutral-900 mb-1">Your cart is empty</h3>
                <p className="text-neutral-500 text-sm max-w-xs mb-6">
                  Select products from our collection to add them to your cart.
                </p>
                <button
                  onClick={onClose}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  Continue Browsing
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.product.id} className="p-3.5 bg-neutral-50 rounded-2xl flex gap-3.5 shadow-xs">
                  {/* Thumbnail */}
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-18 h-18 object-cover rounded-xl shrink-0 bg-white shadow-xs"
                  />

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-heading font-bold text-sm text-neutral-900 line-clamp-1">
                          {item.product.name}
                        </h4>
                        <span className="font-heading font-extrabold text-sm text-neutral-900">
                          {formatBDT(item.product.price * item.quantity)}
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-400">
                        {formatBDT(item.product.price)} each
                      </span>
                    </div>

                    {/* Quantity controls and remove */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center bg-white rounded-lg px-1.5 py-0.5 shadow-xs">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          aria-label="Decrease item quantity"
                          className="p-1 text-neutral-600 hover:text-neutral-900 cursor-pointer"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-2 font-heading font-bold text-xs text-neutral-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          aria-label="Increase item quantity"
                          className="p-1 text-neutral-600 hover:text-neutral-900 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="text-neutral-400 hover:text-red-600 transition-colors p-1.5 flex items-center gap-1 text-xs cursor-pointer font-medium"
                        aria-label={`Remove ${item.product.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer / Summary */}
          {items.length > 0 && (
            <div className="p-5 sm:p-6 bg-neutral-50 shadow-lg space-y-4">
              {/* Promo Code Input */}
              <div>
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Promo code (WELCOME10)"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="w-full bg-white rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-900 uppercase font-semibold focus:outline-none focus:ring-2 focus:ring-neutral-900 shadow-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    Apply
                  </button>
                </form>

                {appliedPromo && (
                  <div className="mt-2 flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg">
                    <span className="flex items-center gap-1 font-semibold">
                      <Check className="h-3.5 w-3.5" />
                      Promo code WELCOME10 applied (10% off)
                    </span>
                    <button
                      onClick={() => setAppliedPromo(null)}
                      className="text-emerald-800 hover:underline cursor-pointer font-bold"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {promoError && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">
                    {promoError}
                  </p>
                )}
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-2 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-neutral-900">{formatBDT(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Promo Discount</span>
                    <span>-{formatBDT(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Shipping across Bangladesh</span>
                  <span className="font-semibold text-neutral-900">
                    {shippingCost === 0 ? 'Free' : formatBDT(shippingCost)}
                  </span>
                </div>

                <div className="pt-2 flex justify-between items-baseline text-sm">
                  <span className="font-heading font-extrabold text-neutral-900">Estimated Total</span>
                  <span className="font-heading font-extrabold text-xl text-neutral-900">
                    {formatBDT(total)}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full flex items-center justify-center gap-2 bg-[#283618] hover:bg-[#1f2b12] text-white font-bold text-sm py-3.5 px-6 rounded-xl transition-all shadow-md cursor-pointer active:scale-98 border border-[#445837]"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-4 w-4 text-stone-200" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
