import React, { useState, useEffect, useRef } from 'react';
import { Product, BannerSlide, CategoryData, Catalogue } from '../types';
import { formatBDT } from '../utils/format';

interface FeaturedBannerProps {
  slides?: BannerSlide[];
  products: Product[];
  categories?: CategoryData[];
  catalogues?: Catalogue[];
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  onNavigateToShop?: () => void;
  onNavigateToCategory?: (categoryName: string, subcategoryName?: string) => void;
  onNavigateToPage?: (page: 'home' | 'about' | 'contact' | 'account') => void;
  onOpenCart?: () => void;
}

export const FeaturedBanner: React.FC<FeaturedBannerProps> = ({
  slides = [],
  products,
  categories = [],
  catalogues = [],
  onAddToCart,
  onViewDetails,
  onNavigateToShop,
  onNavigateToCategory,
  onNavigateToPage,
  onOpenCart
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

  const handleInternalPath = (rawPath: string) => {
    let clean = (rawPath || '').trim();
    // Remove query params/hash for route matching if needed, but preserve if relevant
    clean = clean.replace(/^[/#]+/, '').replace(/\/+$/, '');
    const lower = clean.toLowerCase();

    // Home
    if (lower === '' || lower === 'home') {
      onNavigateToPage?.('home');
      return;
    }

    // Static pages
    if (lower === 'about' || lower === 'about-us') {
      onNavigateToPage?.('about');
      return;
    }
    if (lower === 'contact' || lower === 'contact-us' || lower === 'boutique') {
      onNavigateToPage?.('contact');
      return;
    }
    if (lower === 'account' || lower === 'orders' || lower === 'profile' || lower === 'my-account') {
      onNavigateToPage?.('account');
      return;
    }
    if (lower === 'cart' || lower === 'checkout') {
      onOpenCart?.();
      return;
    }

    // Shop / All Products
    if (lower === 'shop' || lower === 'products' || lower === 'collection' || lower === 'all') {
      if (onNavigateToShop) {
        onNavigateToShop();
      } else if (onNavigateToCategory && categories && categories.length > 0) {
        onNavigateToCategory(categories[0].name, 'All');
      }
      return;
    }

    // Product link (e.g. product/123, /product/123, products/123, or product query)
    if (lower.startsWith('product/') || lower.startsWith('products/') || lower.includes('product=')) {
      const prodId = clean
        .replace(/^(product|products)\//i, '')
        .replace(/.*[?&](id|product)=/i, '')
        .split('?')[0]
        .split('#')[0]
        .trim();

      const prod = products.find(
        (p) =>
          p.id.toLowerCase() === prodId.toLowerCase() ||
          String(p.id) === prodId ||
          p.name.toLowerCase() === prodId.toLowerCase() ||
          p.name.toLowerCase().includes(prodId.toLowerCase())
      );
      if (prod) {
        onViewDetails(prod);
        return;
      }
    }

    // Check if it's a direct product ID or exact product name
    const directProd = products.find(
      (p) =>
        p.id.toLowerCase() === clean.toLowerCase() ||
        String(p.id) === clean ||
        p.name.toLowerCase() === lower
    );
    if (directProd) {
      onViewDetails(directProd);
      return;
    }

    // Check for catalogue link (e.g. catalogue/catg-lawn, catalogues/catg-lawn, or catalogue name)
    const catalogueIdOrName = clean
      .replace(/^(catalogue|catalogues|collection|collections)\//i, '')
      .trim()
      .toLowerCase();

    const matchedCatalogue = catalogues?.find(
      (c) =>
        c.id.toLowerCase() === catalogueIdOrName ||
        c.name.toLowerCase() === catalogueIdOrName ||
        c.name.toLowerCase().includes(catalogueIdOrName)
    );
    if (matchedCatalogue) {
      onNavigateToCategory?.(matchedCatalogue.category, matchedCatalogue.name);
      return;
    }

    // Check for subcategory / collection in products
    const matchedProdWithSub = products.find(
      (p) =>
        (p.subcategory && p.subcategory.toLowerCase() === lower) ||
        (p.catalogueName && p.catalogueName.toLowerCase() === lower) ||
        (p.subcategory && p.subcategory.toLowerCase() === catalogueIdOrName) ||
        (p.catalogueName && p.catalogueName.toLowerCase() === catalogueIdOrName)
    );
    if (matchedProdWithSub) {
      onNavigateToCategory?.(matchedProdWithSub.category, matchedProdWithSub.subcategory || matchedProdWithSub.catalogueName);
      return;
    }

    // Category link (e.g. category/womens-wear, womens-wear, category/home-decor, home-decor, Elegant Women's Wear)
    const catClean = clean.replace(/^category\//i, '').trim();
    const catLower = catClean.toLowerCase();

    // Women's wear aliases
    if (catLower.includes('women') || catLower === 'lawn' || catLower === 'womens-wear' || catLower === 'women-wear') {
      const womenCat = categories?.find((c) => c.name.toLowerCase().includes('women'))?.name || "Elegant Women's Wear";
      onNavigateToCategory?.(womenCat, 'All');
      return;
    }

    // Home decor aliases
    if (catLower.includes('decor') || catLower.includes('home') || catLower === 'home-decor' || catLower.includes('bed')) {
      const homeCat = categories?.find((c) => c.name.toLowerCase().includes('decor') || c.name.toLowerCase().includes('home'))?.name || "Home Decor";
      onNavigateToCategory?.(homeCat, 'All');
      return;
    }

    // Match any category by name or slug
    const matchedCategory = categories?.find((c) => {
      const cLower = c.name.toLowerCase();
      const cSlug = cLower.replace(/[^a-z0-9]+/g, '-');
      return cLower === catLower || cSlug === catLower;
    });

    if (matchedCategory) {
      onNavigateToCategory?.(matchedCategory.name, 'All');
      return;
    }

    // Generic shop fallback - NEVER open a blank page!
    if (onNavigateToShop) {
      onNavigateToShop();
    } else if (onNavigateToCategory && categories && categories.length > 0) {
      onNavigateToCategory(categories[0].name, 'All');
    } else {
      onNavigateToPage?.('home');
    }
  };

  const handleSlideAction = (slide: BannerSlide) => {
    if (slide.noLinkOverBanner === true) return;

    // 1. Linked direct product slide
    if (slide.type === 'product' && slide.productId) {
      const prod = products.find((p) => p.id === slide.productId || String(p.id) === String(slide.productId));
      if (prod) {
        onViewDetails(prod);
        return;
      }
    }

    const rawUrl = (slide.linkUrl || '').trim();
    if (!rawUrl) {
      // Default to shop
      if (onNavigateToShop) {
        onNavigateToShop();
      } else if (onNavigateToCategory && categories && categories.length > 0) {
        onNavigateToCategory(categories[0].name, 'All');
      }
      return;
    }

    // 2. Web URLs (http:// or https:// or //)
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('//')) {
      try {
        const fullUrl = rawUrl.startsWith('//') ? window.location.protocol + rawUrl : rawUrl;
        const parsed = new URL(fullUrl);
        // If it is the current app, any preview run.app domain, localhost, or firebase host
        if (
          parsed.origin === window.location.origin ||
          parsed.hostname.includes('run.app') ||
          parsed.hostname.includes('localhost') ||
          parsed.hostname.includes('127.0.0.1') ||
          parsed.hostname.includes('firebaseapp.com') ||
          parsed.hostname.includes('web.app')
        ) {
          // Route internally to prevent reloading the page or blank iframe
          handleInternalPath(parsed.pathname + parsed.search + parsed.hash);
          return;
        }

        // True external link: open safely in new window with noopener to avoid blanking current app
        window.open(fullUrl, '_blank', 'noopener,noreferrer');
        return;
      } catch {
        handleInternalPath(rawUrl);
        return;
      }
    }

    // 3. Internal routing for relative paths
    handleInternalPath(rawUrl);
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

            const titleText = (slide.title !== undefined ? slide.title : linkedProduct?.name) || '';
            const subtitleText = (slide.subtitle !== undefined ? slide.subtitle : (linkedProduct ? formatBDT(linkedProduct.price) : '')) || '';
            const hasHeading = titleText.trim().length > 0;
            const hasSubtitle = subtitleText.trim().length > 0;
            const hasAnyText = hasHeading || hasSubtitle;

            // Check if "No Link Over Banner" option is enabled
            const isNoLinkOverBanner = slide.noLinkOverBanner === true;

            // If all 4 are selected (No Heading, No Subtitle, No Button, No Link Over Banner) or text and button are empty
            const isAllSelected = !hasHeading && !hasSubtitle && shouldHideButton && isNoLinkOverBanner;
            const isOnlyImage = isAllSelected || (!hasAnyText && shouldHideButton);

            // If No Link Over Banner is selected, banner is never clickable as a link
            const isClickableOverBanner =
              !isNoLinkOverBanner &&
              (slide.hasLinkOverBanner || (shouldHideButton && Boolean(slide.linkUrl || slide.productId)));

            return (
              <div
                key={slide.id || idx}
                onClick={(e) => {
                  if (isDragging || Math.abs(dragOffset) > 5) return;
                  if (isClickableOverBanner) {
                    handleSlideAction(slide);
                  }
                }}
                className={`relative w-full h-full shrink-0 flex flex-col justify-end sm:justify-center overflow-hidden ${
                  isClickableOverBanner ? 'cursor-pointer' : ''
                }`}
              >
                {/* Full-Bleed Background Image */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                  <img
                    src={slide.image}
                    alt={titleText || 'Aniq Luxury Showcase'}
                    className={`w-full h-full object-cover object-center ${
                      isOnlyImage
                        ? 'brightness-100 contrast-100'
                        : 'brightness-[0.92] contrast-[1.02]'
                    }`}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    draggable={false}
                  />
                  {/* Luxury Scrim Overlay - ONLY rendered when text or buttons are present. If isOnlyImage, no overlay at all */}
                  {!isOnlyImage && (hasAnyText || !shouldHideButton) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/40 to-neutral-950/15 sm:bg-gradient-to-r sm:from-neutral-950/85 sm:via-neutral-950/50 sm:to-transparent pointer-events-none" />
                  )}
                </div>

                {/* Banner Content Container */}
                {(hasAnyText || !shouldHideButton) && (
                  <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 pt-28 sm:pt-36 pb-16 sm:pb-24 text-white">
                    <div className="max-w-2xl">
                      {linkedProduct && hasHeading && (
                        <span className="font-category text-[11px] sm:text-xs uppercase tracking-[0.25em] text-stone-300 font-semibold block mb-2 sm:mb-3">
                          {linkedProduct.category}
                        </span>
                      )}

                      {hasHeading && (
                        <h1 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl leading-[1.15] mb-3 text-white tracking-tight drop-shadow-xs">
                          {titleText}
                        </h1>
                      )}

                      {hasSubtitle && (
                        <p className="font-subheading text-sm sm:text-base lg:text-lg text-stone-200 line-clamp-2 mb-6 font-normal leading-relaxed max-w-xl">
                          {subtitleText}
                        </p>
                      )}

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
                )}
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
