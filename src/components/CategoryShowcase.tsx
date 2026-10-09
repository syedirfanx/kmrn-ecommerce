import React, { useState } from 'react';
import { CategoryData } from '../types';

interface CategoryShowcaseProps {
  categories: CategoryData[];
  onSelectCategory: (categoryName: string) => void;
}

export const CategoryShowcase: React.FC<CategoryShowcaseProps> = ({
  categories,
  onSelectCategory
}) => {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Filter categories to only those visible on the homepage thumbnail grid
  const visibleCategories = (categories || []).filter((c) => !c.hideFromHome);

  if (visibleCategories.length === 0) return null;

  const getCategoryLogo = (cat: CategoryData): string => {
    if (cat.logo && cat.logo.trim()) {
      return cat.logo.trim();
    }
    if (cat.id === 'cat-womens-wear') {
      return '/images/aniq-1.png';
    }
    if (cat.id === 'cat-home-decor') {
      return '/images/aniq-2.png';
    }
    return '/images/aniq-logo.png';
  };

  const handleImageError = (catId: string) => {
    setImageErrors((prev) => ({ ...prev, [catId]: true }));
  };

  const count = visibleCategories.length;

  // Layout Grid Calculation according to requirements:
  // - 1 category: full width
  // - 2 categories: 2 in one line (grid-cols-1 sm:grid-cols-2)
  // - 3 categories: all 3 adjust in one line (grid-cols-1 sm:grid-cols-3)
  // - 4 categories: 3-column grid where first 3 take 1 col each, and 4th takes col-span-3 (covering whole next line)
  // - 5 categories: 3-column grid where first 3 take 1 col each, and next 2 share the line (e.g. col-span-3 or responsive)
  const getCardColSpanClass = (index: number, total: number) => {
    if (total === 1) return 'col-span-full';
    if (total === 2) return 'col-span-1';
    if (total === 3) return 'col-span-1';
    if (total === 4) {
      if (index === 3) return 'sm:col-span-3'; // 4th covers the whole next line
      return 'sm:col-span-1';
    }
    if (total >= 5) {
      if (index < 3) return 'sm:col-span-2'; // on 6-col grid: 2 + 2 + 2 = 6 (3 in line 1)
      return 'sm:col-span-3'; // 3 + 3 = 6 (2 in line 2)
    }
    return '';
  };

  const getGridContainerClass = (total: number) => {
    if (total === 1) return 'grid grid-cols-1 gap-3 sm:gap-4';
    if (total === 2) return 'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4';
    if (total === 3) return 'grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4';
    if (total === 4) return 'grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4';
    return 'grid grid-cols-1 sm:grid-cols-6 gap-3 sm:gap-4'; // 5 categories: 3 in line 1 (span-2 each), 2 in line 2 (span-3 each)
  };

  return (
    <section aria-label="Collections" className="pt-1 pb-1">
      <div className={getGridContainerClass(count)}>
        {visibleCategories.slice(0, 5).map((cat, index) => {
          const logoSrc = getCategoryLogo(cat);
          const hasError = imageErrors[cat.id];
          const colSpanClass = getCardColSpanClass(index, count);

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.name)}
              className={`group relative bg-white border border-stone-200/90 hover:border-neutral-900 rounded-3xl px-5 py-5 sm:px-8 sm:py-6 h-52 sm:h-64 md:h-72 flex flex-col items-center justify-between transition-all duration-300 shadow-xs hover:shadow-xl cursor-pointer overflow-hidden ${colSpanClass}`}
            >
              {/* Optional Category Tag Badge (e.g. 'NEW') */}
              {cat.tag && (
                <div className="absolute top-3.5 right-3.5 z-20">
                  <span className="bg-neutral-900 text-white text-[10px] sm:text-[11px] font-heading font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                    {cat.tag}
                  </span>
                </div>
              )}

              {/* Logo Area: Backgroundless and Maximized Bigger */}
              <div className="w-full flex-1 flex items-center justify-center min-h-0 py-3 sm:py-4">
                {!hasError ? (
                  <img
                    src={logoSrc}
                    alt={cat.name}
                    onError={() => handleImageError(cat.id)}
                    className="max-h-[175px] sm:max-h-[220px] md:max-h-[260px] w-auto max-w-[98%] object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-sm mix-blend-multiply select-none"
                  />
                ) : (
                  <span className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-900 tracking-wider">
                    {cat.name.toUpperCase()}
                  </span>
                )}
              </div>

              {/* Centered Bigger Category Name */}
              <div className="relative z-10 w-full pt-3 sm:pt-3.5 border-t border-stone-100 flex items-center justify-center text-center">
                <span className="font-heading font-bold text-base sm:text-lg md:text-xl tracking-wide text-neutral-900 group-hover:text-stone-700 transition-colors truncate">
                  {cat.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
