import React, { useState, useEffect } from 'react';
import { X, Star, Plus, Minus, ShoppingBag, Heart, MessageSquare, Check, AlertCircle, Sparkles, Trash2 } from 'lucide-react';
import { User } from 'firebase/auth';
import { Product, ProductReview } from '../types';
import { formatBDT } from '../utils/format';
import { subscribeProductReviews, saveProductReviewToDb, deleteProductReviewFromDb } from '../services/storeService';

interface ProductModalProps {
  product: Product | null;
  currentUser: User | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
  onOpenAuth: () => void;
}

const PREBUILT_COMMENTS = [
  'Outstanding build quality and craftsmanship.',
  'Fast and secure delivery, authentic piece.',
  'Exceeded my expectations, true to description.',
  'Clean aesthetics and very comfortable to use.',
  'Great value for money, highly recommended.'
];

const RATING_LABELS: Record<number, string> = {
  1: '1 Star - Poor',
  2: '2 Stars - Fair',
  3: '3 Stars - Good',
  4: '4 Stars - Very Good',
  5: '5 Stars - Excellent'
};

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  currentUser,
  onClose,
  onAddToCart,
  isWishlisted = false,
  onToggleWishlist,
  onOpenAuth
}) => {
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedColour, setSelectedColour] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isDescOpen, setIsDescOpen] = useState<boolean>(false);
  const [isSpecsOpen, setIsSpecsOpen] = useState<boolean>(false);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [filterRating, setFilterRating] = useState<number | null>(null);

  // Review form state
  const [newRating, setNewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [newComment, setNewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewNotice, setReviewNotice] = useState<string>('');
  const [reviewError, setReviewError] = useState<string>('');

  // Default colour & size options if none specified on product
  const availableColours = React.useMemo(() => {
    if (product?.availableColours && product.availableColours.length > 0) {
      return product.availableColours;
    }
    const specColour = product?.specs?.find((s) => s.label.toLowerCase().includes('colour') || s.label.toLowerCase().includes('color'))?.value;
    if (specColour) return specColour.split(',').map((c) => c.trim()).filter(Boolean);
    return ['Classic Original'];
  }, [product]);

  const availableSizes = React.useMemo(() => {
    if (product?.availableSizes && product.availableSizes.length > 0) {
      return product.availableSizes;
    }
    const specSize = product?.specs?.find((s) => s.label.toLowerCase().includes('size'))?.value;
    if (specSize) return specSize.split(',').map((s) => s.trim()).filter(Boolean);
    return product?.category.toLowerCase().includes('home') || product?.category.toLowerCase().includes('decor')
      ? ['King Size', 'Queen Size', 'Standard']
      : ['Unstitched (3-Piece)', 'Stitched Small', 'Stitched Medium', 'Stitched Large'];
  }, [product]);

  useEffect(() => {
    if (product) {
      setSelectedImage(product.image);
      setQuantity(1);
      setSelectedColour(availableColours[0] || '');
      setSelectedSize(availableSizes[0] || '');
      setIsDescOpen(false);
      setIsSpecsOpen(false);
      setFilterRating(null);
      setReviewNotice('');
      setReviewError('');
      setNewComment('');
      setNewRating(5);
      setHoverRating(0);

      const unsub = subscribeProductReviews(product.id, (liveReviews) => {
        setReviews(liveReviews);
      });
      return () => unsub();
    }
  }, [product, availableColours, availableSizes]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (product) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [product, onClose]);

  if (!product) return null;

  const allImages = [product.image, ...(product.additionalImages || [])];

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrease = () => {
    if (quantity < 10) setQuantity(quantity + 1);
  };

  const handleAdd = () => {
    const productWithSelections: Product = {
      ...product,
      selectedColour: selectedColour || availableColours[0],
      selectedSize: selectedSize || availableSizes[0]
    };
    onAddToCart(productWithSelections, quantity);
    onClose();
  };

  const handleSelectPrebuiltComment = (commentText: string) => {
    if (!newComment.trim()) {
      setNewComment(commentText);
    } else if (!newComment.includes(commentText)) {
      setNewComment(`${newComment} ${commentText}`);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmittingReview(true);
    setReviewNotice('');
    setReviewError('');

    const res = await saveProductReviewToDb(product.id, {
      userId: currentUser.uid,
      userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Customer',
      rating: newRating,
      comment: newComment.trim()
    });

    setIsSubmittingReview(false);
    if (res.success) {
      setReviewNotice('Thank you! Your review and rating have been saved.');
      setNewComment('');
      setTimeout(() => setReviewNotice(''), 4000);
    } else {
      setReviewError(res.error || 'Failed to submit review');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!product) return;
    const res = await deleteProductReviewFromDb(product.id, reviewId);
    if (res.success) {
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setReviewNotice('Review deleted');
      setTimeout(() => setReviewNotice(''), 3000);
    }
  };

  const hasReviews = reviews.length > 0;
  const effectiveRatingNumber = hasReviews
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : (product.reviewsCount > 0 ? product.rating : 0);

  const effectiveRating = effectiveRatingNumber > 0 ? effectiveRatingNumber.toFixed(1) : '0.0';
  const effectiveCount = hasReviews ? reviews.length : (product.reviewsCount || 0);

  const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  if (hasReviews) {
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      ratingCounts[star] = (ratingCounts[star] || 0) + 1;
    });
  }

  const filteredReviews = filterRating
    ? reviews.filter((r) => Math.round(r.rating) === filterRating)
    : reviews;

  const renderStars = (score: number, size = 'h-4 w-4') => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const fillAmount = Math.max(0, Math.min(1, score - (star - 1)));
          return (
            <div key={star} className="relative">
              <Star className={`${size} text-neutral-200`} />
              {fillAmount > 0 && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fillAmount * 100}%` }}
                >
                  <Star className={`${size} fill-amber-400 text-amber-400`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const displayedRatingValue = hoverRating > 0 ? hoverRating : newRating;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
      className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
    >
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl z-10 my-8">
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-white/90 hover:bg-white text-neutral-700 hover:text-neutral-900 shadow-md transition-all cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Gallery Column */}
          <div className="p-6 md:p-8 bg-stone-50 flex flex-col justify-between">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-white shadow-xs mb-4 border border-stone-200/60">
              <img
                src={selectedImage || product.image}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* Thumbnail selector */}
            {allImages.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className={`relative w-14 h-18 rounded-lg overflow-hidden shadow-xs transition-all shrink-0 cursor-pointer border ${
                      selectedImage === img
                        ? 'border-neutral-900 ring-1 ring-neutral-900'
                        : 'border-stone-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Column */}
          <div className="p-6 md:p-8 flex flex-col justify-between">
            <div>
              {/* Header Info */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-medium uppercase tracking-widest text-stone-400">
                  {product.category}
                </span>
                <div className="flex items-center gap-1.5">
                  {renderStars(effectiveRatingNumber, 'h-3.5 w-3.5')}
                  <span className="font-semibold text-xs text-neutral-900 tabular-nums">
                    {effectiveRating}
                  </span>
                  <span className="text-stone-400 text-xs tabular-nums">
                    ({effectiveCount})
                  </span>
                </div>
              </div>

              <h1 className="font-heading font-bold text-2xl sm:text-3xl text-neutral-900 mb-2 tracking-tight">
                {product.name}
              </h1>

              {/* Price in different text weight than heading */}
              <div className="mb-5 pb-3 border-b border-stone-200/80">
                <span className="font-sans font-normal text-2xl sm:text-3xl text-stone-900 tabular-nums">
                  {formatBDT(product.price)}
                </span>
              </div>

              {/* Description Accordion with + / - expansion */}
              <div className="border-b border-stone-200/70 pb-3 mb-3">
                <button
                  type="button"
                  onClick={() => setIsDescOpen(!isDescOpen)}
                  className="w-full flex items-center justify-between py-2 text-left text-xs uppercase tracking-wider font-bold text-neutral-900 hover:text-stone-600 transition-colors cursor-pointer select-none"
                >
                  <span>Description</span>
                  <span className="text-stone-500 font-normal text-base">
                    {isDescOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
                {isDescOpen && (
                  <div className="pt-1.5 pb-2 text-xs sm:text-sm text-stone-600 leading-relaxed space-y-2 animate-in fade-in duration-150">
                    <p>{product.description}</p>
                    {product.details && product.details !== product.description && (
                      <p className="text-stone-500 text-xs">{product.details}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Specifications Accordion with + / - expansion */}
              <div className="border-b border-stone-200/70 pb-3 mb-5">
                <button
                  type="button"
                  onClick={() => setIsSpecsOpen(!isSpecsOpen)}
                  className="w-full flex items-center justify-between py-2 text-left text-xs uppercase tracking-wider font-bold text-neutral-900 hover:text-stone-600 transition-colors cursor-pointer select-none"
                >
                  <span>Specifications</span>
                  <span className="text-stone-500 font-normal text-base">
                    {isSpecsOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
                {isSpecsOpen && (
                  <div className="pt-2 pb-2 space-y-2 text-xs animate-in fade-in duration-150">
                    {/* Available Colours in Specifications */}
                    <div className="flex justify-between py-1.5 px-3 bg-stone-50 rounded-lg">
                      <dt className="text-stone-500 font-medium">Available Colours</dt>
                      <dd className="text-neutral-900 font-semibold">{availableColours.join(', ')}</dd>
                    </div>

                    {/* Available Sizes in Specifications */}
                    <div className="flex justify-between py-1.5 px-3 bg-stone-50 rounded-lg">
                      <dt className="text-stone-500 font-medium">Available Sizes</dt>
                      <dd className="text-neutral-900 font-semibold">{availableSizes.join(', ')}</dd>
                    </div>

                    {/* Custom Specs */}
                    {product.specs && product.specs.map((spec, i) => (
                      <div key={i} className="flex justify-between py-1.5 px-3 bg-stone-50 rounded-lg">
                        <dt className="text-stone-500 font-medium">{spec.label}</dt>
                        <dd className="text-neutral-900 font-semibold">{spec.value}</dd>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selection Options & Add to Bag Actions */}
            <div className="space-y-4 pt-2">
              {/* Colour Selection */}
              {availableColours.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-neutral-900">
                      Select Colour
                    </span>
                    <span className="text-xs text-stone-500 font-medium">
                      {selectedColour || availableColours[0]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableColours.map((col, cIdx) => (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => setSelectedColour(col)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                          selectedColour === col
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                            : 'bg-stone-50 text-neutral-800 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {col}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {availableSizes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-neutral-900">
                      Select Size
                    </span>
                    <span className="text-xs text-stone-500 font-medium">
                      {selectedSize || availableSizes[0]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((sz, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                          selectedSize === sz
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                            : 'bg-stone-50 text-neutral-800 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity and Actions: Simple, Elegant, Premium */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                {/* Stepper */}
                <div className="flex items-center justify-between rounded-lg px-3 py-2 bg-stone-100 border border-stone-200/80 sm:w-32">
                  <button
                    onClick={handleDecrease}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    className="p-1 rounded text-stone-600 hover:text-neutral-900 disabled:opacity-30 cursor-pointer"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="font-semibold text-sm text-neutral-900 px-2 tabular-nums">
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncrease}
                    disabled={quantity >= 10}
                    aria-label="Increase quantity"
                    className="p-1 rounded text-stone-600 hover:text-neutral-900 disabled:opacity-30 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Add Button */}
                <button
                  onClick={handleAdd}
                  className="flex-1 flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs tracking-wider uppercase py-3 px-6 rounded-lg transition-all cursor-pointer active:scale-98 shadow-xs"
                >
                  <Plus className="h-4 w-4 text-stone-300" />
                  <span>Add to Bag ({quantity})</span>
                </button>

                {/* Wishlist Button */}
                {onToggleWishlist && (
                  <button
                    type="button"
                    onClick={() => onToggleWishlist(product.id)}
                    className={`p-3 rounded-lg border transition-colors flex items-center justify-center cursor-pointer ${
                      isWishlisted
                        ? 'bg-red-50 border-red-200 text-red-600'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Database Customer Reviews & Stars Average Section */}
        <div className="p-6 md:p-8 bg-neutral-50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-neutral-900" />
              <h2 className="font-heading font-extrabold text-xl text-neutral-900">
                Customer Reviews
              </h2>
            </div>
          </div>

          {/* Stars Average and Score Card */}
          <div className="bg-white rounded-2xl p-6 mb-8 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Overall Score Box */}
              <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-4">
                <span className="font-heading font-extrabold text-5xl text-neutral-900 mb-1">
                  {effectiveRating}
                </span>
                <div className="mb-2">
                  {renderStars(effectiveRatingNumber, 'h-5 w-5')}
                </div>
                <span className="text-sm font-semibold text-neutral-700">
                  {effectiveCount === 0
                    ? '0.0 average (0 reviews)'
                    : `Based on ${effectiveCount} ${effectiveCount === 1 ? 'review' : 'reviews'}`}
                </span>
                <span className="text-xs text-neutral-400 mt-0.5">
                  Verified customer ratings in database
                </span>
              </div>

              {/* Star Rating Breakdown Bars */}
              <div className="md:col-span-7 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingCounts[star] || 0;
                  const pct = effectiveCount > 0 ? Math.round((count / effectiveCount) * 100) : 0;
                  const isFiltered = filterRating === star;

                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFilterRating(filterRating === star ? null : star)}
                      className={`w-full flex items-center gap-3 p-1.5 rounded-lg transition-colors cursor-pointer text-left ${
                        isFiltered ? 'bg-neutral-100 font-bold' : 'hover:bg-neutral-50'
                      }`}
                    >
                      <span className="text-xs font-semibold text-neutral-700 w-12 shrink-0 flex items-center gap-1">
                        <span>{star}</span>
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                      </span>

                      {/* Bar */}
                      <div className="flex-1 bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-neutral-900 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <span className="text-xs text-neutral-500 w-16 text-right shrink-0">
                        {pct}% ({count})
                      </span>
                    </button>
                  );
                })}

                {filterRating && (
                  <div className="pt-2 flex justify-between items-center text-xs">
                    <span className="text-neutral-600 font-semibold">
                      Filtering by {filterRating} star reviews
                    </span>
                    <button
                      type="button"
                      onClick={() => setFilterRating(null)}
                      className="font-bold underline text-neutral-900 cursor-pointer"
                    >
                      Show All Reviews
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Single Clean Review & Star Giving Form */}
          <div className="bg-white rounded-2xl p-6 mb-8 shadow-xs">
            <h3 className="font-heading font-extrabold text-base text-neutral-900 mb-4">
              Write a Review
            </h3>

            {reviewNotice && (
              <div className="mb-4 p-3.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{reviewNotice}</span>
              </div>
            )}

            {reviewError && (
              <div className="mb-4 p-3.5 bg-red-50 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{reviewError}</span>
              </div>
            )}

            {!currentUser ? (
              <div className="py-6 text-center bg-neutral-50 rounded-xl">
                <p className="text-sm font-semibold text-neutral-800 mb-1">
                  Want to review this product?
                </p>
                <p className="text-xs text-neutral-500 mb-4">
                  Sign in with your email and password to share your experience.
                </p>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl cursor-pointer shadow-xs transition-colors"
                >
                  Sign In to Review
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Clean Star Rating Picker with Smooth Hover */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-2">
                    Your Rating
                  </label>
                  <div
                    className="inline-flex items-center gap-2 bg-neutral-50 p-2 rounded-xl"
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          className="p-1 rounded-lg hover:scale-115 transition-transform cursor-pointer"
                          aria-label={RATING_LABELS[star]}
                        >
                          <Star
                            className={`h-7 w-7 transition-colors ${
                              displayedRatingValue >= star
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-neutral-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    <span className="text-xs font-bold text-neutral-800 bg-white px-3 py-1.5 rounded-lg shadow-xs ml-2">
                      {RATING_LABELS[displayedRatingValue]}
                    </span>
                  </div>
                </div>

                {/* Pre-built Comment Chips */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs font-bold text-neutral-700">
                      Quick Suggestions (Click to add):
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PREBUILT_COMMENTS.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPrebuiltComment(chip)}
                        className="text-xs font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-left"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Text */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    Your Review
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Describe your experience with this product..."
                    className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl cursor-pointer shadow-xs transition-colors"
                  >
                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* List of customer reviews */}
          <div className="space-y-3">
            {filteredReviews.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-sm">
                {filterRating
                  ? `No ${filterRating} star reviews found.`
                  : 'No customer reviews yet. Be the first to rate and review this product.'}
              </div>
            ) : (
              filteredReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 bg-white rounded-2xl shadow-xs flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-heading font-bold text-sm text-neutral-900 block">
                        {rev.userName}
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {renderStars(rev.rating, 'h-3.5 w-3.5')}
                        <span className="text-xs font-bold text-neutral-700 ml-1">
                          {rev.rating}.0
                        </span>
                      </div>
                      {currentUser && (currentUser.uid === rev.userId || currentUser.email === 'syed111042@gmail.com') && (
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(rev.id)}
                          className="p-1 text-stone-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                          title="Delete review"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-neutral-700 leading-relaxed">
                    {rev.comment}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
