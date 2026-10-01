import React, { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Product, BannerSlide } from '../types';
import { formatBDT } from '../utils/format';

interface FeaturedBannerProps {
  slides?: BannerSlide[];
  products: Product[];
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  onNavigateToShop?: () => void;
}

export const FeaturedBanner: React.FC<FeaturedBannerProps> = ({
  slides = [],
  products,
  onAddToCart,
  onViewDetails,
  onNavigateToShop
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Normalize slides
  const activeSlides = React.useMemo(() => {
    if (slides && slides.length >= 2) {
      return slides.slice(0, 5);
    }
    if (products.length >= 2) {
      return products.slice(0, Math.min(5, products.length)).map((p) => ({
        id: `slide-${p.id}`,
        type: 'product' as const,
        productId: p.id,
        image: p.image,
        title: p.name,
        subtitle: p.description
      }));
    }
    return [];
  }, [slides, products]);

  useEffect(() => {
    if (isPaused || activeSlides.length < 2) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, activeSlides.length]);

  if (activeSlides.length === 0) return null;

  const currentSlide = activeSlides[currentIndex] || activeSlides[0];
  const linkedProduct = currentSlide.type === 'product' && currentSlide.productId
    ? products.find((p) => p.id === currentSlide.productId)
    : null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? activeSlides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  };

  return (
    <section
      aria-label="Featured collection showcase"
      className="mb-8"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative rounded-3xl overflow-hidden shadow-xl min-h-[360px] sm:min-h-[420px] lg:min-h-[460px] flex flex-col justify-end sm:justify-center bg-neutral-950">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            key={currentSlide.id || currentIndex}
            src={currentSlide.image}
            alt={currentSlide.title || 'Aniq Lifestyle Showcase'}
            className="w-full h-full object-cover object-center transition-opacity duration-1000 ease-out brightness-[0.72]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/95 via-neutral-950/50 to-neutral-950/20 sm:bg-gradient-to-r sm:from-neutral-950/90 sm:via-neutral-950/60 sm:to-transparent" />
        </div>

        {/* Floating Controls */}
        {activeSlides.length > 1 && (
          <div className="absolute top-5 right-5 sm:top-6 sm:right-6 z-20 flex items-center gap-2">
            <button
              onClick={handlePrev}
              aria-label="Previous slide"
              className="p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition-all active:scale-95 cursor-pointer border border-white/10 shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next slide"
              className="p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition-all active:scale-95 cursor-pointer border border-white/10 shadow-sm"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Dash Indicators */}
        {activeSlides.length > 1 && (
          <div className="absolute bottom-5 right-5 sm:bottom-6 sm:right-6 z-20 flex items-center gap-1.5">
            {activeSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx
                    ? 'w-7 bg-stone-100'
                    : 'w-2 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}

        {/* Main Content Card */}
        <div className="relative z-10 p-6 sm:p-10 lg:p-12 max-w-xl text-white">
          {linkedProduct && (
            <span className="text-xs uppercase tracking-widest text-stone-300 font-semibold block mb-2">
              {linkedProduct.category}
            </span>
          )}

          <h1 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl leading-tight mb-2.5 text-white tracking-tight">
            {currentSlide.title || linkedProduct?.name}
          </h1>

          <p className="text-xs sm:text-sm text-neutral-300 line-clamp-2 mb-5 font-normal leading-relaxed">
            {currentSlide.subtitle || linkedProduct?.description}
          </p>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {linkedProduct ? (
              <>
                <div className="mr-2">
                  <span className="font-heading font-extrabold text-xl sm:text-2xl text-stone-100">
                    {formatBDT(linkedProduct.price)}
                  </span>
                </div>

                <button
                  onClick={() => onAddToCart(linkedProduct)}
                  className="flex items-center gap-2 bg-[#283618] hover:bg-[#1f2b12] text-white border border-[#445837] font-bold px-5 py-3 rounded-xl transition-all shadow-md cursor-pointer active:scale-95 text-xs uppercase tracking-wider"
                >
                  <Plus className="h-4 w-4 text-stone-200" />
                  <span>Add to Bag</span>
                </button>

                <button
                  onClick={() => onViewDetails(linkedProduct)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-5 py-3 rounded-xl font-bold transition-all cursor-pointer active:scale-95 text-xs uppercase tracking-wider border border-white/15"
                >
                  <span>Details</span>
                </button>
              </>
            ) : (
              <button
                onClick={onNavigateToShop}
                className="flex items-center gap-2 bg-[#283618] hover:bg-[#1f2b12] text-white border border-[#445837] font-bold px-6 py-3.5 rounded-xl transition-all shadow-md cursor-pointer active:scale-95 text-xs uppercase tracking-wider"
              >
                <span>{'buttonText' in currentSlide && currentSlide.buttonText ? currentSlide.buttonText : 'Discover Collection'}</span>
                <ArrowRight className="h-4 w-4 text-stone-200" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
