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
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-neutral-200">
          {/* Header */}
          <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="h-5 w-5 text-neutral-900" />
              <h2 id="cart-drawer-heading" className="font-heading font-extrabold text-xl sm:text-2xl text-neutral-900">
                Your Cart ({items.reduce((acc, it) => acc + it.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close cart drawer"
              className="p-2 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 divide-y divide-neutral-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4">
                <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-4">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <h3 className="font-heading font-bold text-xl text-neutral-900 mb-1">Your cart is empty</h3>
                <p className="text-neutral-500 text-base max-w-xs mb-6">
                  Select products from our collection to add them to your cart.
                </p>
                <button
                  onClick={onClose}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-base px-6 py-3 rounded-xl transition-colors cursor-pointer"
                >
                  Continue Browsing
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.product.id} className="py-4 flex gap-4">
                  {/* Thumbnail */}
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded-xl border border-neutral-200 shrink-0 bg-neutral-50"
                  />

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-heading font-bold text-base text-neutral-900 line-clamp-1">
                          {item.product.name}
                        </h4>
                        <span className="font-heading font-bold text-base text-neutral-900">
                          {formatBDT(item.product.price * item.quantity)}
                        </span>
                      </div>
                    </div>

                    {/* Quantity controls and remove */}
                    <div className="flex items-center justify-between mt-3 pt-2">
                      <div className="flex items-center border border-neutral-300 rounded-lg bg-neutral-50">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          aria-label="Decrease item quantity"
                          className="p-1.5 text-neutral-600 hover:text-neutral-900 cursor-pointer"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-3 font-heading font-bold text-sm text-neutral-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          aria-label="Increase item quantity"
                          className="p-1.5 text-neutral-600 hover:text-neutral-900 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="text-neutral-400 hover:text-red-600 transition-colors p-1.5 flex items-center gap-1 text-xs cursor-pointer font-medium"
                        aria-label={`Remove ${item.product.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Calculations */}
          {items.length > 0 && (
            <div className="border-t border-neutral-200 px-5 sm:px-6 py-5 bg-neutral-50/70 space-y-4">
              {/* Promo code input */}
              <form onSubmit={handleApplyPromo} className="space-y-1.5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="Promo code (WELCOME10)"
                      className="w-full bg-white border border-neutral-300 rounded-lg pl-9 pr-3 py-2 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-neutral-800 hover:bg-neutral-900 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {promoError && (
                  <p className="text-xs text-red-600">{promoError}</p>
                )}
                {appliedPromo && (
                  <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                    <span className="flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Code {appliedPromo} applied (10% off)
                    </span>
                    <button
                      type="button"
                      onClick={() => setAppliedPromo(null)}
                      className="text-neutral-500 hover:text-neutral-900 underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </form>

              {/* Price Breakdown */}
              <div className="space-y-2 text-sm text-neutral-600 border-t border-neutral-200/70 pt-3">
                <div className="flex justify-between text-base">
                  <span>Subtotal</span>
                  <span className="font-semibold text-neutral-900">{formatBDT(subtotal)}</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between text-emerald-700 text-base">
                    <span>Discount (10%)</span>
                    <span>-{formatBDT(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base">
                  <span>Shipping</span>
                  <span>{shippingCost === 0 ? 'Free' : formatBDT(shippingCost)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-neutral-900 pt-2 border-t border-neutral-200">
                  <span className="font-heading">Total</span>
                  <span className="font-heading font-extrabold text-xl">{formatBDT(total)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-base py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer active:scale-98"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
