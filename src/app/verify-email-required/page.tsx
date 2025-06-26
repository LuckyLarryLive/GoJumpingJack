'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function VerifyEmailRequiredPage() {
  const { user, resendVerificationEmail } = useAuthContext();
  const [resendingVerification, setResendingVerification] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // If user is not logged in, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }

    // If user's email is already verified, redirect to home
    if (user.emailVerified) {
      router.push('/');
      return;
    }
  }, [user, router]);

  const handleResendVerification = async () => {
    if (!user?.email) return;

    setResendingVerification(true);
    setError('');
    setMessage('');

    try {
      await resendVerificationEmail(user.email);
      setMessage('Verification email sent! Please check your inbox and spam folder.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification email');
    } finally {
      setResendingVerification(false);
    }
  };

  // Don't render anything while checking user status
  if (!user || user.emailVerified) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-2 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
            <svg
              className="h-8 w-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-2xl sm:text-3xl font-extrabold text-gray-900">
            Email Verification Required
          </h2>
          <p className="mt-2 text-base sm:text-sm text-gray-600">
            Please verify your email address to continue using GoJumpingJack
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-base sm:text-sm text-yellow-800">
                We've sent a verification email to:
              </p>
              <p className="text-base sm:text-sm font-medium text-yellow-900 mt-1">
                {user.email}
              </p>
            </div>

            <div className="text-left space-y-3">
              <h3 className="text-base font-medium text-gray-900">
                What to do next:
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-base sm:text-sm text-gray-600">
                <li>Check your email inbox for a message from GoJumpingJack</li>
                <li>Click the "Verify Email Address" button in the email</li>
                <li>You'll be redirected back here and can continue using the site</li>
              </ol>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-3">
                Don't see the email? Check your spam folder or request a new one.
              </p>
              
              {message && (
                <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-base sm:text-sm text-green-700">{message}</p>
                </div>
              )}

              {error && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-base sm:text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                onClick={handleResendVerification}
                disabled={resendingVerification}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-base sm:text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendingVerification ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-700" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  'Resend Verification Email'
                )}
              </button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Need help? Contact our support team for assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
