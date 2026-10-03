import React, { useState, useEffect, useRef } from 'react';
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
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const startXRef = useRef<number>(0);
  const currentXRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize slides
  const activeSlides: BannerSlide[] = React.useMemo(() => {
    if (slides && slides.length >= 2) {
      return slides.slice(0, 15);
    }
    if (products.length >= 2) {
      return products.slice(0, Math.min(15, products.length)).map((p) => ({
        id: `slide-${p.id}`,
        type: 'product' as const,
        productId: p.id,
        image: p.image,
        title: p.name,
        subtitle: p.description,
        buttonText: 'Add to Bag',
        hideButton: false,
        linkUrl: ''
      }));
    }
    return [];
  }, [slides, products]);

  // Auto-play timer (slides smoothly every 6s when not dragging or paused)
  useEffect(() => {
    if (isPaused || isDragging || activeSlides.length < 2) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, isDragging, activeSlides.length]);

  if (activeSlides.length === 0) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? activeSlides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  };

  // Touch Swipe Handlers (Mobile & Tablet)
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setIsPaused(true);
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = e.touches[0].clientX;
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    currentXRef.current = e.touches[0].clientX;
    const delta = currentXRef.current - startXRef.current;
    setDragOffset(delta);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    const delta = currentXRef.current - startXRef.current;
    if (delta < -45) {
      handleNext();
    } else if (delta > 45) {
      handlePrev();
    }
    setDragOffset(0);
    setIsDragging(false);
    setTimeout(() => setIsPaused(false), 2000);
  };

  // Mouse Drag / Cursor Hold Handlers (Desktop & Laptop)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag on left click and avoid dragging if clicking buttons/links
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;

    setIsDragging(true);
    setIsPaused(true);
    startXRef.current = e.clientX;
    currentXRef.current = e.clientX;
    setDragOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    currentXRef.current = e.clientX;
    const delta = currentXRef.current - startXRef.current;
    // Bound drag offset
    setDragOffset(Math.max(-250, Math.min(250, delta)));
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    const delta = currentXRef.current - startXRef.current;
    if (delta < -50) {
      handleNext();
    } else if (delta > 50) {
      handlePrev();
    }
    setDragOffset(0);
    setIsDragging(false);
    setTimeout(() => setIsPaused(false), 2000);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp();
    }
    setIsPaused(false);
  };

  const handleSlideAction = (slide: BannerSlide) => {
    if (slide.type === 'product' && slide.productId) {
      const prod = products.find((p) => p.id === slide.productId);
      if (prod) {
        onViewDetails(prod);
        return;
      }
    }
    const url = slide.linkUrl?.toLowerCase() || '';
    if (url === 'about' || url === '#about') {
      onNavigateToPage?.('about');
      return;
    }
    if (url === 'contact' || url === '#contact') {
      onNavigateToPage?.('contact');
      return;
    }
    if (url === 'account' || url === '#account') {
      onNavigateToPage?.('account');
      return;
    }
    if (url.startsWith('#category:') || url.startsWith('category:')) {
      const cat = slide.linkUrl?.split(':')[1]?.trim();
      if (cat && onNavigateToCategory) {
        onNavigateToCategory(cat);
        return;
      }
    }
    if (onNavigateToCategory && slide.linkUrl && slide.linkUrl !== '#shop') {
      const clean = slide.linkUrl.replace('#', '');
      onNavigateToCategory(clean);
      return;
    }
    if (onNavigateToShop) {
      onNavigateToShop();
    }
  };

  return (
    <section
      aria-label="Featured collection showcase"
      className="relative w-full m-0 p-0 overflow-hidden bg-neutral-950 border-0 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* 
        Full-Screen Hero Height:
        Fits from the very top on mobile & tablet without gap.
        Fits full screen on laptop/desktop like Roheenaz & Qalamkar: h-screen (100vh / 100svh).
      */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full h-[100svh] min-h-[580px] max-h-[1080px] overflow-hidden ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Horizontal Carousel Track - Smooth Slide Go Left & Right */}
        <div
          className="flex h-full w-full will-change-transform"
          style={{
            transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
            transition: isDragging ? 'none' : 'transform 550ms cubic-bezier(0.22, 1, 0.36, 1)'
          }}
        >
          {activeSlides.map((slide, idx) => {
            const linkedProduct =
              slide.type === 'product' && slide.productId
                ? products.find((p) => p.id === slide.productId)
                : null;

            const shouldHideButton =
              slide.hideButton === true ||
              slide.buttonText === 'none' ||
              slide.buttonText === '';

            return (
              <div
                key={slide.id || idx}
                onClick={(e) => {
                  if (isDragging || Math.abs(dragOffset) > 5) return;
                  if (shouldHideButton && (slide.linkUrl || slide.productId)) {
                    handleSlideAction(slide);
                  }
                }}
                className={`relative w-full h-full shrink-0 flex flex-col justify-end sm:justify-center overflow-hidden ${
                  shouldHideButton && (slide.linkUrl || slide.productId) ? 'cursor-pointer' : ''
                }`}
              >
                {/* Full-Bleed Background Image */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                  <img
                    src={slide.image}
                    alt={slide.title || 'Aniq Luxury Showcase'}
                    className="w-full h-full object-cover object-center brightness-[0.90] contrast-[1.02]"
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    draggable={false}
                  />
                  {/* Subtle Luxury Scrim Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/40 to-neutral-950/15 sm:bg-gradient-to-r sm:from-neutral-950/85 sm:via-neutral-950/50 sm:to-transparent" />
                </div>

                {/* Banner Content Container */}
                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 pt-28 sm:pt-36 pb-16 sm:pb-24 text-white">
                  <div className="max-w-2xl">
                    {linkedProduct && (
                      <span className="font-category text-[11px] sm:text-xs uppercase tracking-[0.25em] text-stone-300 font-semibold block mb-2 sm:mb-3">
                        {linkedProduct.category}
                      </span>
                    )}

                    <h1 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl leading-[1.15] mb-3 text-white tracking-tight drop-shadow-xs">
                      {slide.title || linkedProduct?.name}
                    </h1>

                    <p className="font-subheading text-sm sm:text-base lg:text-lg text-stone-200 line-clamp-2 mb-6 font-normal leading-relaxed max-w-xl">
                      {slide.subtitle || linkedProduct?.description}
                    </p>

                    {/* Action Row - Hidden when No Button option is selected */}
                    {!shouldHideButton && (
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        {linkedProduct ? (
                          <>
                            <div className="mr-3">
                              <span className="font-heading font-extrabold text-xl sm:text-2xl text-stone-100 tabular-nums">
                                {formatBDT(linkedProduct.price)}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddToCart(linkedProduct);
                              }}
                              className="px-5 sm:px-6 py-2.5 sm:py-3 bg-white text-neutral-900 hover:bg-stone-100 rounded-full font-category font-semibold text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
                            >
                              <span>Add to Bag</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewDetails(linkedProduct);
                              }}
                              className="px-5 py-2.5 sm:py-3 bg-black/40 hover:bg-black/70 text-white rounded-full font-category font-semibold text-xs sm:text-sm tracking-wider uppercase backdrop-blur-md border border-white/30 transition-all active:scale-95 cursor-pointer"
                            >
                              <span>Details</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSlideAction(slide);
                            }}
                            className="px-7 py-3 bg-white text-neutral-900 hover:bg-stone-100 rounded-full font-category font-semibold text-xs sm:text-sm tracking-widest uppercase shadow-lg transition-all active:scale-95 cursor-pointer"
                          >
                            <span>{slide.buttonText || 'Explore Collection'}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Slide Clickable Dots - Touch and Clickable Controls */}
        {activeSlides.length > 1 && (
          <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15">
            {activeSlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentIndex === idx
                    ? 'w-7 h-2 bg-white shadow-sm'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
