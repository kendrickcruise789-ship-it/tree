import React, { useEffect, useState } from 'react';
import { UserAccount } from '../types';
import { X, Lock, Mail, User, Phone, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useOverlayBehavior } from '../utils/useOverlayBehavior';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount, rememberDevice: boolean) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [newsletter, setNewsletter] = useState(true);

  // Status & feedback
  const [feedback, setFeedback] = useState<string>('');
  const [feedbackIsError, setFeedbackIsError] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showError = (msg: string) => {
    setFeedback(msg);
    setFeedbackIsError(true);
  };

  const showNotice = (msg: string) => {
    setFeedback(msg);
    setFeedbackIsError(false);
  };

  const clearFeedback = () => {
    setFeedback('');
    setFeedbackIsError(false);
  };

  const switchMode = (next: 'signin' | 'signup' | 'forgot') => {
    setMode(next);
    clearFeedback();
  };

  useOverlayBehavior(isOpen, onClose);

  // The modal stays mounted while closed, so a reopened dialog would otherwise
  // show the previous session's half-typed credentials and stale messages.
  useEffect(() => {
    if (isOpen) return;
    setMode('signin');
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    clearFeedback();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showError('Please enter both email and password.');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const user: UserAccount = {
        id: 'usr-' + Math.floor(1000 + Math.random() * 9000),
        fullName: fullName || email.split('@')[0].replace('.', ' ').replace(/^./, (c) => c.toUpperCase()),
        email: email,
        phone: phone || '+1 (555) 382-9104',
        addresses: [
          {
            fullName: fullName || 'Tara Sharma',
            email: email,
            phone: phone || '+1 (555) 382-9104',
            street: '425 Artisanal Way, Apt 3B',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94107',
            country: 'United States',
          },
        ],
      };
      onLoginSuccess(user, rememberMe);
      onClose();
    }, 600);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      showError('Please fill out all required fields.');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const user: UserAccount = {
        id: 'usr-' + Math.floor(1000 + Math.random() * 9000),
        fullName,
        email,
        phone,
      };
      onLoginSuccess(user, rememberMe);
      onClose();
    }, 600);
  };

  const handleDemoLogin = (name: string, demoEmail: string) => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const user: UserAccount = {
        id: 'usr-demo-1',
        fullName: name,
        email: demoEmail,
        phone: '+1 (555) 382-9104',
        addresses: [
          {
            fullName: name,
            email: demoEmail,
            phone: '+1 (555) 382-9104',
            street: '425 Artisanal Way, Suite 4A',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94107',
            country: 'United States',
          },
        ],
      };
      onLoginSuccess(user, rememberMe);
      onClose();
    }, 400);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showError('Please enter your registered email address.');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      showNotice('Demo only — this prototype does not send emails.');
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in or create account"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md bg-[#FDFBF7] border border-[#EDE6DC] shadow-2xl p-6 sm:p-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#7A6B5D] hover:text-[#1E1B18] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1 pb-4 border-b border-[#EDE6DC]">
          <span className="font-serif text-2xl tracking-[0.25em] font-medium text-[#1E1B18] uppercase block">
            CLOTEX
          </span>
          <p className="text-xs uppercase tracking-wider text-[#7A6B5D]">
            {mode === 'signin' && 'Welcome Back to Slow Living'}
            {mode === 'signup' && 'Create Your Artisanal Account'}
            {mode === 'forgot' && 'Reset Account Password'}
          </p>
        </div>

        {/* Tab Switcher for Sign In / Sign Up */}
        {mode !== 'forgot' && (
          <div className="flex border-b border-[#EDE6DC] my-4 text-xs font-medium">
            <button
              onClick={() => {
                switchMode('signin');
              }}
              className={`flex-1 py-2 text-center uppercase tracking-wider transition-all border-b-2 ${
                mode === 'signin'
                  ? 'border-[#1E1B18] text-[#1E1B18] font-semibold'
                  : 'border-transparent text-[#7A6B5D] hover:text-[#1E1B18]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                switchMode('signup');
              }}
              className={`flex-1 py-2 text-center uppercase tracking-wider transition-all border-b-2 ${
                mode === 'signup'
                  ? 'border-[#1E1B18] text-[#1E1B18] font-semibold'
                  : 'border-transparent text-[#7A6B5D] hover:text-[#1E1B18]'
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* Feedback message */}
        {feedback && (
          <div
            role={feedbackIsError ? 'alert' : 'status'}
            className={`mb-4 p-3 border text-xs flex items-center gap-2 ${
              feedbackIsError
                ? 'bg-[#FBF3F0] border-[#E4C9BF] text-[#7A3527]'
                : 'bg-[#FAF7F2] border-[#E8DDD1] text-[#1E1B18]'
            }`}
          >
            {feedbackIsError ? (
              <AlertCircle className="w-4 h-4 text-[#A8523C] shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#2F6F4E] shrink-0" />
            )}
            <span>{feedback}</span>
          </div>
        )}

        {/* Quick Demo 1-Click Login Helper */}
        {mode === 'signin' && (
          <div className="mb-4 p-3 bg-[#FAF7F2] border border-[#EDE6DC] space-y-2">
            <div className="flex items-center justify-between text-[11px] text-[#7A6B5D]">
              <span className="flex items-center gap-1 font-medium text-[#1E1B18]">
                <Sparkles className="w-3 h-3 text-[#C6934B]" />
                1-Click Quick Demo Sign In
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('Tara Sharma', 'tara.sharma@example.com')}
                className="flex-1 py-1.5 px-2 bg-white border border-[#D5C9B9] text-[11px] text-[#1E1B18] hover:bg-[#1E1B18] hover:text-white transition-colors"
              >
                Tara Sharma
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('Meera Patel', 'meera.patel@example.com')}
                className="flex-1 py-1.5 px-2 bg-white border border-[#D5C9B9] text-[11px] text-[#1E1B18] hover:bg-[#1E1B18] hover:text-white transition-colors"
              >
                Meera Patel
              </button>
            </div>
          </div>
        )}

        {/* SIGN IN FORM */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#5C5349] font-medium mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 pl-9 text-xs border border-[#D5C9B9] bg-white focus:outline-none focus:border-[#1E1B18]"
                />
                <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-[#A89C8F]" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] uppercase tracking-wider text-[#5C5349] font-medium">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-[11px] text-[#7A6B5D] hover:text-[#1E1B18] underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 pl-9 text-xs border border-[#D5C9B9] bg-white focus:outline-none focus:border-[#1E1B18]"
                />
                <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-[#A89C8F]" />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#5C5349]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-[#1E1B18] focus:ring-0"
                />
                <span>Remember this device</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#1E1B18] text-[#FDFBF7] text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#342F2A] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* SIGN UP FORM */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#5C5349] font-medium mb-1">
                Full Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Tara Sharma"
                  className="w-full px-3 py-2 pl-9 text-xs border border-[#D5C9B9] bg-white focus:outline-none focus:border-[#1E1B18]"
                />
                <User className="w-3.5 h-3.5 absolute left-3 top-3 text-[#A89C8F]" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#5C5349] font-medium mb-1">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 pl-9 text-xs border border-[#D5C9B9] bg-white focus:outline-none focus:border-[#1E1B18]"
                />
                <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-[#A89C8F]" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#5C5349] font-medium mb-1">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 pl-9 text-xs border border-[#D5C9B9] bg-white focus:outline-none focus:border-[#1E1B18]"
                />
                <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-[#A89C8F]" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#5C5349] font-medium mb-1">
                Create Password *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 pl-9 text-xs border border-[#D5C9B9] bg-white focus:outline-none focus:border-[#1E1B18]"
                />
                <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-[#A89C8F]" />
              </div>
            </div>

            <label className="flex items-start gap-2 text-xs text-[#5C5349] cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={newsletter}
                onChange={(e) => setNewsletter(e.target.checked)}
                className="rounded mt-0.5 text-[#1E1B18] focus:ring-0"
              />
              <span>Subscribe to Clotex Artisanal Newsletter (Receive 10% coupon code via email)</span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#1E1B18] text-[#FDFBF7] text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#342F2A] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
            >
              <span>{isSubmitting ? 'Creating Account...' : 'Create Account'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-xs text-[#5C5349] leading-relaxed">
              Enter your email address and we will send you secure instructions to reset your password.
            </p>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#5C5349] font-medium mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 pl-9 text-xs border border-[#D5C9B9] bg-white focus:outline-none focus:border-[#1E1B18]"
                />
                <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-[#A89C8F]" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#1E1B18] text-[#FDFBF7] text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#342F2A] transition-all"
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  switchMode('signin');
                }}
                className="text-xs text-[#7A6B5D] hover:text-[#1E1B18] underline"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-[#EDE6DC] text-center text-[11px] text-[#7A6B5D] flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2F6F4E]" />
          <span>Demo sign-in &mdash; this account lives in your browser only</span>
        </div>

      </div>
    </div>
  );
};
