import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User as UserIcon, AlertCircle, Check, KeyRound } from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { saveUserProfileToDb } from '../services/storeService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [tabIconError, setTabIconError] = useState(false);

  const tabIconUrl =
    (typeof document !== 'undefined' &&
      (document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.getAttribute('href') ||
        document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]')?.getAttribute('href'))) ||
    '/images/tab-logo.png';

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen]);

  const handleAuthError = (err: unknown) => {
    const error = err as { code?: string; message?: string };
    if (!error) return;

    if (
      error.code === 'auth/invalid-credential' ||
      error.code === 'auth/wrong-password' ||
      error.code === 'auth/user-not-found'
    ) {
      if (mode === 'forgot') {
        setErrorMessage('No account found with this email address.');
      } else {
        setErrorMessage('Invalid email address or password.');
      }
    } else if (error.code === 'auth/email-already-in-use') {
      setErrorMessage('An account with this email address already exists. Please sign in instead.');
    } else if (error.code === 'auth/weak-password') {
      setErrorMessage('Password must be at least 6 characters long.');
    } else if (error.code === 'auth/invalid-email') {
      setErrorMessage('Please enter a valid email address.');
    } else if (error.code === 'auth/missing-email') {
      setErrorMessage('Please enter your email address.');
    } else if (error.code === 'auth/too-many-requests') {
      setErrorMessage('Too many requests. Please wait a few moments and try again.');
    } else {
      setErrorMessage(error.message || 'Authentication failed. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (mode === 'forgot') {
        if (!email.trim()) {
          setErrorMessage('Please enter your email address.');
          setIsLoading(false);
          return;
        }

        await sendPasswordResetEmail(auth, email.trim());
        setSuccessMessage('Password reset link sent! Check your email inbox (and spam folder) for instructions to reset your password.');
      } else if (mode === 'signin') {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        if (userCredential.user) {
          await saveUserProfileToDb(userCredential.user.uid, {
            displayName: userCredential.user.displayName || email.split('@')[0],
            email: userCredential.user.email || email.trim()
          });
        }
        setSuccessMessage('Signed in successfully.');
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        if (password.length < 6) {
          setErrorMessage('Password must be at least 6 characters long.');
          setIsLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        if (userCredential.user) {
          if (name.trim()) {
            await updateProfile(userCredential.user, {
              displayName: name.trim()
            });
          }
          await saveUserProfileToDb(userCredential.user.uid, {
            displayName: name.trim() || email.split('@')[0],
            email: email.trim()
          });
        }

        setSuccessMessage('Account created successfully.');
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err: unknown) {
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: 'signin' | 'signup' | 'forgot') => {
    setMode(newMode);
    setErrorMessage('');
    setSuccessMessage('');
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl z-10 p-6 sm:p-8 border border-stone-200/80 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            {mode === 'forgot' ? (
              <div className="h-9 w-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
                <KeyRound className="h-5 w-5" />
              </div>
            ) : (
              <div className="h-9 w-9 rounded-xl bg-stone-100 border border-stone-200/80 flex items-center justify-center overflow-hidden p-1 shadow-xs">
                {!tabIconError ? (
                  <img
                    src={tabIconUrl}
                    alt="ANIQ"
                    onError={() => setTabIconError(true)}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <UserIcon className="h-5 w-5 text-neutral-700" />
                )}
              </div>
            )}
            <h2 className="font-heading text-xl text-neutral-900">
              {mode === 'signin'
                ? 'Sign In'
                : mode === 'signup'
                ? 'Create Account'
                : 'Reset Password'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {mode === 'forgot' && (
          <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
            Enter your registered email address and we will send you a secure link to reset your password.
          </p>
        )}

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="mb-4 p-3.5 bg-red-50 rounded-xl text-red-800 text-xs font-semibold space-y-1 border border-red-200/80">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 bg-emerald-50 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-category font-semibold text-neutral-800 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Fatima Khan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white shadow-2xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-category font-semibold text-neutral-800 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white shadow-2xs"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-category font-semibold text-neutral-800">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-xs text-neutral-600 hover:text-neutral-900 font-semibold hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white shadow-2xs"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-500 text-white font-category font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition-all shadow-md active:scale-98 cursor-pointer mt-2"
          >
            {isLoading
              ? 'Processing...'
              : mode === 'signin'
              ? 'Sign In'
              : mode === 'signup'
              ? 'Create Account'
              : 'Send Reset Link'}
          </button>
        </form>

        {/* Mode Switcher */}
        <div className="mt-5 pt-4 border-t border-stone-100 text-center font-category">
          {mode === 'signin' ? (
            <p className="text-xs text-neutral-600">
              Do not have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="font-bold text-neutral-900 hover:underline cursor-pointer ml-1"
              >
                Create Account
              </button>
            </p>
          ) : mode === 'signup' ? (
            <p className="text-xs text-neutral-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="font-bold text-neutral-900 hover:underline cursor-pointer ml-1"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p className="text-xs text-neutral-600">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="font-bold text-neutral-900 hover:underline cursor-pointer ml-1"
              >
                Back to Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
