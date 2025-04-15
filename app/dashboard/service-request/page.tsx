'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  user_type: 'client' | 'professionnel';
}

export default function ServiceRequest() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    serviceType: '',
    preferredDate: '',
    preferredTime: '',
    location: '',
    description: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, user_type')
        .eq('id', user.id)
        .single();

      if (profileData?.user_type !== 'client') {
        router.push('/dashboard');
        return;
      }

      setProfile(profileData);
    };

    checkUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!profile) {
      setError('Vous devez être connecté pour envoyer une demande');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Submitting request with data:', {
        client_id: profile.id,
        service_type: formData.serviceType,
        preferred_date: formData.preferredDate,
        preferred_time: formData.preferredTime,
        location: formData.location,
        description: formData.description,
        notes: formData.notes,
        status: 'pending',
      });

      const { data, error: submissionError } = await supabase
        .from('service_requests')
        .insert({
          client_id: profile.id,
          service_type: formData.serviceType,
          preferred_date: formData.preferredDate,
          preferred_time: formData.preferredTime,
          location: formData.location,
          description: formData.description,
          notes: formData.notes,
          status: 'pending',
        })
        .select();

      if (submissionError) {
        console.error('Detailed error:', submissionError);
        throw submissionError;
      }

      console.log('Request submitted successfully:', data);

      // Redirect to dashboard with success message
      router.push('/dashboard?success=request_sent');
    } catch (err: any) {
      console.error('Error submitting request:', err);
      setError(`Erreur lors de l'envoi de la demande: ${err.message || 'Erreur inconnue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Demande de service
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                Remplissez ce formulaire pour demander un service. Un professionnel vous
                contactera dans les plus brefs délais.
              </p>
            </div>
            <form className="mt-5 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="serviceType"
                  className="block text-sm font-medium text-gray-700"
                >
                  Type de service
                </label>
                <select
                  id="serviceType"
                  name="serviceType"
                  required
                  value={formData.serviceType}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                >
                  <option value="">Sélectionnez un service</option>
                  <option value="massage">Massage</option>
                  <option value="coiffure">Coiffure</option>
                  <option value="manucure">Manucure</option>
                  <option value="maquillage">Maquillage</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="preferredDate"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Date préférée
                  </label>
                  <div className="mt-1">
                    <input
                      type="date"
                      name="preferredDate"
                      id="preferredDate"
                      required
                      value={formData.preferredDate}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="preferredTime"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Heure préférée
                  </label>
                  <div className="mt-1">
                    <input
                      type="time"
                      name="preferredTime"
                      id="preferredTime"
                      required
                      value={formData.preferredTime}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700"
                >
                  Lieu
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="location"
                    id="location"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Adresse complète"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description du service
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    required
                    value={formData.description}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Décrivez en détail le service que vous souhaitez..."
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700"
                >
                  Notes supplémentaires
                </label>
                <div className="mt-1">
                  <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    value={formData.notes}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Décrivez vos besoins spécifiques..."
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    isLoading ? 'bg-gray-400' : 'bg-primary hover:bg-primary-dark'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
                >
                  {isLoading ? 'Envoi en cours...' : 'Envoyer la demande'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 