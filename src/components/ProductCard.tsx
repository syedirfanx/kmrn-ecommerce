import React, { useState } from 'react';
import { Star, Plus, Minus, Heart, Check, Eye, Tag } from 'lucide-react';
import { Product } from '../types';
import { formatBDT } from '../utils/format';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
  onViewDetails: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onViewDetails,
  onQuickView,
  isWishlisted = false,
  onToggleWishlist
}) => {
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const productWithVariants: Product = {
      ...product,
      selectedColour: product.selectedColour || (product.availableColours && product.availableColours[0]) || '',
      selectedSize: product.selectedSize || (product.availableSizes && product.availableSizes[0]) || ''
    };
    onAddToCart(productWithVariants, qty);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQty((prev) => Math.max(1, prev - 1));
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQty((prev) => prev + 1);
  };

  const averageRating = (product.rating || 0) > 0 ? product.rating.toFixed(1) : '0.0';

  return (
    <article className="group bg-white rounded-xl overflow-hidden flex flex-col transition-all duration-300 border border-stone-200/80 hover:border-stone-400/80 hover:shadow-md relative">
      {/* Product Thumbnail with Visible Rating and Wishlist */}
      <div
        onClick={() => onViewDetails(product)}
        className="relative aspect-[3/4] bg-[#f8f7f5] overflow-hidden cursor-pointer"
      >
        <img
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out ${
            product.inStock === false ? 'grayscale opacity-75' : ''
          }`}
          loading="lazy"
        />

        {/* Out of Stock Overlay Badge */}
        {product.inStock === false && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-10">
            <span className="bg-red-600 text-white font-category text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-md shadow-lg border border-red-500">
              Out of Stock
            </span>
          </div>
        )}

        {/* Visible Rating Badge on Thumbnail */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-md shadow-xs border border-stone-200/70 z-10 text-[11px] font-bold text-neutral-900 tabular-nums">
          <Star
            className={`h-3 w-3 ${
              (product.rating || 0) > 0
                ? 'fill-amber-400 text-amber-400'
                : 'fill-stone-300 text-stone-300'
            }`}
          />
          <span>{averageRating}</span>
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

        {/* Quick View Hover Bar */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onQuickView) {
              onQuickView(product);
            } else {
              onViewDetails(product);
            }
          }}
          className="absolute inset-x-0 bottom-0 py-2.5 bg-white/95 hover:bg-neutral-900 hover:text-white backdrop-blur-xs text-neutral-900 text-center text-[11px] font-category font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-200 hidden sm:block border-t border-stone-200/60 cursor-pointer"
        >
          Quick View
        </button>
      </div>

      {/* Content */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category */}
          <div className="flex items-center justify-between gap-1 mb-1 text-xs">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 truncate">
              {product.category}
            </span>
          </div>

          {/* Title */}
          <h2
            onClick={() => onViewDetails(product)}
            className="font-heading font-medium text-sm sm:text-[15px] text-neutral-900 mb-1 cursor-pointer hover:text-stone-600 transition-colors line-clamp-2"
          >
            {product.name}
          </h2>
        </div>

        {/* Price & Unified Action Button */}
        <div className="pt-2.5 border-t border-stone-100 flex flex-col gap-2 mt-auto">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 border border-stone-200/80 rounded-lg text-neutral-900 shadow-2xs">
              <Tag className="h-3.5 w-3.5 text-stone-600 shrink-0" />
              <span className="font-heading font-semibold text-xs sm:text-sm text-neutral-900 tabular-nums">
                {formatBDT(product.price)}
              </span>
            </div>
          </div>

          {/* Single Unified Stepper + Add Button */}
          {product.inStock === false ? (
            <div className="w-full bg-stone-100 text-stone-500 rounded-lg p-2 shadow-xs text-center border border-stone-200">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Out of Stock
              </span>
            </div>
          ) : (
            <div className="flex items-center w-full bg-neutral-900 text-white rounded-lg p-0.5 shadow-xs overflow-hidden">
              <button
                type="button"
                onClick={handleDecrease}
                className="w-7 h-7 flex items-center justify-center text-stone-300 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer shrink-0"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3 w-3" />
              </button>

              <span className="w-5 text-center text-xs font-semibold text-white tabular-nums select-none shrink-0">
                {qty}
              </span>

              <button
                type="button"
                onClick={handleIncrease}
                className="w-7 h-7 flex items-center justify-center text-stone-300 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer shrink-0"
                aria-label="Increase quantity"
              >
                <Plus className="h-3 w-3" />
              </button>

              <div className="w-px h-4 bg-neutral-700 mx-1 shrink-0" />

              <button
                type="button"
                onClick={handleAdd}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-neutral-800 rounded transition-all cursor-pointer active:scale-95 truncate"
                aria-label={`Add ${qty} ${product.name} to cart`}
              >
                {justAdded ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">Added</span>
                  </>
                ) : (
                  <span className="truncate">Add to Bag</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
