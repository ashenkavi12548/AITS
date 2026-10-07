'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { authService } from '@/services/auth.service';
import AitsLogo from '@/components/common/AitsLogo';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'idle'>(
    token ? 'verifying' : 'idle',
  );
  const [message, setMessage] = useState<string>('');
  const [resendEmail, setResendEmail] = useState(emailParam || '');
  const [manualToken, setManualToken] = useState(token || '');
  const [resendLoading, setResendLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const verifyWithToken = async (tok: string) => {
    if (!tok || !tok.trim()) return;
    setStatus('verifying');
    setVerifyLoading(true);
    try {
      const res = await authService.verifyEmail(tok.trim());
      setStatus('success');
      setMessage(
        res.message ||
          'Your email address has been verified successfully. You can now access your farm workspace.',
      );
    } catch (err: unknown) {
      setStatus('error');
      const axiosErr = err as { response?: { data?: { message?: string | string[] } } };
      const errorMsg =
        axiosErr.response?.data?.message ||
        (err instanceof Error
          ? err.message
          : 'Verification token is invalid or has expired.');
      setMessage(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
    } finally {
      setVerifyLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    let ignore = false;
    const performVerify = async () => {
      try {
        const res = await authService.verifyEmail(token.trim());
        if (!ignore) {
          setStatus('success');
          setMessage(
            res.message ||
              'Your email address has been verified successfully. You can now access your farm workspace.',
          );
        }
      } catch (err: unknown) {
        if (!ignore) {
          setStatus('error');
          const axiosErr = err as { response?: { data?: { message?: string | string[] } } };
          const errorMsg =
            axiosErr.response?.data?.message ||
            (err instanceof Error
              ? err.message
              : 'Verification token is invalid or has expired.');
          setMessage(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
        }
      } finally {
        if (!ignore) {
          setVerifyLoading(false);
        }
      }
    };

    performVerify();

    return () => {
      ignore = true;
    };
  }, [token]);

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    await verifyWithToken(manualToken.trim());
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    setResendLoading(true);
    setResendMessage(null);

    try {
      const res = await authService.resendVerification(resendEmail);
      setResendMessage(
        res.message || 'A new verification link has been dispatched to your email.',
      );
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string | string[] } } };
      const errTxt =
        axiosErr.response?.data?.message ||
        (err instanceof Error
          ? err.message
          : 'Failed to resend verification email.');
      setResendMessage(Array.isArray(errTxt) ? errTxt.join(', ') : errTxt);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="bg-white/92 dark:bg-[#1a1a1a]/92 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl p-6 sm:p-8 relative overflow-hidden">
      {/* Glow ambient */}
      <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-[#10a37f]/15 blur-3xl pointer-events-none" />

      {status === 'verifying' && (
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#10a37f]/10 text-[#10a37f] mb-4 border border-[#10a37f]/20 animate-pulse">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <h1 className="text-xl font-bold text-[#0d0d0d] dark:text-white">
            Verifying Your Account
          </h1>
          <p className="text-xs text-[#737373] dark:text-[#a0a0a0] mt-1.5">
            Validating security token with the AITS National Registry...
          </p>
        </div>
      )}

      {status === 'success' && (
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#10a37f]/10 text-[#10a37f] mb-4 border border-[#10a37f]/20 shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-[#10a37f]" />
          </div>
          <h1 className="text-2xl font-bold text-[#0d0d0d] dark:text-white">
            Email Verified!
          </h1>
          <p className="text-xs text-[#737373] dark:text-[#a0a0a0] mt-2 mb-6">
            {message}
          </p>
          <Link
            href="/login"
            className="w-full py-3 px-4 rounded-xl bg-linear-to-r from-[#10a37f] to-[#0e8c6d] hover:from-[#0e8c6d] hover:to-[#0c7a5f] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#10a37f]/30 transition-all"
          >
            <span>Sign In to Your Farm</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {(status === 'error' || status === 'idle') && (
        <div>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-3 border border-amber-500/20">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-[#0d0d0d] dark:text-white">
              {status === 'error' ? 'Verification Link Expired' : 'Account Email Verification'}
            </h1>
            <p className="text-xs text-[#737373] dark:text-[#a0a0a0] mt-1.5">
              {message ||
                'Enter your registered email address to receive a fresh verification link, or paste your verification code below.'}
            </p>
          </div>

          {resendMessage && (
            <div className="mb-4 p-3 rounded-xl bg-[#10a37f]/10 border border-[#10a37f]/25 text-[#10a37f] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{resendMessage}</span>
            </div>
          )}

          {/* Resend verification email form */}
          <form onSubmit={handleResend} className="space-y-3.5 mb-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a0a0a0] mb-1.5">
                Request New Verification Link
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#8e8e8e]" />
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="farmer@livestock.lk"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white/70 dark:bg-[#111111]/70 border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-sm focus:outline-none focus:border-[#10a37f] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={resendLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-linear-to-r from-[#10a37f] to-[#0e8c6d] hover:from-[#0e8c6d] hover:to-[#0c7a5f] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#10a37f]/30 transition-all cursor-pointer disabled:opacity-60"
            >
              {resendLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Link...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Resend Verification Email</span>
                </>
              )}
            </button>
          </form>

          {/* Manual Token Verification */}
          <div className="pt-4 border-t border-[#e5e5e5] dark:border-[#383838]">
            <form onSubmit={handleManualVerify} className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a0a0a0]">
                Or Enter Verification Token Directly
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Paste token from email..."
                  className="flex-1 px-3 py-2 bg-white/70 dark:bg-[#111111]/70 border border-[#e5e5e5] dark:border-[#383838] rounded-xl text-xs focus:outline-none focus:border-[#10a37f] transition-all font-mono"
                />
                <button
                  type="submit"
                  disabled={verifyLoading || !manualToken.trim()}
                  className="px-3.5 py-2 rounded-xl bg-[#262626] hover:bg-black text-white text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {verifyLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Verify</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-5 text-center">
            <Link
              href="/login"
              className="text-xs text-[#737373] dark:text-[#a0a0a0] hover:text-[#10a37f] transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen w-full flex flex-col justify-between relative text-[#0d0d0d] dark:text-[#ececec] overflow-hidden">
      {/* Immersive Realistic Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105 pointer-events-none"
        style={{
          backgroundImage: `url('/images/farm-register-bg.jpg')`,
        }}
      />

      {/* Modern Gradient & Blur Overlays */}
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/45 to-black/60 dark:from-black/90 dark:via-black/60 dark:to-black/75 backdrop-blur-[2px] pointer-events-none" />

      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-white/15 dark:border-white/10 bg-black/30 backdrop-blur-md relative z-20">
        <Link href="/" className="inline-flex items-center">
          <AitsLogo
            size="sm"
            showText
            badge="Official Verification"
            subtitle="National Registry"
          />
        </Link>

        <Link
          href="/login"
          className="text-xs font-medium text-white bg-white/15 hover:bg-white/25 border border-white/20 px-3.5 py-1.5 rounded-xl backdrop-blur-sm"
        >
          Sign In
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="w-full max-w-md">
          <Suspense
            fallback={
              <div className="bg-white/90 dark:bg-[#262626]/90 backdrop-blur-xl rounded-2xl border border-white/20 p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#10a37f]" />
              </div>
            }
          >
            <VerifyEmailContent />
          </Suspense>
        </div>
      </main>

      <footer className="w-full py-4 text-center text-xs text-white/70 border-t border-white/10 bg-black/40 backdrop-blur-md relative z-20">
        AITS Livestock Traceability & Cloud Platform &copy; {new Date().getFullYear()} Ceylon Nest. All rights reserved.
      </footer>
    </div>
  );
}
