'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GoogleOAuthButton from '@/components/GoogleOAuthButton';

export default function TestOAuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Test OAuth Page</h1>
        <div className="space-y-4">
          <GoogleOAuthButton />
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 