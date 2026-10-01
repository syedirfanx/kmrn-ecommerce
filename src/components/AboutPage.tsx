import React from 'react';
import { ArrowLeft, ShoppingBag, ShieldCheck, Truck, RefreshCw, Award } from 'lucide-react';

interface AboutPageProps {
  onNavigateToStore: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigateToStore }) => {
  return (
    <div className="min-h-screen py-8 sm:py-12 bg-[#faf9f6]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onNavigateToStore}
            className="inline-flex items-center gap-2 bg-white hover:bg-stone-100 text-neutral-800 font-semibold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl border border-stone-200 shadow-xs cursor-pointer transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Store</span>
          </button>
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-stone-200/80 shadow-xs mb-8">
          <div className="max-w-3xl">
            <h1 className="font-heading font-medium text-3xl sm:text-5xl text-neutral-900 tracking-tight mb-6">
              ANIQ
            </h1>
            <p className="text-base sm:text-lg text-neutral-800 leading-relaxed mb-5 font-medium">
              ANIQ is a destination for elegant women&apos;s wear and refined living, bringing together authentic Pakistani stitched and unstitched collections with a curated home aesthetic.
            </p>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed mb-4">
              Rooted in elegance, comfort, and sophistication, ANIQ offers premium pieces designed to make everyday living feel more beautiful, from distinctive outfits that celebrate personal style to timeless home essentials that create comfort and warmth.
            </p>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
              At ANIQ, we believe elevated living begins with the things that surround you and the way you express yourself.
            </p>
          </div>
        </div>

        {/* Visual Story Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-3xl overflow-hidden border border-stone-200/80 shadow-xs">
            <div className="aspect-[4/3] overflow-hidden bg-stone-100">
              <img
                src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80"
                alt="Pakistani Designer Dress"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 sm:p-8">
              <h2 className="font-heading font-medium text-xl text-neutral-900 mb-2">
                Elegant Women&apos;s Wear
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Authentic, original Pakistani designer suits. Premium luxury lawns, festive embroidered chiffons, and formal 3-piece collections.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl overflow-hidden border border-stone-200/80 shadow-xs">
            <div className="aspect-[4/3] overflow-hidden bg-stone-100">
              <img
                src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80"
                alt="Luxury Home Decor Bedsheets and Comforters"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 sm:p-8">
              <h2 className="font-heading font-medium text-xl text-neutral-900 mb-2">
                Home Decor
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Transform your home with 1000 TC Egyptian cotton bedsheet sets and quilted velvet comforters crafted for restful luxury.
              </p>
            </div>
          </div>
        </div>

        {/* Pillars */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-stone-200/80 shadow-xs mb-8">
          <h2 className="font-heading font-medium text-2xl text-neutral-900 mb-8 text-center">
            The ANIQ Standards
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100">
              <div className="h-10 w-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center mb-3">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-semibold text-sm text-neutral-900 mb-1">
                Original Pakistani Suits
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Zero replica policy. Genuine stitched and unstitched branded pieces.
              </p>
            </div>

            <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100">
              <div className="h-10 w-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center mb-3">
                <Truck className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-semibold text-sm text-neutral-900 mb-1">
                Nationwide Delivery
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Direct insured home delivery across all 64 districts in Bangladesh.
              </p>
            </div>

            <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100">
              <div className="h-10 w-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center mb-3">
                <RefreshCw className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-semibold text-sm text-neutral-900 mb-1">
                Inspection on Arrival
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Verify embroidery, fabric quality, and bedding dimensions upon delivery.
              </p>
            </div>

            <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100">
              <div className="h-10 w-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center mb-3">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-semibold text-sm text-neutral-900 mb-1">
                Client Support
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Direct WhatsApp and phone assistance for sizing and bedroom styling.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-neutral-900 text-white rounded-3xl p-8 sm:p-12 text-center shadow-xs">
          <h2 className="font-heading font-medium text-2xl sm:text-3xl mb-3">
            Explore the Collection
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 max-w-xl mx-auto mb-6">
            Discover original Pakistani women&apos;s dresses alongside luxury bedsheets and comforter sets.
          </p>
          <button
            onClick={onNavigateToStore}
            className="inline-flex items-center gap-2 bg-white hover:bg-stone-100 text-neutral-900 font-semibold text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-xs cursor-pointer transition-transform active:scale-95"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Shop Store</span>
          </button>
        </div>
      </div>
    </div>
  );
};
