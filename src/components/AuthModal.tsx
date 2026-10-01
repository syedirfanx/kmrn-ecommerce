import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, AlertCircle, Check } from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        setSuccessMessage('Signed in successfully');
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        if (password.length < 6) {
          setErrorMessage('Password must be at least 6 characters');
          setIsLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        if (name.trim() && userCredential.user) {
          await updateProfile(userCredential.user, {
            displayName: name.trim()
          });
        }

        setSuccessMessage('Account created successfully');
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found'
      ) {
        setErrorMessage('Invalid email or password');
      } else if (error.code === 'auth/email-already-in-use') {
        setErrorMessage('This email is already registered');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMessage('Please enter a valid email address');
      } else if (error.code === 'auth/weak-password') {
        setErrorMessage('Password should be at least 6 characters');
      } else if (error.code === 'auth/operation-not-allowed') {
        setErrorMessage('Email and Password authentication is not enabled in Firebase Console yet. Please enable it under Authentication > Sign-in method.');
      } else {
        setErrorMessage(error.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setErrorMessage('');
    setSuccessMessage('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl border border-neutral-200 z-10 p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-200">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
              <UserIcon className="h-5 w-5" />
            </div>
            <h2 className="font-heading font-extrabold text-xl text-neutral-900">
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-semibold text-neutral-800 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-xl pl-10 pr-3.5 py-2.5 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 shadow-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-xl pl-10 pr-3.5 py-2.5 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-xl pl-10 pr-3.5 py-2.5 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 shadow-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-600 text-white font-bold text-base py-3 px-4 rounded-xl transition-all shadow-md cursor-pointer mt-2"
          >
            {isLoading
              ? 'Please wait...'
              : mode === 'signin'
              ? 'Sign In'
              : 'Create Account'}
          </button>
        </form>

        {/* Toggle between sign in and sign up */}
        <div className="mt-5 pt-4 border-t border-neutral-200 text-center text-sm text-neutral-600">
          {mode === 'signin' ? (
            <p>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="font-bold text-neutral-900 hover:underline cursor-pointer"
              >
                Create Account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="font-bold text-neutral-900 hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
