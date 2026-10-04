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

  if (!categories || categories.length === 0) return null;

  const getCategoryLogo = (categoryName: string, index: number): string => {
    const lower = categoryName.toLowerCase();
    if (lower.includes('women') || lower.includes('wear') || lower.includes('dress') || lower.includes('pret')) {
      return '/images/aniq-1.png';
    }
    if (lower.includes('home') || lower.includes('decor') || lower.includes('living') || lower.includes('bed')) {
      return '/images/aniq-2.png';
    }
    return index === 0 ? '/images/aniq-1.png' : '/images/aniq-2.png';
  };

  const handleImageError = (catId: string) => {
    setImageErrors((prev) => ({ ...prev, [catId]: true }));
  };

  return (
    <section aria-label="Collections" className="pt-1 pb-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {categories.slice(0, 4).map((cat, idx) => {
          const logoSrc = getCategoryLogo(cat.name, idx);
          const hasError = imageErrors[cat.id];

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.name)}
              className="group relative bg-white border border-stone-200/90 hover:border-neutral-900 rounded-3xl px-5 py-4 sm:px-7 sm:py-5 h-44 sm:h-52 md:h-60 flex flex-col items-center justify-between transition-all duration-300 shadow-xs hover:shadow-lg cursor-pointer overflow-hidden"
            >
              {/* Subtle luxury linen background corner accent */}
              <div className="absolute top-0 right-0 w-28 h-28 bg-stone-100/50 rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-125" />

              {/* Logo Area: Maximized to be the biggest element in the box */}
              <div className="w-full flex-1 flex items-center justify-center min-h-0 py-1 sm:py-2">
                {!hasError ? (
                  <img
                    src={logoSrc}
                    alt={cat.name}
                    onError={() => handleImageError(cat.id)}
                    className="max-h-[130px] sm:max-h-[160px] md:max-h-[190px] w-auto max-w-[95%] object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-xs"
                  />
                ) : (
                  <span className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-900 tracking-wider">
                    {cat.name.toUpperCase()}
                  </span>
                )}
              </div>

              {/* Centered Bigger Category Name */}
              <div className="relative z-10 w-full pt-2.5 sm:pt-3 border-t border-stone-100 flex items-center justify-center text-center">
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
