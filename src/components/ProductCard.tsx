import React, { useState } from 'react';
import { Star, Plus, Minus, Eye, Heart, Check } from 'lucide-react';
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
    <article className="group bg-white rounded-2xl overflow-hidden flex flex-col transition-all duration-200 shadow-xs hover:shadow-lg border border-stone-200/70 hover:border-stone-300 relative">
      {/* Product Image */}
      <div
        onClick={() => onViewDetails(product)}
        className="relative aspect-4/3 sm:aspect-square bg-stone-100 overflow-hidden cursor-pointer"
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-neutral-900/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 bg-white text-neutral-900 px-3 py-1.5 rounded-lg font-semibold text-xs shadow-md backdrop-blur-xs">
            <Eye className="h-3.5 w-3.5" />
            Quick View
          </span>
        </div>

        {/* Wishlist Heart Icon */}
        {onToggleWishlist && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 hover:bg-white text-neutral-700 shadow-sm transition-transform active:scale-90 cursor-pointer z-10"
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              className={`h-4 w-4 ${
                isWishlisted
                  ? 'fill-red-500 text-red-500'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Star Score */}
          <div className="flex items-center justify-between gap-1 mb-1.5 text-xs text-neutral-600">
            <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-xs text-neutral-400 truncate">
              {product.category}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <Star
                className={`h-3 w-3 ${
                  product.rating > 0 ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'
                }`}
              />
              <span className="font-bold text-neutral-900 text-xs tabular-nums">
                {product.rating > 0 ? product.rating.toFixed(1) : '0.0'}
              </span>
              <span className="text-neutral-400 text-[10px] tabular-nums">
                ({product.reviewsCount || 0})
              </span>
            </div>
          </div>

          {/* Title */}
          <h2
            onClick={() => onViewDetails(product)}
            className="font-heading font-bold text-sm sm:text-base text-neutral-900 mb-1.5 cursor-pointer hover:text-neutral-700 transition-colors line-clamp-1"
          >
            {product.name}
          </h2>

          {/* Description */}
          <p className="text-xs text-neutral-500 line-clamp-2 mb-3 leading-relaxed hidden sm:block">
            {product.description}
          </p>
        </div>

        {/* Price and Add with Quantity Count */}
        <div className="pt-3 border-t border-stone-100 flex flex-col gap-2 mt-auto">
          <div className="flex items-baseline justify-between">
            <span className="font-heading font-bold text-sm sm:text-base text-neutral-900 tabular-nums">
              {formatBDT(product.price)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 w-full">
            {/* Quantity Stepper */}
            <div className="flex items-center bg-stone-100 rounded-lg border border-stone-200 p-0.5 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQty(Math.max(1, qty - 1));
                }}
                className="w-6 h-6 flex items-center justify-center text-neutral-700 hover:bg-white rounded text-xs font-bold cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-5 text-center text-xs font-bold text-neutral-900 tabular-nums">
                {qty}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQty(qty + 1);
                }}
                className="w-6 h-6 flex items-center justify-center text-neutral-700 hover:bg-white rounded text-xs font-bold cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            {/* Add Button with Plus Sign */}
            <button
              onClick={handleAdd}
              className={`flex-1 flex items-center justify-center gap-1 font-bold text-xs py-2 px-2.5 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95 border ${
                justAdded
                  ? 'bg-emerald-800 border-emerald-900 text-white'
                  : 'bg-[#283618] hover:bg-[#1f2b12] text-white border-[#445837]'
              }`}
              aria-label={`Add ${qty} ${product.name} to cart`}
            >
              {justAdded ? (
                <>
                  <Check className="h-3.5 w-3.5 text-white" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5 text-stone-200" />
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
