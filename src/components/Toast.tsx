import React, { useEffect } from 'react';
import { Check, ShoppingBag, X } from 'lucide-react';

interface ToastProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenCart?: () => void;
  showCartButton?: boolean;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  isOpen,
  onClose,
  onOpenCart,
  showCartButton = false
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex items-center gap-3 bg-neutral-900 text-white px-4 sm:px-5 py-3.5 sm:py-4 rounded-xl shadow-2xl sm:max-w-md border border-neutral-800 animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
        <Check className="h-4 w-4" />
      </div>
      <p className="text-sm sm:text-base font-medium flex-1 text-neutral-100 truncate">{message}</p>
      {showCartButton && onOpenCart && (
        <button
          onClick={onOpenCart}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-neutral-200 hover:text-white underline underline-offset-4 px-2 py-1 transition-colors shrink-0 cursor-pointer"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Cart</span>
        </button>
      )}
      <button
        onClick={onClose}
        aria-label="Close notification"
        className="text-neutral-400 hover:text-white p-1 rounded-md transition-colors shrink-0 cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
