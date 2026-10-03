import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Check } from 'lucide-react';
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

  const totalItemsCount = items.reduce((acc, it) => acc + it.quantity, 0);
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
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 z-50">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 ease-out">
          {/* Elegant Header */}
          <div className="px-6 py-4.5 flex items-center justify-between border-b border-stone-200/80 bg-white">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-stone-800" />
              <h2 id="cart-drawer-heading" className="font-heading font-medium text-base text-neutral-900 uppercase tracking-wider">
                Shopping Bag <span className="text-stone-400 font-normal">({totalItemsCount})</span>
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close cart drawer"
              className="p-1.5 text-stone-400 hover:text-neutral-900 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-stone-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4">
                <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <h3 className="font-heading font-medium text-base text-neutral-900 mb-1">Your bag is empty</h3>
                <p className="text-stone-500 text-xs max-w-xs mb-6">
                  Explore our authentic Pakistani collections and luxury home decor.
                </p>
                <button
                  onClick={onClose}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold uppercase tracking-wider px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.product.id} className="py-4 flex gap-4 first:pt-0 last:pb-0">
                  {/* Portrait Thumbnail */}
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-18 h-24 object-cover rounded-md shrink-0 bg-[#f8f7f5] border border-stone-200/60"
                  />

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-heading font-medium text-xs sm:text-sm text-neutral-900 line-clamp-2">
                          {item.product.name}
                        </h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs font-semibold text-neutral-900">
                          {formatBDT(item.product.price)}
                        </span>
                        {(item.selectedColour || item.product.selectedColour) && (
                          <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-medium">
                            {item.selectedColour || item.product.selectedColour}
                          </span>
                        )}
                        {(item.selectedSize || item.product.selectedSize) && (
                          <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-medium">
                            {item.selectedSize || item.product.selectedSize}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity controls and remove */}
                    <div className="flex items-center justify-between mt-3 pt-2">
                      <div className="flex items-center bg-stone-50 rounded border border-stone-200/80 p-0.5">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          aria-label="Decrease item quantity"
                          className="w-5 h-5 flex items-center justify-center text-stone-600 hover:text-neutral-900 hover:bg-white rounded transition-colors cursor-pointer"
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-semibold text-neutral-900 tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          aria-label="Increase item quantity"
                          className="w-5 h-5 flex items-center justify-center text-stone-600 hover:text-neutral-900 hover:bg-white rounded transition-colors cursor-pointer"
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="text-stone-400 hover:text-red-600 transition-colors p-1 flex items-center gap-1 text-[11px] cursor-pointer"
                        aria-label={`Remove ${item.product.name}`}
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Simple, Elegant Summary & Checkout */}
          {items.length > 0 && (
            <div className="p-6 bg-white border-t border-stone-200/80 space-y-4">
              {/* Promo Code Input */}
              <div>
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Promo code"
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-neutral-900 placeholder:text-stone-400 focus:outline-none focus:border-neutral-900"
                  />
                  <button
                    type="submit"
                    className="bg-stone-100 hover:bg-stone-200 text-neutral-900 text-xs font-semibold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </form>

                {appliedPromo && (
                  <div className="mt-2 flex items-center justify-between text-xs text-emerald-800">
                    <span className="flex items-center gap-1 font-medium">
                      <Check className="h-3 w-3" />
                      Promo WELCOME10 applied (10% off)
                    </span>
                    <button
                      onClick={() => setAppliedPromo(null)}
                      className="text-stone-500 hover:text-neutral-900 underline cursor-pointer text-[11px]"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {promoError && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {promoError}
                  </p>
                )}
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-1.5 text-xs text-stone-600 pt-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-neutral-900 tabular-nums">{formatBDT(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span className="tabular-nums">-{formatBDT(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Delivery across Bangladesh</span>
                  <span className="font-semibold text-neutral-900">
                    {shippingCost === 0 ? 'Free' : formatBDT(shippingCost)}
                  </span>
                </div>

                <div className="pt-2 border-t border-stone-100 flex justify-between items-baseline text-sm">
                  <span className="font-medium text-neutral-900 uppercase tracking-wider text-xs">Total</span>
                  <span className="font-heading font-semibold text-base text-neutral-900 tabular-nums">
                    {formatBDT(total)}
                  </span>
                </div>
              </div>

              {/* Checkout Button: Simple, Elegant, Premium */}
              <button
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs tracking-wider uppercase py-3.5 px-6 rounded-lg transition-all cursor-pointer flex items-center justify-between shadow-xs active:scale-98"
              >
                <span>Proceed to Checkout</span>
                <span className="tabular-nums font-semibold">{formatBDT(total)}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
