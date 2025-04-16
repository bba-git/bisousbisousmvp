'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  user_type: 'client' | 'professionnel';
  profession?: string;
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          setError('Erreur lors du chargement du profil');
          setLoading(false);
          return;
        }

        setProfile(profileData);
      } catch (error) {
        console.error('Error:', error);
        setError('Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Profil non trouvé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Bienvenue, {profile.first_name} {profile.last_name}
            </h1>
          </div>
          <p className="mt-2 text-gray-600">
            {profile.user_type === 'professionnel' 
              ? `Vous êtes connecté en tant que ${profile.profession || 'professionnel'}`
              : 'Vous êtes connecté en tant que client'}
          </p>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {profile.user_type === 'client' && (
              <>
                <Link
                  href="/dashboard/service-request"
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900">
                      Demander un service
                    </h3>
                    <p className="mt-2 text-gray-600">
                      Créez une nouvelle demande de service
                    </p>
                  </div>
                </Link>

                <Link
                  href="/dashboard/service-search"
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900">
                      Rechercher un service
                    </h3>
                    <p className="mt-2 text-gray-600">
                      Trouvez et réservez un service
                    </p>
                  </div>
                </Link>

                <Link
                  href="/dashboard/historique"
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900">
                      Historique
                    </h3>
                    <p className="mt-2 text-gray-600">
                      Consultez vos demandes précédentes
                    </p>
                  </div>
                </Link>
              </>
            )}
            {profile.user_type === 'professionnel' ? (
              <Link
                href="/dashboard/professional"
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300"
              >
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900">Gérer mes services</h3>
                  <p className="mt-2 text-gray-600">
                    Gérez vos services et disponibilités
                  </p>
                </div>
              </Link>
            ) : (
              <Link
                href="/dashboard/professional-search"
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
              >
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Rechercher un professionnel</p>
                  <p className="text-sm text-gray-500">Trouver un professionnel par localisation et spécialité</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 