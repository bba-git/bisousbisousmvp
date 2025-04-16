'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

interface ProfessionalProfile {
  id: string;
  first_name: string;
  last_name: string;
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

export default function BookingPage({ 
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
  const [selectedService, setSelectedService] = useState<string>('');
  const [motivation, setMotivation] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } catch (error) {
        console.error('Error checking auth status:', error);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

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
          const response = await fetch(`/api/professional/${params.id}/main-address`);
          if (!response.ok) {
            throw new Error('Failed to fetch main address');
          }
          const addressData = await response.json();
          if (addressData) {
            addressesData = [addressData];
            console.log('Fetched main address:', addressData);
          }
        } catch (err) {
          console.error('Error fetching main address:', err);
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
            .from('professional_services')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      if (!isAuthenticated) {
        setError('Vous devez être connecté pour prendre un rendez-vous. Connectez-vous');
        // Store the current URL and form data for redirect after login
        const currentUrl = window.location.pathname;
        const formData = {
          motivation,
          selectedDate,
          selectedTime,
          selectedService
        };
        const encodedFormData = encodeURIComponent(JSON.stringify(formData));
        // Wait for 1.5 seconds to show the message before redirecting
        setTimeout(() => {
          const loginUrl = new URL('/auth/login', window.location.origin);
          loginUrl.searchParams.set('redirect', currentUrl);
          loginUrl.searchParams.set('formData', encodedFormData);
          window.location.href = loginUrl.toString();
        }, 1500);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}`);
      
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          professional_id: params.id,
          service_id: selectedService,
          motivation,
          appointment_date: appointmentDateTime.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create appointment');
      }

      console.log('Appointment created:', data);
      
      // Show success message and redirect to appointments
      router.push('/dashboard/appointments');
    } catch (err) {
      console.error('Error creating appointment:', err);
      setError(err instanceof Error ? err.message : 'Failed to create appointment');
    } finally {
      setLoading(false);
    }
  };

  // Add useEffect to restore form data from URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const formDataParam = searchParams.get('formData');
    
    if (formDataParam) {
      try {
        const formData = JSON.parse(decodeURIComponent(formDataParam));
        setMotivation(formData.motivation || '');
        setSelectedDate(formData.selectedDate || '');
        setSelectedTime(formData.selectedTime || '');
        setSelectedService(formData.selectedService || '');
        // Remove the formData from URL to avoid restoring it again
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('formData');
        window.history.replaceState({}, '', newUrl.toString());
      } catch (err) {
        console.error('Error restoring form data:', err);
      }
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !professional) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Prenez votre rendez-vous en ligne
            </h1>

            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900">
                {professional.first_name} {professional.last_name}
              </h2>
              <p className="mt-1 text-gray-600">
                {professional.profession}
              </p>
              {professional.addresses && professional.addresses.length > 0 && (
                <p className="mt-1 text-gray-600">
                  {professional.addresses[0].city}
                </p>
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 rounded-md">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="motivation" className="block text-sm font-medium text-gray-700">
                  Motivation de votre rendez-vous
                </label>
                <textarea
                  id="motivation"
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  rows={4}
                  placeholder="Décrivez la raison de votre rendez-vous..."
                  required
                />
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                  Heure
                </label>
                <input
                  type="time"
                  id="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Envoi en cours...' : 'Confirmer le rendez-vous'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 