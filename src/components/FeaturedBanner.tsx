import React, { useState, useEffect } from 'react';
import { ShoppingBag, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import { formatBDT } from '../utils/format';

interface FeaturedBannerProps {
  products: Product[];
  bannerProductIds?: string[];
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

export const FeaturedBanner: React.FC<FeaturedBannerProps> = ({
  products,
  bannerProductIds = [],
  onAddToCart,
  onViewDetails
}) => {
  const featuredProducts = React.useMemo(() => {
    if (bannerProductIds && bannerProductIds.length > 0) {
      const selected: Product[] = [];
      for (const id of bannerProductIds) {
        const found = products.find((p) => p.id === id);
        if (found && !selected.some((s) => s.id === found.id)) {
          selected.push(found);
        }
      }
      if (selected.length > 0) {
        for (const p of products) {
          if (selected.length >= 3) break;
          if (!selected.some((s) => s.id === p.id)) {
            selected.push(p);
          }
        }
        return selected;
      }
    }
    return products.slice(0, 3);
  }, [products, bannerProductIds]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredProducts.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused, featuredProducts.length]);

  const currentProduct = featuredProducts[currentIndex] || featuredProducts[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? featuredProducts.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredProducts.length);
  };

  if (!currentProduct) return null;

  return (
    <section
      aria-label="Promotional cover banner"
      className="mb-8 sm:mb-12"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative rounded-2xl overflow-hidden shadow-xl min-h-[420px] sm:min-h-[460px] lg:min-h-[480px] flex flex-col justify-center bg-neutral-900 border border-neutral-300/30">
        {/* Cover Photo Background */}
        <div className="absolute inset-0 z-0">
          <img
            key={currentProduct.id}
            src={currentProduct.image}
            alt={currentProduct.name}
            className="w-full h-full object-cover object-center transition-opacity duration-700 ease-in-out filter brightness-[0.70]"
          />
          {/* Responsive Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/60 to-neutral-950/30 sm:bg-gradient-to-r sm:from-neutral-950/95 sm:via-neutral-950/70 sm:to-transparent" />
        </div>

        {/* Navigation Arrows */}
        <div className="absolute right-4 top-4 sm:top-6 sm:right-6 z-20 flex items-center gap-2">
          <button
            onClick={handlePrev}
            aria-label="Previous product"
            className="p-2.5 sm:p-3 rounded-full bg-neutral-900/80 hover:bg-neutral-900 text-white border border-neutral-700/80 backdrop-blur-md transition-transform active:scale-95 cursor-pointer shadow-md"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next product"
            className="p-2.5 sm:p-3 rounded-full bg-neutral-900/80 hover:bg-neutral-900 text-white border border-neutral-700/80 backdrop-blur-md transition-transform active:scale-95 cursor-pointer shadow-md"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Content Box */}
        <div className="relative z-10 px-5 sm:px-10 lg:px-14 pt-6 sm:pt-10 pb-20 sm:pb-24 max-w-2xl text-white my-auto">
          <div className="space-y-3 sm:space-y-4">
            {/* Product Title */}
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-white leading-tight">
              {currentProduct.name}
            </h2>

            {/* Product Description */}
            <p className="text-base sm:text-lg text-neutral-200 line-clamp-2 leading-relaxed max-w-xl">
              {currentProduct.description}
            </p>

            {/* Price Info in BDT */}
            <div className="pt-1">
              <span className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl text-white">
                {formatBDT(currentProduct.price)}
              </span>
            </div>

            {/* Actions: Add to Cart and Quick View */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => onAddToCart(currentProduct)}
                className="flex items-center justify-center gap-2.5 bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-base py-3 px-6 rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                <ShoppingBag className="h-5 w-5" />
                <span>Add to Cart</span>
              </button>

              <button
                onClick={() => onViewDetails(currentProduct)}
                className="flex items-center justify-center gap-2 bg-neutral-900/80 hover:bg-neutral-900 text-white border border-neutral-600 font-semibold text-base py-3 px-5 rounded-xl backdrop-blur-sm transition-colors cursor-pointer"
              >
                <Eye className="h-5 w-5" />
                <span>View Details</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Switcher: 3 Products */}
        <div className="absolute bottom-0 left-0 right-0 z-20 px-4 sm:px-8 py-2.5 sm:py-3 bg-neutral-950/85 backdrop-blur-md border-t border-neutral-800/90 flex items-center justify-between sm:justify-start gap-2 sm:gap-4 overflow-x-auto scrollbar-none">
          {featuredProducts.map((prod, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={prod.id}
                onClick={() => setCurrentIndex(idx)}
                className={`text-left py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center gap-2.5 shrink-0 ${
                  isActive
                    ? 'bg-neutral-800 text-white border border-neutral-700'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
                }`}
              >
                <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-neutral-500'}`}>
                  0{idx + 1}
                </span>
                <span className="text-xs sm:text-sm font-semibold truncate max-w-[130px] sm:max-w-none">
                  {prod.name}
                </span>
                <span className="hidden sm:inline text-xs text-neutral-400">
                  {formatBDT(prod.price)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
