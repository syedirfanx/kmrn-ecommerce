import React, { useState } from 'react';
import { Star, Plus, Minus, Heart, Check } from 'lucide-react';
import { Product } from '../types';
import { formatBDT } from '../utils/format';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
  onViewDetails: (product: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onViewDetails,
  isWishlisted = false,
  onToggleWishlist
}) => {
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, qty);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <article className="group bg-white rounded-xl overflow-hidden flex flex-col transition-all duration-300 border border-stone-200/80 hover:border-stone-400/80 hover:shadow-md relative">
      {/* Product Thumbnail - Simple & Elegant Portrait Aspect Ratio */}
      <div
        onClick={() => onViewDetails(product)}
        className="relative aspect-[3/4] bg-[#f8f7f5] overflow-hidden cursor-pointer"
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-700 ease-out"
          loading="lazy"
        />

        {/* Quick View Hover Bar */}
        <div className="absolute inset-x-0 bottom-0 py-2.5 bg-white/95 backdrop-blur-xs text-neutral-900 text-center text-[11px] font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:block border-t border-stone-200/60">
          Quick View
        </div>

        {/* Wishlist Heart Icon */}
        {onToggleWishlist && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 hover:bg-white text-stone-700 shadow-xs transition-transform active:scale-90 cursor-pointer z-10"
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              className={`h-3.5 w-3.5 ${
                isWishlisted
                  ? 'fill-red-500 text-red-500'
                  : 'text-stone-600 hover:text-neutral-900'
              }`}
            />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between gap-1 mb-1 text-xs">
            <span className="text-[10px] font-medium uppercase tracking-widest text-stone-400 truncate">
              {product.category}
            </span>
            {product.rating > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-neutral-900 text-xs tabular-nums">
                  {product.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Title */}
          <h2
            onClick={() => onViewDetails(product)}
            className="font-heading font-medium text-sm sm:text-[15px] text-neutral-900 mb-1 cursor-pointer hover:text-stone-600 transition-colors line-clamp-1"
          >
            {product.name}
          </h2>

          {/* Description */}
          <p className="text-xs text-stone-500 line-clamp-2 mb-3 leading-relaxed hidden sm:block">
            {product.description}
          </p>
        </div>

        {/* Price & Purchase Controls */}
        <div className="pt-2.5 border-t border-stone-100 flex flex-col gap-2 mt-auto">
          <div className="flex items-baseline justify-between">
            <span className="font-heading font-semibold text-sm sm:text-base text-neutral-900 tabular-nums">
              {formatBDT(product.price)}
            </span>
          </div>

          {/* Button Design: Simple, Elegant, Premium */}
          <div className="flex items-center gap-1.5 w-full">
            {/* Minimal Stepper */}
            <div className="flex items-center bg-stone-50 rounded-lg border border-stone-200/80 p-0.5 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQty(Math.max(1, qty - 1));
                }}
                className="w-6 h-6 flex items-center justify-center text-stone-600 hover:text-neutral-900 hover:bg-white rounded transition-colors text-xs cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-5 text-center text-xs font-semibold text-neutral-900 tabular-nums">
                {qty}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQty(qty + 1);
                }}
                className="w-6 h-6 flex items-center justify-center text-stone-600 hover:text-neutral-900 hover:bg-white rounded transition-colors text-xs cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            {/* Premium Add Button with Plus Sign */}
            <button
              onClick={handleAdd}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95 ${
                justAdded
                  ? 'bg-stone-800 text-white'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs'
              }`}
              aria-label={`Add ${qty} ${product.name} to cart`}
            >
              {justAdded ? (
                <>
                  <Check className="h-3.5 w-3.5 text-stone-200" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5 text-stone-300" />
                  <span>Add</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
