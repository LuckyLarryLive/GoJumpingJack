'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '@/contexts/AuthContext';

function LoginPageInner() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const { login } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if user was redirected after successful email verification
    if (searchParams.get('verified') === 'true') {
      setSuccess('Your email has been verified! You can now log in.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setShowResendVerification(false);

    try {
      await login(email, password);
      // The login function will handle the redirect to home page
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to login';
      setError(errorMessage);

      // Check if the error is due to unverified email
      if (errorMessage.includes('email address is not verified')) {
        setShowResendVerification(true);
      }
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }

    setResendingVerification(true);
    setError('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSuccess('A new verification email has been sent to your email address.');
        setShowResendVerification(false);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to resend verification email.');
      }
    } catch (err) {
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-2 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-base sm:text-sm text-gray-600">
            Or{' '}
            <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-red-50 p-4 max-w-full break-words">
              <div className="text-base sm:text-sm text-red-700">{error}</div>
              {showResendVerification && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendingVerification}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendingVerification ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                </div>
              )}
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-green-50 p-4 max-w-full break-words">
              <div className="text-base sm:text-sm text-green-700">{success}</div>
            </div>
          )}
          <div className="rounded-lg shadow-sm space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-base sm:text-sm font-medium text-gray-700 mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-base sm:text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="text-base sm:text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base sm:text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-2"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageInner />
    </Suspense>
  );
}
