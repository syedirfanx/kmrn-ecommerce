import React from 'react';
import { Logo } from './Logo';

interface FooterProps {
  logoUrl?: string;
  onNavigateToShop: () => void;
  onNavigateToWomensWear?: () => void;
  onNavigateToHomeDecor?: () => void;
  onNavigateToAbout: () => void;
  onNavigateToContact: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  logoUrl,
  onNavigateToShop,
  onNavigateToWomensWear,
  onNavigateToHomeDecor,
  onNavigateToAbout,
  onNavigateToContact
}) => {
  return (
    <footer
      className="relative text-neutral-300 pt-14 pb-12 mt-auto border-t border-stone-800/80 overflow-hidden"
      style={{
        backgroundColor: '#141414',
        backgroundImage: `
          repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.02) 0px, rgba(255, 255, 255, 0.02) 1px, transparent 1px, transparent 6px),
          repeating-linear-gradient(-45deg, rgba(255, 255, 255, 0.02) 0px, rgba(255, 255, 255, 0.02) 1px, transparent 1px, transparent 6px),
          radial-gradient(ellipse at 50% 0%, rgba(217, 180, 110, 0.04) 0%, transparent 70%)
        `
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-16 mb-12">
          {/* Brand & Social Channels */}
          <div className="space-y-4">
            <div className="mb-2">
              <Logo variant="dark" size="md" customLogoUrl={logoUrl} />
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
              Original Pakistani designer dresses and luxury home decor bedsheets and comforters.
            </p>

            {/* Social Media Channels */}
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook page"
                className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors border border-neutral-800 shadow-xs"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram page"
                className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors border border-neutral-800 shadow-xs"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <span className="font-heading font-bold text-xs text-stone-300 uppercase tracking-widest block mb-4">
              Collections
            </span>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <button
                  onClick={onNavigateToWomensWear || onNavigateToShop}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Elegant Women&apos;s Wear
                </button>
              </li>
              <li>
                <button
                  onClick={onNavigateToHomeDecor || onNavigateToShop}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Home Decor
                </button>
              </li>
              <li>
                <button onClick={onNavigateToShop} className="hover:text-white transition-colors cursor-pointer text-left">
                  All Collections
                </button>
              </li>
              <li>
                <button onClick={onNavigateToAbout} className="hover:text-white transition-colors cursor-pointer">
                  About Aniq
                </button>
              </li>
              <li>
                <button onClick={onNavigateToContact} className="hover:text-white transition-colors cursor-pointer">
                  Client Concierge
                </button>
              </li>
            </ul>
          </div>

          {/* Client Care */}
          <div>
            <span className="font-heading font-bold text-xs text-stone-300 uppercase tracking-widest block mb-4">
              Client Care
            </span>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>Email: concierge@aniq.bd</li>
              <li>Phone: +880 1711-000000</li>
              <li>Hours: 10:00 AM to 8:00 PM</li>
              <li>Banani, Dhaka, Bangladesh</li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Line */}
        <div className="pt-6 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <p>Aniq Lifestyle. All rights reserved.</p>
          <div className="flex gap-4">
            <span>Bangladesh</span>
            <span>BDT Currency</span>
            <span>Original Guaranteed</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
