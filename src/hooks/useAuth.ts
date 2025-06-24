import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types/user';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthHook extends AuthState {
  signup: (step: 1 | 2, data: any) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string, passwordConfirmation: string) => Promise<void>;
}

export function useAuth(): AuthHook {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });
  const router = useRouter();

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('🔍 Fetching user profile...');
        const response = await fetch('/api/user/profile', {
          credentials: 'include',
        });

        console.log('📡 Profile response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ User profile loaded:', data.profile?.firstName || 'No name');
          setState(prev => ({ ...prev, user: data.profile, loading: false }));
        } else {
          console.log('❌ Profile fetch failed:', response.status);
          setState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.log('💥 Profile fetch error:', error);
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    fetchUser();
  }, []);

  const signup = useCallback(async (step: 1 | 2, data: any) => {
    try {
      let body: any = { step, data };
      if (step === 2 && data.userId) {
        body.userId = data.userId;
      }
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sign up');
      }

      const result = await response.json();
      // For step 1, the server sets the auth cookie automatically
      // For step 2, we'll reload the page to get the updated user state
    } catch (error) {
      setState(prev => ({ ...prev, error: (error as Error).message }));
      throw error;
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to login');
        }

        const { user } = await response.json();
        console.log('✅ Login successful, user:', user?.firstName || 'No name');
        setState(prev => ({ ...prev, user, error: null }));
        // Force a page reload to ensure the auth cookie is properly set
        console.log('🔄 Redirecting to home page...');
        window.location.href = '/';
      } catch (error) {
        setState(prev => ({ ...prev, error: (error as Error).message }));
        throw error;
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      setState({ user: null, loading: false, error: null });
      router.push('/');
    } catch (error) {
      setState(prev => ({ ...prev, error: (error as Error).message }));
      throw error;
    }
  }, [router]);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...data } : null,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({ ...prev, error: (error as Error).message }));
      throw error;
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to request password reset');
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: (error as Error).message }));
      throw error;
    }
  }, []);

  const resetPassword = useCallback(
    async (token: string, password: string, passwordConfirmation: string) => {
      try {
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password, passwordConfirmation }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to reset password');
        }
      } catch (error) {
        setState(prev => ({ ...prev, error: (error as Error).message }));
        throw error;
      }
    },
    []
  );

  return {
    ...state,
    signup,
    login,
    logout,
    updateProfile,
    requestPasswordReset,
    resetPassword,
  };
}
