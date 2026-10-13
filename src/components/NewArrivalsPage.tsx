import React, { useState, useMemo } from 'react';
import { ArrowUpDown, Search, X } from 'lucide-react';
import { Product, CategoryData } from '../types';
import { ProductCard } from './ProductCard';

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'rating-desc';

interface NewArrivalsPageProps {
  products: Product[];
  categories: CategoryData[];
  onAddToCart: (product: Product, quantity: number) => void;
  onViewDetails: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  wishlistProductIds: string[];
  onToggleWishlist: (productId: string) => void;
  onNavigateToCategory?: (categoryName: string) => void;
}

export const NewArrivalsPage: React.FC<NewArrivalsPageProps> = ({
  products,
  categories,
  onAddToCart,
  onViewDetails,
  onQuickView,
  wishlistProductIds,
  onToggleWishlist,
  onNavigateToCategory
}) => {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Filter products that are not archived and sort primarily by newest arrivals
  const newArrivalsList = useMemo(() => {
    // Only unarchived products
    let list = products.filter((p) => !p.archived);

    // Filter by selected category if not 'All'
    if (selectedCategoryFilter !== 'All') {
      list = list.filter((p) => p.category === selectedCategoryFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.catalogueName && p.catalogueName.toLowerCase().includes(q)) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // Sort products
    const sorted = [...list];
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => {
          // Compare createdAt dates if available, fallback to product order or reversed id
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (timeA && timeB && timeA !== timeB) {
            return timeB - timeA;
          }
          if (a.order !== undefined && b.order !== undefined && a.order !== b.order) {
            return a.order - b.order;
          }
          return b.id.localeCompare(a.id);
        });
        break;
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'rating-desc':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        break;
    }

    return sorted;
  }, [products, selectedCategoryFilter, searchQuery, sortBy]);

  // Extract categories that actually have unarchived products
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (!p.archived && p.category) {
        set.add(p.category);
      }
    });
    return Array.from(set);
  }, [products]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/80 shadow-xs relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <h1 className="font-heading font-medium text-3xl sm:text-5xl text-neutral-900 tracking-tight mb-3">
            New Arrivals
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
            Discover the latest additions to our curated wardrobe and luxury home decor collections. Handpicked authentic designs, freshly released for the discerning lifestyle.
          </p>
        </div>

        {/* Decorative subtle vintage accent in corner */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-stone-100/50 to-transparent pointer-events-none hidden md:block" />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4">
        {/* Category Pills & Search / Sort controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('All')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                selectedCategoryFilter === 'All'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-200 hover:border-neutral-900 hover:text-neutral-900'
              }`}
            >
              All Items ({products.filter((p) => !p.archived).length})
            </button>

            {availableCategories.map((catName) => {
              const count = products.filter((p) => !p.archived && p.category === catName).length;
              const isSelected = selectedCategoryFilter === catName;
              return (
                <button
                  key={catName}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(catName)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-white text-stone-700 border border-stone-200 hover:border-neutral-900 hover:text-neutral-900'
                  }`}
                >
                  {catName} ({count})
                </button>
              );
            })}
          </div>

          {/* Right: Search & Sorting */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search new arrivals..."
                className="w-full bg-white border border-stone-300 rounded-xl pl-9 pr-8 py-2 text-xs text-neutral-900 placeholder:text-stone-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2 bg-white border border-stone-300 rounded-xl px-3 py-2 shadow-xs shrink-0">
              <ArrowUpDown className="h-3.5 w-3.5 text-stone-400" />
              <select
                id="new-arrivals-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-xs text-neutral-900 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="newest">Latest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating-desc">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status text */}
        <div className="flex items-center justify-between text-xs text-stone-500 px-1">
          <span>
            Showing <strong className="text-neutral-900 font-bold">{newArrivalsList.length}</strong> new arrivals
            {selectedCategoryFilter !== 'All' ? ` in ${selectedCategoryFilter}` : ''}
          </span>
          {(searchQuery || selectedCategoryFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategoryFilter('All');
              }}
              className="font-medium text-neutral-900 hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {newArrivalsList.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {newArrivalsList.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={(p, q) => onAddToCart(p, q || 1)}
              onViewDetails={(p) => onViewDetails(p)}
              onQuickView={onQuickView}
              isWishlisted={wishlistProductIds.includes(product.id)}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-white rounded-3xl border border-stone-200/80 shadow-xs px-4">
          <p className="font-heading font-medium text-lg text-neutral-900 mb-1">
            No products found
          </p>
          <p className="text-xs text-stone-500 mb-4">
            {searchQuery
              ? `No new arrivals matched "${searchQuery}".`
              : 'There are currently no items under this selection.'}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategoryFilter('All');
            }}
            className="bg-neutral-900 text-white font-semibold text-xs uppercase tracking-wider px-4 py-2 rounded-lg cursor-pointer"
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
};
