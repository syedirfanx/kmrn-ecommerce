import React, { useState } from 'react';
import { MapPin, Send, Check, AlertCircle, Phone } from 'lucide-react';
import { submitContactMessage } from '../services/storeService';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!formData.name.trim() || !formData.message.trim()) {
      setErrorMessage('Please fill in your name and message.');
      return;
    }

    setIsSubmitting(true);
    const res = await submitContactMessage({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      subject: formData.subject.trim() || 'General Inquiry',
      message: formData.message.trim()
    });
    setIsSubmitting(false);

    if (res.success) {
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 6000);
    } else {
      setErrorMessage(res.error || 'Failed to send message. Please try again.');
    }
  };

  return (
    <div className="min-h-screen py-8 sm:py-12 bg-[#faf9f6]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-stone-200/80 shadow-xs mb-8">
          <h1 className="font-heading font-medium text-3xl sm:text-5xl text-neutral-900 tracking-tight mb-4">
            Contact ANIQ
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
            Inquiries regarding original Pakistani dress collections, luxury bedding, or custom requests can be sent using the form below or through direct contacts.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Contact Details Card: Location, WhatsApp, and Social Media */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
              <h2 className="font-heading font-semibold text-lg text-neutral-900">
                Contact Information
              </h2>

              <div className="space-y-5">
                {/* Location */}
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-stone-100 text-neutral-900 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-stone-400 block uppercase tracking-wider">
                      Location
                    </span>
                    <p className="text-xs sm:text-sm text-neutral-800 font-medium leading-relaxed">
                      Road: 02, Block: B, Aftabnagar, Dhaka 1212, Bangladesh
                    </p>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.666-.699c.974.531 1.769.815 2.802.815 3.181 0 5.768-2.586 5.768-5.767.001-3.181-2.586-5.767-5.768-5.767zm3.377 8.212c-.144.405-.837.775-1.164.825-.327.05-.75.069-1.209-.079-.296-.095-.679-.228-1.171-.441-2.072-.897-3.414-2.999-3.518-3.138-.104-.139-.844-1.121-.844-2.138 0-1.017.534-1.516.724-1.722.189-.207.414-.258.552-.258.138 0 .276.002.396.008.127.006.297-.048.464.354.172.414.586 1.432.638 1.536.052.103.086.225.017.362-.069.138-.103.224-.207.345-.103.121-.218.27-.311.363-.104.103-.212.215-.091.423.121.207.537.886 1.152 1.434.792.706 1.46.924 1.667 1.028.207.103.328.086.448-.052.121-.138.517-.603.655-.81.138-.207.276-.172.466-.103.189.069 1.206.569 1.413.672.207.103.345.155.396.241.052.086.052.5-.092.905z" />
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.176L2 22l4.981-1.306A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.614 0-3.126-.456-4.417-1.246l-.317-.194-2.964.777.791-2.89-.207-.33A8.163 8.163 0 013.8 12c0-4.521 3.679-8.2 8.2-8.2s8.2 3.679 8.2 8.2-3.679 8.2-8.2 8.2z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-stone-400 block uppercase tracking-wider">
                      WhatsApp
                    </span>
                    <a
                      href="https://wa.me/8801554555071"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm font-semibold text-neutral-900 hover:text-emerald-700 transition-colors"
                    >
                      +880 1554-555071
                    </a>
                  </div>
                </div>
              </div>

              {/* Social Media Channels */}
              <div className="pt-5 border-t border-stone-100">
                <span className="text-[11px] font-semibold text-stone-400 block uppercase tracking-wider mb-3">
                  Social Media
                </span>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Facebook */}
                  <a
                    href="https://www.facebook.com/aniqeww"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-neutral-800 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <svg className="h-4 w-4 fill-current text-blue-600" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>Facebook</span>
                  </a>

                  {/* Instagram */}
                  <a
                    href="https://www.instagram.com/aniq_elegant"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-neutral-800 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <svg className="h-4 w-4 fill-current text-pink-600" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    <span>Instagram</span>
                  </a>

                  {/* TikTok */}
                  <a
                    href="https://www.tiktok.com/@aniq_elegant"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-neutral-800 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <svg className="h-4 w-4 fill-current text-neutral-900" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.11V9.4a6.33 6.33 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.71a8.21 8.21 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.14z" />
                    </svg>
                    <span>TikTok</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs">
              <h2 className="font-heading font-semibold text-lg text-neutral-900 mb-6">
                Send a Message
              </h2>

              {submitted ? (
                <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200 text-center space-y-2">
                  <div className="h-12 w-12 rounded-full bg-neutral-900 text-white flex items-center justify-center mx-auto mb-2">
                    <Check className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading font-semibold text-base text-neutral-900">
                    Message Sent
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
                    Your inquiry has been submitted and will be reviewed by the ANIQ team.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMessage && (
                    <div className="p-3 bg-red-50 text-red-800 rounded-xl text-xs font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        Phone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+880 1..."
                        className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        Subject
                      </label>
                      <input
                        type="text"
                        placeholder="Product inquiry or question"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Message *
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Write your message here..."
                      className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white font-semibold text-xs uppercase tracking-wider py-3 px-6 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                  >
                    <Send className="h-4 w-4" />
                    <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
