import React, { useState } from 'react';
import { ArrowLeft, Mail, Phone, MapPin, Clock, Send, Check, AlertCircle } from 'lucide-react';
import { submitContactMessage } from '../services/storeService';

interface ContactPageProps {
  onNavigateToStore: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigateToStore }) => {
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
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMessage('Please fill in your name, email, and message.');
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

        {/* Header */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-stone-200/80 shadow-xs mb-8">
          <h1 className="font-heading font-medium text-3xl sm:text-5xl text-neutral-900 tracking-tight mb-4">
            Contact ANIQ
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
            Have an inquiry about Pakistani dress collections, bedsheets, comforters, or custom orders? Reach out to us directly or leave a message below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Contact Details Card: Email, Location, Social Media */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
              <h2 className="font-heading font-semibold text-lg text-neutral-900">
                Contact Information
              </h2>

              <div className="space-y-4">
                {/* Email */}
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-stone-100 text-neutral-900 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-stone-400 block uppercase tracking-wider">
                      Email
                    </span>
                    <a
                      href="mailto:syed111042@gmail.com"
                      className="text-xs sm:text-sm font-medium text-neutral-900 hover:underline break-all"
                    >
                      syed111042@gmail.com
                    </a>
                  </div>
                </div>

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
                      Road 11, Banani, Dhaka, Bangladesh
                    </p>
                  </div>
                </div>

                {/* Phone & WhatsApp */}
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-stone-100 text-neutral-900 flex items-center justify-center shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-stone-400 block uppercase tracking-wider">
                      Phone & WhatsApp
                    </span>
                    <a
                      href="tel:+8801711000000"
                      className="text-xs sm:text-sm font-medium text-neutral-900 hover:underline"
                    >
                      +880 1711-000000
                    </a>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-stone-100 text-neutral-900 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-stone-400 block uppercase tracking-wider">
                      Hours
                    </span>
                    <p className="text-xs sm:text-sm text-neutral-800 font-medium">
                      10:00 AM to 8:00 PM (Saturday to Thursday)
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="pt-4 border-t border-stone-100">
                <span className="text-[11px] font-semibold text-stone-400 block uppercase tracking-wider mb-3">
                  Social Media
                </span>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-neutral-800 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span>Facebook</span>
                  </a>

                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-neutral-800 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <span>Instagram</span>
                  </a>

                  <a
                    href="https://wa.me/8801711000000"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-neutral-800 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <span>WhatsApp</span>
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
                    Thank you for contacting ANIQ. Your inquiry has been submitted and will be reviewed by our team.
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
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        Phone (Optional)
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+880 1..."
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
