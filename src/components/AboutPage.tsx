import React from 'react';
import { ShieldCheck, Truck, RefreshCw, Award } from 'lucide-react';

interface AboutPageProps {
  onNavigateToCategory?: (categoryName: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = () => {
  return (
    <div className="min-h-screen py-8 sm:py-12 bg-[#faf9f6]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-stone-200/80 shadow-xs mb-8">
          <div className="max-w-3xl">
            <h1 className="font-heading font-medium text-3xl sm:text-5xl text-neutral-900 tracking-tight mb-6">
              About ANIQ
            </h1>
            <div className="space-y-5 text-sm sm:text-base text-stone-700 font-normal leading-relaxed">
              <p>
                ANIQ Lifestyle began its journey on 10 October 2024 with a simple vision — to bring elegant, authentic and thoughtfully selected lifestyle products to customers in Bangladesh. What started with a passion for Pakistani-inspired women&apos;s wear has gradually grown into a lifestyle brand, with ANIQ Women&apos;s Wear and ANIQ Home Decor bringing together fashion and beautiful everyday living.
              </p>
              <p>
                At ANIQ, we believe trust comes before a sale. We are committed to offering authentic, carefully selected products with honest descriptions and transparent pricing. Every product is chosen with attention to quality, design and customer expectations, so that what you see is what you receive.
              </p>
              <p>
                Our relationship with customers does not end with delivery. We stand behind the products we offer and provide exchange and return facilities according to our policy for eligible cases. Our goal is simple: to build ANIQ as a brand that customers can return to with confidence — for quality, authenticity and a shopping experience they can trust.
              </p>
            </div>
          </div>
        </div>

        {/* Visual Story Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-3xl overflow-hidden border border-stone-200/80 shadow-xs">
            <div className="aspect-4/3 overflow-hidden bg-stone-100">
              <img
                src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80"
                alt="Pakistani Designer Dress"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 sm:p-8">
              <h2 className="font-heading font-medium text-xl text-neutral-900 mb-2">
                Women&apos;s Wear
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Authentic, original Pakistani designer suits. Premium luxury lawns, festive embroidered chiffons, and formal 3-piece collections.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl overflow-hidden border border-stone-200/80 shadow-xs">
            <div className="aspect-4/3 overflow-hidden bg-stone-100">
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

        {/* Standards */}
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
                Original Suits
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
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-semibold text-sm text-neutral-900 mb-1">
                Secure Ordering
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Verified Cash on Delivery with complete transparency.
              </p>
            </div>

            <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100">
              <div className="h-10 w-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center mb-3">
                <RefreshCw className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-semibold text-sm text-neutral-900 mb-1">
                Customer Support
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Dedicated WhatsApp assistance from inquiry through delivery.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
