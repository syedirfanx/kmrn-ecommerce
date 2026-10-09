import React, { useState, useEffect } from 'react';
import {
  Star,
  Plus,
  Minus,
  ShoppingBag,
  Heart,
  Check,
  ArrowLeft,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Trash2,
  AlertCircle,
  Tag,
  Share2,
  Copy,
  Send,
  MessageCircle
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Product, ProductReview } from '../types';
import { formatBDT } from '../utils/format';
import {
  subscribeProductReviews,
  saveProductReviewToDb,
  deleteProductReviewFromDb
} from '../services/storeService';
import { ProductCard } from './ProductCard';

interface ProductPageProps {
  product: Product;
  allProducts: Product[];
  currentUser: User | null;
  onAddToCart: (product: Product, quantity: number) => void;
  onProceedToCheckout?: () => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
  onNavigateToHome: () => void;
  onNavigateToCategory: (categoryName: string) => void;
  onSelectProduct: (product: Product) => void;
  onOpenQuickView: (product: Product) => void;
  onOpenAuth: () => void;
  onGoBack?: () => void;
}

const PREBUILT_COMMENTS = [
  'Outstanding craftsmanship and 100% authentic designer quality.',
  'Fast delivery, fabric and embroidery exactly as shown.',
  'Exceeded my expectations, beautiful rich colours and luxury feel.',
  'Very comfortable, elegant silhouette and premium stitching.'
];

