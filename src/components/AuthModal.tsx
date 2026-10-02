import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, AlertCircle, Check, ExternalLink } from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { saveUserProfileToDb } from '../services/storeService';

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
  const [helpUrl, setHelpUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleAuthError = (err: unknown) => {
    const error = err as { code?: string; message?: string };
    const errStr = `${error.message || ''} ${error.code || ''}`.toLowerCase();

    if (
      errStr.includes('identity-toolkit') ||
      errStr.includes('identitytoolkit.googleapis.com') ||
      errStr.includes('api-has-not-been-used')
    ) {
      setErrorMessage(
        'Identity Toolkit API is not yet enabled for project kamran-ecommerce. Please enable it in Google Cloud Console or Firebase Console to use account authentication.'
      );
      setHelpUrl('https://console.developers.google.com/apis/api/identitytoolkit.googleapis.com/overview?project=913533657733');
    } else if (error.code === 'auth/operation-not-allowed') {
      setErrorMessage(
        'Email/Password sign-in method is not enabled. Please enable it in Firebase Console under Authentication > Sign-in method.'
      );
      setHelpUrl('https://console.firebase.google.com/project/kamran-ecommerce/authentication/providers');
    } else if (
      error.code === 'auth/invalid-credential' ||
      error.code === 'auth/wrong-password' ||
      error.code === 'auth/user-not-found'
    ) {
      setErrorMessage('Invalid email or password');
    } else if (error.code === 'auth/email-already-in-use') {
      setErrorMessage('An account with this email already exists');
    } else if (error.code === 'auth/weak-password') {
      setErrorMessage('Password must be at least 6 characters');
    } else if (error.code === 'auth/popup-closed-by-user') {
      setErrorMessage('Sign-in popup was closed before completing');
    } else {
      setErrorMessage(error.message || 'Authentication failed. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setHelpUrl('');
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

        setSuccessMessage('Account created successfully');
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

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setHelpUrl('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await saveUserProfileToDb(result.user.uid, {
          displayName: result.user.displayName || result.user.email?.split('@')[0] || 'User',
          email: result.user.email || ''
        });
      }
      setSuccessMessage('Signed in successfully with Google');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: unknown) {
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setErrorMessage('');
    setHelpUrl('');
    setSuccessMessage('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl z-10 p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
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
            className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-full hover:bg-neutral-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback message */}
        {errorMessage && (
          <div className="mb-4 p-3.5 bg-red-50 rounded-xl text-red-800 text-xs font-semibold space-y-2 border border-red-200/80">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
            {helpUrl && (
              <a
                href={helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-red-900 underline hover:text-red-700 pt-1"
              >
                <span>Enable Identity Toolkit in Google Cloud Console</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 bg-emerald-50 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Google Sign In Option */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full bg-white hover:bg-stone-50 border border-stone-300 text-neutral-800 font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer mb-4"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-stone-200" />
          <span className="shrink-0 px-3 text-[11px] font-bold text-stone-400 uppercase text-center">
            Or with email
          </span>
          <div className="flex-1 border-t border-stone-200" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl pl-10 pr-3.5 py-2 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl pl-10 pr-3.5 py-2 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl pl-10 pr-3.5 py-2 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-500 text-white font-bold text-sm py-2.5 px-4 rounded-xl transition-all shadow-md cursor-pointer mt-1"
          >
            {isLoading
              ? 'Processing...'
              : mode === 'signin'
              ? 'Sign In with Email'
              : 'Create Account with Email'}
          </button>
        </form>

        {/* Mode Switcher */}
        <div className="mt-5 pt-3 border-t border-stone-100 text-center">
          {mode === 'signin' ? (
            <p className="text-xs text-neutral-600">
              Do not have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="font-bold text-neutral-900 hover:underline cursor-pointer"
              >
                Create Account
              </button>
            </p>
          ) : (
            <p className="text-xs text-neutral-600">
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
