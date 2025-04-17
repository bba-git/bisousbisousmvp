'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { exchangeCodeForTokens } from '@/lib/google-auth-server';

export default function GoogleCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        console.error('Google OAuth error:', error);
        router.push('/auth/login?error=google_auth_failed');
        return;
      }

      if (!code) {
        console.error('No code received from Google');
        router.push('/auth/login?error=no_code');
        return;
      }

      try {
        const tokens = await exchangeCodeForTokens(code);
        // Store tokens in localStorage or your preferred storage
        if (tokens.access_token) {
          localStorage.setItem('google_access_token', tokens.access_token);
        }
        if (tokens.refresh_token) {
          localStorage.setItem('google_refresh_token', tokens.refresh_token);
        }
        if (tokens.expiry_date) {
          localStorage.setItem('google_token_expiry', tokens.expiry_date.toString());
        }

        // Redirect to dashboard or calendar page
        router.push('/dashboard');
      } catch (err) {
        console.error('Error exchanging code for tokens:', err);
        router.push('/auth/login?error=token_exchange_failed');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Connexion en cours...
        </h1>
        <p className="text-gray-600">
          Veuillez patienter pendant que nous finalisons votre connexion.
        </p>
      </div>
    </div>
  );
} 