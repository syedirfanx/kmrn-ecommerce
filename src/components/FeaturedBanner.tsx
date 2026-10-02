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
  onNavigateToCategory?: (categoryName: string) => void;
  onNavigateToPage?: (page: 'home' | 'about' | 'contact' | 'account') => void;
}

export const FeaturedBanner: React.FC<FeaturedBannerProps> = ({
  slides = [],
  products,
  onAddToCart,
  onViewDetails,
  onNavigateToShop,
  onNavigateToCategory,
  onNavigateToPage
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
      className="relative w-full -mt-[61px] sm:-mt-[69px] mb-8 bg-neutral-950 border-0"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative w-full overflow-hidden min-h-[70vh] sm:min-h-[82vh] lg:min-h-[88vh] flex flex-col justify-end sm:justify-center bg-neutral-950">
        {/* Still Slide Background Container */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={currentSlide.image}
            alt={currentSlide.title || 'Aniq Lifestyle Showcase'}
            className="w-full h-full object-cover object-center brightness-[0.72]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/95 via-neutral-950/50 to-neutral-950/20 sm:bg-gradient-to-r sm:from-neutral-950/90 sm:via-neutral-950/60 sm:to-transparent" />
        </div>

        {/* Bottom Center Toggle Controls */}
        {activeSlides.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
            <button
              onClick={handlePrev}
              aria-label="Previous slide"
              className="p-2.5 rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-md transition-all active:scale-95 cursor-pointer border border-white/20 shadow-md"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Dash Indicators */}
            <div className="flex items-center gap-1.5 px-1">
              {activeSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    currentIndex === idx
                      ? 'w-7 bg-white shadow-xs'
                      : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              aria-label="Next slide"
              className="p-2.5 rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-md transition-all active:scale-95 cursor-pointer border border-white/20 shadow-md"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Animated Content Overlay */}
        <div key={`content-${currentSlide.id || currentIndex}`} className="relative z-10 p-6 sm:p-12 lg:p-16 pt-24 sm:pt-32 max-w-2xl text-white animate-fade-in-up">
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
                  className="flex items-center gap-2 bg-white hover:bg-stone-100 text-neutral-900 font-semibold px-5 py-2.5 rounded-lg transition-all shadow-sm cursor-pointer active:scale-95 text-xs uppercase"
                >
                  <Plus className="h-3.5 w-3.5 text-neutral-900" />
                  <span>Add to Bag</span>
                </button>

                <button
                  onClick={() => onViewDetails(linkedProduct)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs px-5 py-2.5 rounded-lg font-semibold transition-all cursor-pointer active:scale-95 text-xs uppercase border border-white/20"
                >
                  <span>Details</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  const targetUrl = 'linkUrl' in currentSlide && typeof currentSlide.linkUrl === 'string' ? currentSlide.linkUrl.trim() : '';

                  if (!targetUrl) {
                    if (onNavigateToShop) onNavigateToShop();
                    return;
                  }

                  // 1. External URL
                  if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
                    window.location.href = targetUrl;
                    return;
                  }

                  // 2. Specific pages
                  const cleaned = targetUrl.replace(/^[#/]/, '').trim().toLowerCase();
                  if (cleaned === 'about' || cleaned === 'about-us' || cleaned === 'aboutpage') {
                    if (onNavigateToPage) {
                      onNavigateToPage('about');
                      return;
                    }
                  }
                  if (cleaned === 'contact' || cleaned === 'contact-us' || cleaned === 'contactpage') {
                    if (onNavigateToPage) {
                      onNavigateToPage('contact');
                      return;
                    }
                  }
                  if (cleaned === 'account' || cleaned === 'profile') {
                    if (onNavigateToPage) {
                      onNavigateToPage('account');
                      return;
                    }
                  }
                  if (cleaned === 'home') {
                    if (onNavigateToPage) {
                      onNavigateToPage('home');
                      return;
                    }
                  }

                  // 3. Category matching (by exact name or cleaned name)
                  if (onNavigateToCategory) {
                    const rawTarget = targetUrl.replace(/^[#/]/, '').trim();
                    if (rawTarget && rawTarget.toLowerCase() !== 'shop' && rawTarget.toLowerCase() !== 'home') {
                      onNavigateToCategory(rawTarget);
                      return;
                    }
                  }

                  // 4. Fallback to shop
                  if (onNavigateToShop) {
                    onNavigateToShop();
                  }
                }}
                className="flex items-center gap-2 bg-white hover:bg-stone-100 text-neutral-900 font-semibold px-6 py-3 rounded-lg transition-all shadow-sm cursor-pointer active:scale-95 text-xs uppercase"
              >
                <span>{'buttonText' in currentSlide && currentSlide.buttonText ? currentSlide.buttonText : 'Discover Collection'}</span>
                <ArrowRight className="h-3.5 w-3.5 text-neutral-900" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
