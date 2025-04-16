'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

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
    id: string;
  } 
}) {
  const [professional, setProfessional] = useState<ProfessionalProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const fetchProfessional = async () => {
      try {
        setLoading(true);
        
        const { data: professionalData, error: professionalError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', params.id)
          .single();

        if (professionalError) throw professionalError;

        if (!professionalData) {
          setError('Professionnel non trouvé');
          return;
        }

        // Fetch main address
        let addressesData: { city: string }[] = [];
        try {
          const response = await fetch(`/api/professional/${params.id}/main-address`);
          if (response.ok) {
            const addressData = await response.json();
            if (addressData) {
              addressesData = [addressData];
            }
          }
        } catch (err) {
          console.error('Error fetching main address:', err);
        }

        // Fetch services
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('professional_id', params.id);

        if (servicesError) throw servicesError;

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

        setProfessional(professionalWithDefaults);
        setServices(servicesData || []);
      } catch (err) {
        console.error('Error in fetchProfessional:', err);
        setError('Une erreur est survenue lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    };

    fetchProfessional();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement booking logic
    console.log('Booking submitted:', {
      serviceId: selectedService,
      date: selectedDate,
      time: selectedTime,
    });
  };

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Prenez votre rendez-vous en ligne
            </h1>

            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900">Professionnel</h2>
              <p className="mt-1 text-gray-600">
                {professional.first_name} {professional.last_name} - {professional.profession}
              </p>
              {professional.addresses && professional.addresses.length > 0 && (
                <p className="mt-1 text-gray-600">
                  {professional.addresses[0].city}
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="service" className="block text-sm font-medium text-gray-700">
                  Service
                </label>
                <select
                  id="service"
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  required
                >
                  <option value="">Sélectionnez un service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.title} - {service.price}€ ({service.duration})
                    </option>
                  ))}
                </select>
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
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Confirmer le rendez-vous
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 