'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface ProfessionalProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  profession: string;
  specialties: string[];
  description: string;
  phone: string;
  availability: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  working_hours: {
    start: string;
    end: string;
  };
  addresses?: {
    id: string;
    street_address: string;
    city: string;
    postal_code: string;
    country: string;
    is_primary: boolean;
  }[];
}

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
}

export default function ProfessionalLandingPage({ 
  params 
}: { 
  params: { 
    profession: string; 
    localisations: string;
    id: string;
  } 
}) {
  const [professional, setProfessional] = useState<ProfessionalProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchProfessional = async () => {
      try {
        setLoading(true);
        console.log('Fetching professional with ID:', params.id);
        console.log('Expected profession:', params.profession);
        
        const { data: professionalData, error: professionalError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', params.id)
          .single();

        if (professionalError) {
          console.error('Error fetching professional:', professionalError);
          throw professionalError;
        }

        console.log('Fetched professional data:', professionalData);

        if (!professionalData) {
          console.error('No professional found with ID:', params.id);
          setError('Professionnel non trouvé');
          return;
        }

        // Verify that the professional matches the URL parameters
        if (professionalData.profession.toLowerCase() !== params.profession.toLowerCase()) {
          console.error('Profession mismatch:', {
            expected: params.profession,
            actual: professionalData.profession
          });
          setError('Professionnel non trouvé');
          return;
        }

        // Fetch addresses separately
        let addressesData: { city: string }[] = [];
        try {
          const { data, error } = await supabase
            .from('professional_adresses')
            .select('*')
            .eq('professional_id', params.id);

          if (error) {
            console.error('Error fetching addresses:', error);
          } else {
            addressesData = data || [];
            console.log('Fetched addresses:', addressesData);
          }
        } catch (err) {
          console.error('Error fetching addresses:', err);
        }

        // Ensure availability and working_hours exist
        const professionalWithDefaults = {
          ...professionalData,
          addresses: addressesData,
          availability: professionalData.availability || {
            monday: false,
            tuesday: false,
            wednesday: false,
            thursday: false,
            friday: false,
            saturday: false,
            sunday: false,
          },
          working_hours: professionalData.working_hours || {
            start: '09:00',
            end: '17:00',
          },
        };

        console.log('Professional with defaults:', professionalWithDefaults);
        setProfessional(professionalWithDefaults);

        // Fetch professional's services
        try {
          const { data: servicesData, error: servicesError } = await supabase
            .from('services')
            .select('*')
            .eq('professional_id', params.id);

          if (servicesError) {
            console.error('Error fetching services:', servicesError);
            // If the services table doesn't exist, just set an empty array
            setServices([]);
          } else {
            console.log('Fetched services:', servicesData);
            setServices(servicesData || []);
          }
        } catch (servicesErr) {
          console.error('Error fetching services:', servicesErr);
          // If there's any error with services, just set an empty array
          setServices([]);
        }
      } catch (err) {
        console.error('Error in fetchProfessional:', err);
        setError('Une erreur est survenue lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    };

    fetchProfessional();
  }, [params.id, params.profession]);

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

  if (error || !professional) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{error || 'Professionnel non trouvé'}</p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {professional.first_name} {professional.last_name}
                </h1>
                <p className="mt-1 text-lg text-gray-500">{professional.profession}</p>
                {professional.addresses && professional.addresses.length > 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    {professional.addresses[0].city}
                  </p>
                )}
              </div>
              <Link
                href="/auth/login?redirect=/dashboard/service-request"
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark"
              >
                Prendre rendez-vous
              </Link>
            </div>

            {professional.description && (
              <div className="mt-6">
                <h2 className="text-lg font-medium text-gray-900">À propos</h2>
                <p className="mt-2 text-gray-600">{professional.description}</p>
              </div>
            )}

            {professional.specialties && professional.specialties.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-medium text-gray-900">Spécialités</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {professional.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {services.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-medium text-gray-900">Services proposés</h2>
                <div className="mt-4 space-y-4">
                  {services.map((service) => (
                    <div key={service.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{service.title}</h3>
                          <p className="mt-1 text-gray-600">{service.description}</p>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <span className="font-medium">{service.price.toFixed(2)}€</span>
                            <span className="mx-2">•</span>
                            <span>{service.duration}</span>
                          </div>
                        </div>
                        <Link
                          href={`/auth/login?redirect=/dashboard/service-request?service_id=${service.id}&professional_id=${professional.id}`}
                          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark"
                        >
                          Réserver
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <h2 className="text-lg font-medium text-gray-900">Disponibilités</h2>
              <div className="mt-2 grid grid-cols-7 gap-2">
                {Object.entries(professional.availability).map(([day, available]) => (
                  <div
                    key={day}
                    className={`text-center p-2 rounded ${
                      available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <div className="text-xs font-medium">
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </div>
                    <div className="text-xs">
                      {available
                        ? `${professional.working_hours.start} - ${professional.working_hours.end}`
                        : 'Fermé'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 