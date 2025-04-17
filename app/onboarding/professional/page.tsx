'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ProfessionalOnboarding() {
  const [siret, setSiret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sireneData, setSireneData] = useState<any>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSiretSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/sirene?siret=${siret}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch SIRENE data');
      }

      setSireneData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Create professional profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          is_professional: true,
          first_name: user.user_metadata.first_name || '',
          last_name: user.user_metadata.last_name || '',
          email: user.email,
          company_name: sireneData.company_name,
          siret: sireneData.siret,
          siren: sireneData.siren,
          ape_code: sireneData.ape_code,
          ape_label: sireneData.ape_label
        });

      if (profileError) throw profileError;

      // Create professional address
      const { error: addressError } = await supabase
        .from('professional_addresses')
        .insert({
          professional_id: user.id,
          is_main: true,
          street_address: sireneData.address.street,
          city: sireneData.address.city,
          postal_code: sireneData.address.postal_code,
          country: sireneData.address.country
        });

      if (addressError) throw addressError;

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Professional Onboarding
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Let's set up your professional profile
          </p>
        </div>

        {!sireneData ? (
          <form onSubmit={handleSiretSubmit} className="mt-8 space-y-6">
            <div>
              <label htmlFor="siret" className="block text-sm font-medium text-gray-700">
                SIRET Number
              </label>
              <div className="mt-1">
                <input
                  id="siret"
                  name="siret"
                  type="text"
                  required
                  value={siret}
                  onChange={(e) => setSiret(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Enter your SIRET number"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                {isLoading ? 'Loading...' : 'Verify SIRET'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleProfileSubmit} className="mt-8 space-y-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Company Information
                </h3>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Company Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{sireneData.company_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">SIRET</dt>
                    <dd className="mt-1 text-sm text-gray-900">{sireneData.siret}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">SIREN</dt>
                    <dd className="mt-1 text-sm text-gray-900">{sireneData.siren}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">APE Code</dt>
                    <dd className="mt-1 text-sm text-gray-900">{sireneData.ape_code}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Activity</dt>
                    <dd className="mt-1 text-sm text-gray-900">{sireneData.ape_label}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {sireneData.address.street}<br />
                      {sireneData.address.postal_code} {sireneData.address.city}<br />
                      {sireneData.address.country}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                {isLoading ? 'Creating Profile...' : 'Create Professional Profile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 