export const ProductPage: React.FC<ProductPageProps> = ({
  product,
  allProducts,
  currentUser,
  onAddToCart,
  onProceedToCheckout,
  isWishlisted = false,
  onToggleWishlist,
  onNavigateToHome,
  onNavigateToCategory,
  onSelectProduct,
  onOpenQuickView,
  onOpenAuth,
  onGoBack
}) => {
  const [selectedImage, setSelectedImage] = useState<string>(product.image);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedColour, setSelectedColour] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isDescOpen, setIsDescOpen] = useState<boolean>(false);
  const [isSpecsOpen, setIsSpecsOpen] = useState<boolean>(false);
  const [justAdded, setJustAdded] = useState<boolean>(false);
  const [reviews, setReviews] = useState<ProductReview[]>([]);

  // Default colour & size options
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

  // Review Form State
  const [newRating, setNewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [newComment, setNewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewNotice, setReviewNotice] = useState<string>('');
  const [reviewError, setReviewError] = useState<string>('');

  // Share state
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const productUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/product/${product.id}`
    : `https://aniq.com/product/${product.id}`;

  const shareText = `${product.name} - ${product.description ? product.description.slice(0, 100) + '...' : ''}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`;
    window.open(url, '_blank', 'width=600,height=500');
  };

  const handleShareMessenger = () => {
    // Facebook Messenger send dialog
    const url = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(productUrl)}&app_id=291494419107518&redirect_uri=${encodeURIComponent(productUrl)}`;
    window.open(url, '_blank', 'width=600,height=500');
  };

  const handleShareWhatsApp = () => {
    const text = `${product.name}\n${formatBDT(product.price)}\n${productUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareInstagram = () => {
    // Instagram Direct / profile link - copy link with instruction
    handleCopyLink();
    window.open('https://www.instagram.com/direct/inbox/', '_blank');
  };

  const allImages = React.useMemo(() => {
    const list = [product.image];
    if (product.additionalImages && product.additionalImages.length > 0) {
      product.additionalImages.forEach((img) => {
        if (!list.includes(img)) list.push(img);
      });
    }
    return list;
  }, [product]);

  useEffect(() => {
    setSelectedImage(product.image);
    setQuantity(1);
    setSelectedColour(availableColours[0] || '');
    setSelectedSize(availableSizes[0] || '');
    setIsDescOpen(false);
    setIsSpecsOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product?.id]);

  // Subscribe to real-time reviews
  useEffect(() => {
    if (!product?.id) return;
    const unsubscribe = subscribeProductReviews(product.id, (revs) => {
      setReviews(revs);
    });
    return () => unsubscribe();
  }, [product?.id]);

  const handleAdd = () => {
    const productWithSelections: Product = {
      ...product,
      selectedColour: selectedColour || availableColours[0],
      selectedSize: selectedSize || availableSizes[0]
    };
    onAddToCart(productWithSelections, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleBuyNow = () => {
    const productWithSelections: Product = {
      ...product,
      selectedColour: selectedColour || availableColours[0],
      selectedSize: selectedSize || availableSizes[0]
    };
    onAddToCart(productWithSelections, quantity);
    if (onProceedToCheckout) {
      onProceedToCheckout();
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewNotice('');
    setReviewError('');

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!newComment.trim()) {
      setReviewError('Please write your review comment before submitting.');
      return;
    }

    setIsSubmittingReview(true);
    const newRev: ProductReview = {
      id: `rev-${Date.now()}`,
      productId: product.id,
      userId: currentUser.uid,
      userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Verified Customer',
      rating: newRating,
      comment: newComment.trim(),
      createdAt: new Date().toISOString()
    };

    const res = await saveProductReviewToDb(product.id, newRev);
    setIsSubmittingReview(false);

    if (res.success) {
      setNewComment('');
      setReviewNotice('Thank you! Your verified review has been published.');
      setTimeout(() => setReviewNotice(''), 4000);
    } else {
      setReviewError(res.error || 'Failed to submit review.');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    await deleteProductReviewFromDb(product.id, reviewId);
  };

  const relatedProducts = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const hasReviews = reviews.length > 0;
  const averageRatingNumber = hasReviews
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : (product.reviewsCount > 0 ? (product.rating || 0) : 0);

  const averageRating = averageRatingNumber > 0 ? averageRatingNumber.toFixed(1) : '0.0';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4 space-y-5 sm:space-y-8 animate-in fade-in duration-300">
      {/* Go Back & Quick Share Row */}
      <div className="flex items-center justify-between gap-3">
        {onGoBack ? (
          <button
            type="button"
            onClick={onGoBack}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-stone-100 text-neutral-900 border border-stone-200/90 rounded-xl text-xs font-category font-bold tracking-wider uppercase transition-all shadow-2xs hover:shadow-xs cursor-pointer group"
            aria-label="Go back to previous page"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-stone-500 group-hover:text-neutral-900 group-hover:-translate-x-0.5 transition-transform" />
            <span>Go Back</span>
          </button>
        ) : <div />}

        {/* Share Button & Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsShareOpen(!isShareOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 text-neutral-800 border border-stone-200/90 rounded-xl text-xs font-category font-semibold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            aria-label="Share this product"
            aria-expanded={isShareOpen}
          >
            <Share2 className="h-3.5 w-3.5 text-stone-600" />
            <span>Share</span>
          </button>

          {isShareOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-stone-200 p-4 z-40 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                <span className="font-heading font-bold text-xs text-neutral-900">Share Product</span>
                <button
                  type="button"
                  onClick={() => setIsShareOpen(false)}
                  className="p-1 text-stone-400 hover:text-neutral-900 rounded-lg"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Preview card with image, title, and description snippet */}
              <div className="flex gap-2.5 p-2 bg-stone-50 rounded-xl border border-stone-200/70 mb-3">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-12 h-16 object-cover rounded-lg bg-stone-200 shrink-0 border border-stone-200"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-neutral-900 truncate">
                    {product.name}
                  </h4>
                  <p className="text-[11px] font-semibold text-neutral-800 tabular-nums">
                    {formatBDT(product.price)}
                  </p>
                  <p className="text-[10px] text-stone-500 line-clamp-2 mt-0.5 leading-snug">
                    {product.description || 'Authentic collection at Aniq Lifestyle'}
                  </p>
                </div>
              </div>

              {/* Share Channels */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {/* Facebook */}
                <button
                  type="button"
                  onClick={handleShareFacebook}
                  className="flex items-center gap-2 p-2 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] font-semibold text-xs cursor-pointer transition-colors"
                >
                  <span className="w-5 h-5 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[10px] font-extrabold">f</span>
                  <span>Facebook</span>
                </button>

                {/* Messenger */}
                <button
                  type="button"
                  onClick={handleShareMessenger}
                  className="flex items-center gap-2 p-2 rounded-xl bg-[#00B2FF]/10 hover:bg-[#00B2FF]/20 text-[#0084FF] font-semibold text-xs cursor-pointer transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-[#0084FF]" />
                  <span>Messenger</span>
                </button>

                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs cursor-pointer transition-colors"
                >
                  <Send className="h-4 w-4 text-emerald-600" />
                  <span>WhatsApp</span>
                </button>

                {/* Instagram Message */}
                <button
                  type="button"
                  onClick={handleShareInstagram}
                  className="flex items-center gap-2 p-2 rounded-xl bg-[#E1306C]/10 hover:bg-[#E1306C]/20 text-[#E1306C] font-semibold text-xs cursor-pointer transition-colors"
                >
                  <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-400 via-[#E1306C] to-purple-600 flex items-center justify-center text-[9px] text-white font-bold">ig</span>
                  <span>Instagram</span>
                </button>
              </div>

              {/* Copy Link Button */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-white font-category font-bold text-xs rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Product Link</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Gallery */}
        <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
          {/* Thumbnails list */}
          {allImages.length > 1 && (
            <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto max-h-[580px] pb-2 sm:pb-0 scrollbar-none shrink-0">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`relative w-16 sm:w-20 aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                    selectedImage === img
                      ? 'border-neutral-900 shadow-md scale-95'
                      : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} thumbnail ${i + 1}`}
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Main Hero Photo */}
          <div className="relative flex-1 aspect-[3/4] bg-stone-100 rounded-3xl overflow-hidden shadow-lg border border-stone-200/80 group">
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            />

            {/* Wishlist Floating Button */}
            {onToggleWishlist && (
              <button
                type="button"
                onClick={() => onToggleWishlist(product.id)}
                className="absolute top-4 right-4 p-3 rounded-full bg-white/90 hover:bg-white text-stone-700 shadow-md backdrop-blur-xs transition-transform active:scale-90 cursor-pointer z-10"
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart
                  className={`h-5 w-5 ${
                    isWishlisted ? 'fill-red-500 text-red-500' : 'text-stone-700 hover:text-neutral-900'
                  }`}
                />
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Product Information & Purchase Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 leading-tight mb-3">
              {product.name}
            </h1>

            {/* Out of Stock Notice */}
            {product.inStock === false && (
              <div className="mb-3 inline-flex items-center gap-2 px-3 py-1 bg-red-100 border border-red-200 text-red-800 rounded-lg text-xs font-category font-bold uppercase tracking-wider">
                <span>Out of Stock</span>
              </div>
            )}

            {/* Price & Rating Row */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-200/80">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-stone-100 border border-stone-200 rounded-xl text-neutral-900 shadow-xs">
                <Tag className="h-4 w-4 text-stone-600 shrink-0" />
                <span className="font-sans font-normal text-2xl sm:text-3xl tabular-nums">
                  {formatBDT(product.price)}
                </span>
              </div>

              {/* Star Rating Badge */}
              <div className="flex items-center gap-1.5 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200">
                <Star className={`h-4 w-4 ${averageRatingNumber > 0 ? 'fill-amber-400 text-amber-400' : 'fill-stone-300 text-stone-300'}`} />
                <span className="font-bold text-xs text-neutral-900 tabular-nums">{averageRating}</span>
                <span className="text-[11px] text-stone-500 font-medium">({reviews.length} reviews)</span>
              </div>
            </div>
          </div>

          {/* Description Accordion with + / - expansion */}
          <div className="border-b border-stone-200/70 pb-3">
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
              <div className="pt-2 pb-2 text-xs sm:text-sm text-stone-600 leading-relaxed space-y-2 animate-in fade-in duration-150">
                <p>{product.description}</p>
              </div>
            )}
          </div>

          {/* Specifications Accordion with + / - expansion */}
          <div className="border-b border-stone-200/70 pb-3">
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
                {/* Colours in Specifications */}
                <div className="flex justify-between py-2 px-3 bg-stone-50 rounded-lg">
                  <dt className="text-stone-500 font-medium">Colours</dt>
                  <dd className="text-neutral-900 font-semibold">{availableColours.join(', ')}</dd>
                </div>

                {/* Sizes in Specifications */}
                <div className="flex justify-between py-2 px-3 bg-stone-50 rounded-lg">
                  <dt className="text-stone-500 font-medium">Sizes</dt>
                  <dd className="text-neutral-900 font-semibold">{availableSizes.join(', ')}</dd>
                </div>

                {/* Custom Specs */}
                {product.specs && product.specs.map((spec, i) => (
                  <div key={i} className="flex justify-between py-2 px-3 bg-stone-50 rounded-lg">
                    <dt className="text-stone-500 font-medium">{spec.label}</dt>
                    <dd className="text-neutral-900 font-semibold">{spec.value}</dd>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Colour and Size Selection Options */}
          <div className="space-y-4 pt-1">
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
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
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
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
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
          </div>

          {/* Quantity Selector & Action Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-category font-bold text-stone-700">Quantity</span>
              <div className="flex items-center bg-stone-100 rounded-xl p-1 border border-stone-200">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 flex items-center justify-center text-stone-600 hover:text-neutral-900 rounded-lg hover:bg-white transition-colors cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center text-xs font-bold text-neutral-900 tabular-nums select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 flex items-center justify-center text-stone-600 hover:text-neutral-900 rounded-lg hover:bg-white transition-colors cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={product.inStock === false}
                onClick={handleAdd}
                className="w-full py-3.5 px-6 rounded-2xl bg-neutral-900 hover:bg-neutral-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-category font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer"
              >
                {product.inStock === false ? (
                  <span>Out of Stock</span>
                ) : justAdded ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span>Added to Bag</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    <span>Add to Bag</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={product.inStock === false}
                onClick={handleBuyNow}
                className="w-full py-3.5 px-6 rounded-2xl bg-stone-200 hover:bg-stone-300 disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed text-neutral-900 font-category font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
              >
                <span>Buy Now</span>
              </button>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-stone-200/80 text-center font-category">
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 flex flex-col items-center">
              <ShieldCheck className="h-5 w-5 text-amber-600 mb-1" />
              <span className="text-[11px] font-bold text-neutral-900">100% Original</span>
              <span className="text-[10px] text-stone-500">Designer Brand</span>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 flex flex-col items-center">
              <Truck className="h-5 w-5 text-neutral-900 mb-1" />
              <span className="text-[11px] font-bold text-neutral-900">Express Shipping</span>
              <span className="text-[10px] text-stone-500">Fast Doorstep</span>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 flex flex-col items-center">
              <RotateCcw className="h-5 w-5 text-neutral-900 mb-1" />
              <span className="text-[11px] font-bold text-neutral-900">Support</span>
              <span className="text-[10px] text-stone-500">Direct Helpline</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews & Feedback Section */}
      <section aria-label="Customer Reviews" className="pt-8 border-t border-stone-200/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold text-neutral-900">Customer Reviews</h2>
            <p className="font-paragraph text-xs text-stone-500">
              Verified feedback from discerning customers who purchased this piece.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-stone-100 px-4 py-2 rounded-2xl border border-stone-200">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-4 w-4 ${
                    s <= Math.round(Number(averageRating))
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-stone-300 text-stone-300'
                  }`}
                />
              ))}
            </div>
            <span className="font-heading font-extrabold text-sm text-neutral-900 tabular-nums">
              {averageRating} / 5.0
            </span>
          </div>
        </div>

        {/* Submit Review Box */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
          <h3 className="font-heading text-lg font-bold text-neutral-900">Write a Review</h3>

          {currentUser ? (
            <form onSubmit={handleAddReview} className="space-y-4">
              <div>
                <label className="block text-xs font-category font-bold text-stone-700 mb-1">
                  Your Rating
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setNewRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= (hoverRating || newRating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-stone-200 text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-category font-semibold text-stone-600 ml-2">
                    {newRating} Star{newRating > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Quick Prompt Ideas */}
              <div className="flex flex-wrap gap-2 pt-1">
                {PREBUILT_COMMENTS.map((comm, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNewComment(comm)}
                    className="text-[11px] font-category bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1 rounded-full transition-colors cursor-pointer"
                  >
                    "{comm}"
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-category font-bold text-stone-700 mb-1">
                  Your Comments
                </label>
                <textarea
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share details regarding fabric quality, fit, embroidery, or delivery experience..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs font-paragraph text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              {reviewError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{reviewError}</span>
                </div>
              )}

              {reviewNotice && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>{reviewNotice}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-category font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingReview ? 'Submitting...' : 'Post Review'}
              </button>
            </form>
          ) : (
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between">
              <span className="text-xs font-paragraph text-stone-600">
                Please sign in to share your verified customer review.
              </span>
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-category font-bold tracking-wider uppercase cursor-pointer"
              >
                Sign In
              </button>
            </div>
          )}
        </div>

        {/* Existing Reviews List */}
        {reviews.length === 0 ? (
          <p className="text-xs text-stone-400 italic p-6 bg-stone-50 rounded-2xl text-center">
            No reviews submitted yet. Be the first to review this product!
          </p>
        ) : (
          <div className="space-y-3">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 bg-white rounded-2xl border border-stone-200/80 shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-sm text-neutral-900">{rev.userName}</span>
                    <span className="text-[11px] text-stone-400 font-category">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${
                            s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'fill-stone-200 text-stone-200'
                          }`}
                        />
                      ))}
                    </div>

                    {currentUser && currentUser.uid === rev.userId && (
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(rev.id)}
                        className="p-1 text-stone-400 hover:text-red-600 rounded cursor-pointer"
                        title="Delete your review"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="font-paragraph text-xs text-stone-700 leading-relaxed">{rev.comment}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Related Products Carousel / Grid */}
      {relatedProducts.length > 0 && (
        <section aria-label="Related Products" className="pt-8 border-t border-stone-200/80 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl font-bold text-neutral-900">You May Also Admire</h2>
            <button
              type="button"
              onClick={() => onNavigateToCategory(product.category)}
              className="font-category text-xs font-bold uppercase tracking-wider text-stone-600 hover:text-neutral-900 underline cursor-pointer"
            >
              View More
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard
                key={rel.id}
                product={rel}
                onAddToCart={(p, q) => onAddToCart(p, q)}
                onViewDetails={(p) => onSelectProduct(p)}
                onQuickView={(p) => onOpenQuickView(p)}
                isWishlisted={isWishlisted}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
