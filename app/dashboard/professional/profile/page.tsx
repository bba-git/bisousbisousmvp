'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ProfessionalProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  specialties: string[];
  location: string;
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
}

const AVAILABLE_SPECIALTIES = [
  'Coiffure',
  'Manucure',
  'Maquillage',
  'Massage',
  'Épilation',
  'Soins du visage',
  'Soins du corps',
  'Autre'
];

const DAYS = [
  { id: 'monday', label: 'Lundi' },
  { id: 'tuesday', label: 'Mardi' },
  { id: 'wednesday', label: 'Mercredi' },
  { id: 'thursday', label: 'Jeudi' },
  { id: 'friday', label: 'Vendredi' },
  { id: 'saturday', label: 'Samedi' },
  { id: 'sunday', label: 'Dimanche' }
];

export default function ProfessionalProfile() {
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const router = useRouter();

  // Add this function to help debug
  const logCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    console.log('Current user:', user);
    console.log('Auth error:', error);
    return user;
  };

  // Make it available globally for debugging
  if (typeof window !== 'undefined') {
    (window as any).logCurrentUser = logCurrentUser;
  }

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.log('Auth error or no user:', { authError, user });
          router.push('/auth/login');
          return;
        }

        console.log('Authenticated user:', user);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          setError('Erreur lors de la récupération du profil');
          return;
        }

        if (!profileData) {
          console.log('No profile found for user:', user.id);
          setError('Profil non trouvé');
          return;
        }

        if (profileData.user_type !== 'professionnel') {
          console.log('Wrong user type:', profileData.user_type);
          router.push('/dashboard');
          return;
        }

        // Initialize default values for availability and working hours if they don't exist
        const initializedProfile: ProfessionalProfile = {
          ...profileData,
          availability: {
            monday: profileData.availability?.monday ?? false,
            tuesday: profileData.availability?.tuesday ?? false,
            wednesday: profileData.availability?.wednesday ?? false,
            thursday: profileData.availability?.thursday ?? false,
            friday: profileData.availability?.friday ?? false,
            saturday: profileData.availability?.saturday ?? false,
            sunday: profileData.availability?.sunday ?? false
          },
          working_hours: {
            start: profileData.working_hours?.start ?? '09:00',
            end: profileData.working_hours?.end ?? '18:00'
          }
        };

        setProfile(initializedProfile);
      } catch (err) {
        console.error('Error in checkUser:', err);
        setError('Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted');
    
    if (!profile) {
      console.log('No profile data available');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      console.log('Updating profile with data:', {
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        location: profile.location,
        description: profile.description,
        phone: profile.phone,
        specialties: profile.specialties,
        availability: profile.availability,
        working_hours: profile.working_hours,
      });

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          location: profile.location,
          description: profile.description,
          phone: profile.phone,
          specialties: profile.specialties,
          availability: profile.availability,
          working_hours: profile.working_hours,
        })
        .eq('id', profile.id)
        .select();

      if (updateError) {
        console.error('Update error details:', updateError);
        throw updateError;
      }

      console.log('Update successful, returned data:', data);
      setSuccess('Profil mis à jour avec succès');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError('Erreur lors de la mise à jour du profil: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addSpecialty = () => {
    if (!newSpecialty || !profile) return;
    if (profile.specialties.includes(newSpecialty)) return;

    setProfile({
      ...profile,
      specialties: [...profile.specialties, newSpecialty]
    });
    setNewSpecialty('');
  };

  const removeSpecialty = (specialty: string) => {
    if (!profile) return;
    setProfile({
      ...profile,
      specialties: profile.specialties.filter(s => s !== specialty)
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
              Mon profil professionnel
            </h3>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded mb-4">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                    Prénom
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    value={profile.first_name}
                    onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                    Nom
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    value={profile.last_name}
                    onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Localisation
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="Ville ou code postal"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={profile.description || ''}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="Décrivez vos services et votre expérience..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spécialités
                </label>
                <div className="flex gap-2 mb-2">
                  <select
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    <option value="">Sélectionnez une spécialité</option>
                    {AVAILABLE_SPECIALTIES.map((specialty) => (
                      <option key={specialty} value={specialty}>
                        {specialty}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={addSpecialty}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Ajouter
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {specialty}
                      <button
                        type="button"
                        onClick={() => removeSpecialty(specialty)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Disponibilités</h2>
                <div className="grid grid-cols-2 gap-4">
                  {DAYS.map(day => (
                    <div key={day.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={day.id}
                        checked={profile.availability[day.id as keyof typeof profile.availability]}
                        onChange={(e) => {
                          setProfile({
                            ...profile,
                            availability: {
                              ...profile.availability,
                              [day.id]: e.target.checked
                            }
                          });
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={day.id} className="text-sm font-medium text-gray-700">
                        {day.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Horaires de travail</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="start" className="block text-sm font-medium text-gray-700">
                      Heure de début
                    </label>
                    <input
                      type="time"
                      id="start"
                      value={profile.working_hours.start}
                      onChange={(e) => {
                        setProfile({
                          ...profile,
                          working_hours: {
                            ...profile.working_hours,
                            start: e.target.value
                          }
                        });
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="end" className="block text-sm font-medium text-gray-700">
                      Heure de fin
                    </label>
                    <input
                      type="time"
                      id="end"
                      value={profile.working_hours.end}
                      onChange={(e) => {
                        setProfile({
                          ...profile,
                          working_hours: {
                            ...profile.working_hours,
                            end: e.target.value
                          }
                        });
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 