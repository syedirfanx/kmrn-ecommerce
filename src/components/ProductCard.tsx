import React from 'react';
import { Star, ShoppingBag, Eye, Heart } from 'lucide-react';
import { Product } from '../types';
import { formatBDT } from '../utils/format';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
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
  return (
    <article className="group bg-white rounded-2xl border border-neutral-200 overflow-hidden flex flex-col transition-all duration-200 hover:shadow-xl hover:border-neutral-300 relative">
      {/* Product Image */}
      <div
        onClick={() => onViewDetails(product)}
        className="relative aspect-4/3 sm:aspect-16/11 bg-neutral-100 overflow-hidden cursor-pointer"
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-neutral-900/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="inline-flex items-center gap-2 bg-white text-neutral-900 px-4 py-2 rounded-lg font-semibold text-sm shadow-md backdrop-blur-xs">
            <Eye className="h-4 w-4" />
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
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white text-neutral-700 shadow-sm transition-transform active:scale-90 cursor-pointer z-10"
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
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between gap-2 mb-2 text-sm text-neutral-600">
            <span className="font-semibold uppercase tracking-wider text-xs text-neutral-500">
              {product.category}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-3.5 w-3.5 ${
                      product.rating > 0 && product.rating >= s
                        ? 'fill-amber-400 text-amber-400'
                        : product.rating > 0 && product.rating >= s - 0.5
                        ? 'fill-amber-400/60 text-amber-400'
                        : 'text-neutral-200'
                    }`}
                  />
                ))}
              </div>
              <span className="font-bold text-neutral-900 text-xs sm:text-sm">
                {product.rating > 0 ? product.rating.toFixed(1) : '0.0'}
              </span>
              <span className="text-neutral-400 text-xs">
                ({product.reviewsCount || 0})
              </span>
            </div>
          </div>

          {/* Title */}
          <h2
            onClick={() => onViewDetails(product)}
            className="font-heading font-bold text-xl sm:text-2xl text-neutral-900 mb-2.5 cursor-pointer hover:text-neutral-700 transition-colors line-clamp-1"
          >
            {product.name}
          </h2>

          {/* Description */}
          <p className="text-base text-neutral-600 line-clamp-2 mb-5 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price and Action */}
        <div className="pt-4 border-t border-neutral-100 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 mt-auto">
          <div>
            <span className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-900">
              {formatBDT(product.price)}
            </span>
          </div>

          <button
            onClick={() => onAddToCart(product)}
            className="w-full xs:w-auto flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-base px-5 py-3 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </article>
  );
};
