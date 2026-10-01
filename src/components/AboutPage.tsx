import React from 'react';
import { ArrowLeft, ShoppingBag, ShieldCheck, Truck, RefreshCw, Award } from 'lucide-react';

interface AboutPageProps {
  onNavigateToStore: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigateToStore }) => {
  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onNavigateToStore}
            className="inline-flex items-center gap-2 bg-white hover:bg-neutral-100 text-neutral-800 font-semibold text-sm px-4 py-2.5 rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Store</span>
          </button>
        </div>

        {/* Hero Section */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 sm:p-12 shadow-sm mb-8">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">
              Original Fashion & Luxury Living
            </span>
            <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-neutral-900 tracking-tight mb-6">
              ANIQ
            </h1>
            <p className="text-lg text-neutral-700 leading-relaxed mb-6 font-medium">
              <strong className="text-neutral-900 font-extrabold">ANIQ</strong> is a destination for elegant women’s wear and refined living, bringing together authentic Pakistani stitched and unstitched collections with a thoughtfully curated home aesthetic.
            </p>
            <p className="text-base text-neutral-600 leading-relaxed mb-4">
              Rooted in elegance, comfort, and sophistication, ANIQ offers premium pieces designed to make everyday living feel more beautiful, from distinctive outfits that celebrate personal style to timeless home essentials that create a sense of comfort and warmth.
            </p>
            <p className="text-base text-neutral-600 leading-relaxed">
              At ANIQ, we believe elevated living begins with the things that surround you and the way you express yourself.
            </p>
          </div>
        </div>

        {/* Visual Story Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl overflow-hidden shadow-sm">
            <div className="aspect-4/3 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80"
                alt="Original Pakistani Designer Dress"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 sm:p-8">
              <h2 className="font-heading font-bold text-xl text-neutral-900 mb-2">
                Elegant Women&apos;s Wear
              </h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Only authentic, original Pakistani designer suits. Premium luxury lawns, festive embroidered chiffons, and formal unstitched 3-piece collections with verifiable brand tags.
              </p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-3xl overflow-hidden shadow-sm">
            <div className="aspect-4/3 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80"
                alt="Luxury Home Decor Bedsheets and Comforters"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 sm:p-8">
              <h2 className="font-heading font-bold text-xl text-neutral-900 mb-2">
                Home Decor
              </h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Transform your master bedroom with 1000 TC Egyptian cotton bedsheet sets and quilted plush velvet winter comforters tailored for restful luxury.
              </p>
            </div>
          </div>
        </div>

        {/* Pillars */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 sm:p-12 shadow-sm mb-8">
          <h2 className="font-heading font-bold text-2xl text-neutral-900 mb-8 text-center">
            The ANIQ Promise
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 bg-neutral-50 rounded-2xl">
              <div className="h-10 w-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center mb-3">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-bold text-base text-neutral-900 mb-1">
                100% Original Pakistani Suits
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Zero replica guarantee. Every dress is directly imported from genuine brands.
              </p>
            </div>

            <div className="p-4 bg-neutral-50 rounded-2xl">
              <div className="h-10 w-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center mb-3">
                <Truck className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-bold text-base text-neutral-900 mb-1">
                Nationwide Delivery
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Express insured home delivery across all 64 districts in Bangladesh.
              </p>
            </div>

            <div className="p-4 bg-neutral-50 rounded-2xl">
              <div className="h-10 w-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center mb-3">
                <RefreshCw className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-bold text-base text-neutral-900 mb-1">
                Inspection on Arrival
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Verify embroidery, fabric purity, and bedding dimensions before payment.
              </p>
            </div>

            <div className="p-4 bg-neutral-50 rounded-2xl">
              <div className="h-10 w-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center mb-3">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-bold text-base text-neutral-900 mb-1">
                Client Concierge
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Direct WhatsApp and phone assistance for sizing and bedroom styling.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-neutral-900 text-white rounded-3xl p-8 sm:p-12 text-center shadow-lg">
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl mb-3">
            Explore the ANIQ Collections
          </h2>
          <p className="text-sm text-neutral-400 max-w-xl mx-auto mb-6">
            Discover original Pakistani women&apos;s dresses alongside luxury bedsheets and comforter sets.
          </p>
          <button
            onClick={onNavigateToStore}
            className="inline-flex items-center gap-2 bg-white hover:bg-neutral-100 text-neutral-900 font-bold px-6 py-3 rounded-xl shadow-md cursor-pointer transition-transform active:scale-95 text-sm"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Shop ANIQ Store</span>
          </button>
        </div>
      </div>
    </div>
  );
};
