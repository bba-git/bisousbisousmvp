'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Professional {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_type: 'professionnel';
  specialties: string[];
  location: string;
  description?: string;
  rating?: number;
}

interface ProfessionalResult {
  id: string;
  first_name: string;
  last_name: string;
  profession: string;
  description: string;
  phone: string;
}

export default function ProfessionalSearch() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchSpecialty, setSearchSpecialty] = useState('');
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          router.push('/auth/login');
          return;
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();

        if (profileData?.user_type !== 'client') {
          router.push('/dashboard');
          return;
        }

        fetchProfessionals();
      } catch (err) {
        console.error('Error:', err);
        setError('Une erreur est survenue');
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  const fetchProfessionals = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'professionnel');

      if (searchLocation) {
        query = query.ilike('location', `%${searchLocation}%`);
      }

      if (searchSpecialty) {
        query = query.contains('specialties', [searchSpecialty]);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setProfessionals(data || []);
      
      // Extract unique specialties from all professionals
      const specialties = new Set<string>();
      data?.forEach(prof => {
        prof.specialties?.forEach((spec: string) => specialties.add(spec));
      });
      setAvailableSpecialties(Array.from(specialties));
    } catch (err: any) {
      console.error('Error fetching professionals:', err);
      setError('Erreur lors du chargement des professionnels');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProfessionals();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
              Rechercher un professionnel
            </h3>

            <form onSubmit={handleSearch} className="space-y-4 mb-8">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Localisation
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="Entrez une ville ou un code postal"
                  />
                </div>
                <div>
                  <label htmlFor="specialty" className="block text-sm font-medium text-gray-700">
                    Spécialité
                  </label>
                  <select
                    id="specialty"
                    value={searchSpecialty}
                    onChange={(e) => setSearchSpecialty(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    <option value="">Toutes les spécialités</option>
                    {availableSpecialties.map((specialty) => (
                      <option key={specialty} value={specialty}>
                        {specialty}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Rechercher
              </button>
            </form>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement des professionnels...</p>
              </div>
            ) : professionals.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Aucun professionnel trouvé</p>
              </div>
            ) : (
              <div className="space-y-4">
                {professionals.map((professional) => (
                  <div
                    key={professional.id}
                    className="bg-white rounded-lg shadow-md p-4 mb-4"
                  >
                    <h3 className="text-lg font-semibold">{professional.first_name} {professional.last_name}</h3>
                    <p className="text-gray-600">{professional.location}</p>
                    {professional.description && (
                      <p className="mt-2 text-sm text-gray-600">
                        {professional.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 