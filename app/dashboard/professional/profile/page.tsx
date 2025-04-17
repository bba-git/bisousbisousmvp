'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ProfessionalProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  profession_id: string;
  description: string;
  phone: string;
}

interface Address {
  id: string;
  street_address: string;
  city: string;
  postal_code: string;
  country: string;
  latitude?: number;
  longitude?: number;
  is_primary: boolean;
}

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
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const [newAddress, setNewAddress] = useState({
    street_address: '',
    city: '',
    postal_code: '',
    country: 'France',
    is_primary: true
  });

  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [editedAddress, setEditedAddress] = useState<Address | null>(null);

  const [professions, setProfessions] = useState<{ id: string; name: string }[]>([]);

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
        console.log('Starting checkUser...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('Auth error or no user:', { authError, user });
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
          console.error('No profile found for user:', user.id);
          setError('Profil non trouvé');
          return;
        }

        if (profileData.user_type !== 'professionnel') {
          console.error('Wrong user type:', profileData.user_type);
          router.push('/dashboard');
          return;
        }

        console.log('Profile data:', profileData);

        // Initialize default values for working hours if they don't exist
        const initializedProfile: ProfessionalProfile = {
          ...profileData,
          description: profileData.description || '',
          phone: profileData.phone || ''
        };

        console.log('Initialized profile:', initializedProfile);
        setProfile(initializedProfile);
      } catch (err) {
        console.error('Error in checkUser:', err);
        setError('Une erreur est survenue: ' + (err instanceof Error ? err.message : 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  useEffect(() => {
    fetchAddresses();
  }, []);

  useEffect(() => {
    const fetchProfessions = async () => {
      const { data, error } = await supabase
        .from('professions')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('Error fetching professions:', error);
        return;
      }

      setProfessions(data || []);
    };

    fetchProfessions();
  }, []);

  const fetchAddresses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('professional_addresses')
        .select('*')
        .eq('profile_id', user.id)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (err) {
      console.error('Error fetching addresses:', err);
      setError('Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate required fields
      console.log('Validating profile:', {
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        profession_id: profile?.profession_id
      });

      if (!profile || !profile.first_name.trim() || !profile.last_name.trim() || !profile.profession_id) {
        console.log('Validation failed:', {
          hasProfile: !!profile,
          hasFirstName: !!profile?.first_name?.trim(),
          hasLastName: !!profile?.last_name?.trim(),
          hasProfessionId: !!profile?.profession_id
        });
        setError('Tous les champs sont obligatoires');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const updateData = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        profession_id: profile.profession_id,
        description: profile.description,
        phone: profile.phone,
        updated_at: new Date().toISOString()
      };

      console.log('Updating profile with data:', {
        id: profile.id,
        updateData
      });

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id)
        .select();

      if (updateError) {
        console.error('Supabase update error:', updateError);
        throw updateError;
      }

      router.push('/dashboard');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Une erreur est survenue lors de la mise à jour du profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // If this is a primary address, unset other primary addresses
      if (newAddress.is_primary) {
        await supabase
          .from('professional_addresses')
          .update({ is_primary: false })
          .eq('profile_id', user.id)
          .eq('is_primary', true);
      }

      const { error } = await supabase
        .from('professional_addresses')
        .insert([{ ...newAddress, profile_id: user.id }]);

      if (error) throw error;

      // Reset form and refresh addresses
      setNewAddress({
        street_address: '',
        city: '',
        postal_code: '',
        country: 'France',
        is_primary: true
      });
      fetchAddresses();
    } catch (err) {
      console.error('Error adding address:', err);
      setError('Failed to add address');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const { error } = await supabase
        .from('professional_addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAddresses();
    } catch (err) {
      console.error('Error deleting address:', err);
      setError('Failed to delete address');
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address.id);
    setEditedAddress({ ...address });
  };

  const handleCancelEdit = () => {
    setEditingAddress(null);
    setEditedAddress(null);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedAddress) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // If this is a primary address, unset other primary addresses
      if (editedAddress.is_primary) {
        await supabase
          .from('professional_addresses')
          .update({ is_primary: false })
          .eq('profile_id', user.id)
          .eq('is_primary', true)
          .neq('id', editedAddress.id);
      }

      const { error } = await supabase
        .from('professional_addresses')
        .update({
          street_address: editedAddress.street_address,
          city: editedAddress.city,
          postal_code: editedAddress.postal_code,
          country: editedAddress.country,
          is_primary: editedAddress.is_primary
        })
        .eq('id', editedAddress.id);

      if (error) throw error;

      setEditingAddress(null);
      setEditedAddress(null);
      fetchAddresses();
    } catch (err) {
      console.error('Error updating address:', err);
      setError('Failed to update address');
    }
  };

  const handleDeleteProfile = async () => {
    if (deleteConfirmationText !== 'suppression') {
      setError('Veuillez taper "suppression" pour confirmer la suppression');
      return;
    }

    try {
      const response = await fetch('/api/profiles/delete', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete profile');
      }

      const data = await response.json();
      if (data.success) {
        router.push('/');
      } else {
        throw new Error(data.error || 'Failed to delete profile');
      }
    } catch (err) {
      console.error('Error deleting profile:', err);
      setError('Erreur lors de la suppression du profil');
    }
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
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Mon profil professionnel
              </h3>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-red-600 hover:text-red-800"
              >
                Supprimer mon compte
              </button>
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Confirmer la suppression
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.
                    Tapez "suppression" pour confirmer.
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
                    placeholder="Tapez 'suppression'"
                  />
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setIsDeleteModalOpen(false);
                        setDeleteConfirmationText('');
                        setError('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleDeleteProfile}
                      className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                    Prénom *
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    value={profile.first_name}
                    onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                    Nom *
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    value={profile.last_name}
                    onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="profession" className="block text-sm font-medium text-gray-700">
                    Profession *
                  </label>
                  <select
                    id="profession"
                    value={profile.profession_id || ''}
                    onChange={(e) => setProfile({ ...profile, profession_id: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    required
                  >
                    <option value="">Sélectionnez une profession</option>
                    {professions.map((profession) => (
                      <option key={profession.id} value={profession.id}>
                        {profession.name}
                      </option>
                    ))}
                  </select>
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

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                >
                  {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 mt-8">
        <h1 className="text-2xl font-bold mb-6">Gérer mes adresses</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleAddAddress} className="space-y-4 mb-8">
          <div>
            <label htmlFor="street_address" className="block text-sm font-medium text-gray-700">
              Adresse
            </label>
            <input
              type="text"
              id="street_address"
              value={newAddress.street_address}
              onChange={(e) => setNewAddress({ ...newAddress, street_address: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                Ville
              </label>
              <input
                type="text"
                id="city"
                value={newAddress.city}
                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
                Code postal
              </label>
              <input
                type="text"
                id="postal_code"
                value={newAddress.postal_code}
                onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700">
              Pays
            </label>
            <input
              type="text"
              id="country"
              value={newAddress.country}
              onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_primary"
              checked={newAddress.is_primary}
              onChange={(e) => setNewAddress({ ...newAddress, is_primary: e.target.checked })}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="is_primary" className="ml-2 block text-sm text-gray-700">
              Adresse principale
            </label>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Ajout en cours...' : 'Ajouter l\'adresse'}
          </button>
        </form>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Mes adresses</h2>
          {addresses.length === 0 ? (
            <p className="text-gray-500">Aucune adresse enregistrée</p>
          ) : (
            addresses.map((address) => (
              <div key={address.id} className="border rounded-lg p-4">
                {editingAddress === address.id && editedAddress ? (
                  <form onSubmit={handleSaveAddress} className="space-y-4">
                    <div>
                      <label htmlFor={`street_address_${address.id}`} className="block text-sm font-medium text-gray-700">
                        Adresse
                      </label>
                      <input
                        type="text"
                        id={`street_address_${address.id}`}
                        value={editedAddress.street_address}
                        onChange={(e) => setEditedAddress({ ...editedAddress, street_address: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor={`city_${address.id}`} className="block text-sm font-medium text-gray-700">
                          Ville
                        </label>
                        <input
                          type="text"
                          id={`city_${address.id}`}
                          value={editedAddress.city}
                          onChange={(e) => setEditedAddress({ ...editedAddress, city: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor={`postal_code_${address.id}`} className="block text-sm font-medium text-gray-700">
                          Code postal
                        </label>
                        <input
                          type="text"
                          id={`postal_code_${address.id}`}
                          value={editedAddress.postal_code}
                          onChange={(e) => setEditedAddress({ ...editedAddress, postal_code: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor={`country_${address.id}`} className="block text-sm font-medium text-gray-700">
                        Pays
                      </label>
                      <input
                        type="text"
                        id={`country_${address.id}`}
                        value={editedAddress.country}
                        onChange={(e) => setEditedAddress({ ...editedAddress, country: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        required
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`is_primary_${address.id}`}
                        checked={editedAddress.is_primary}
                        onChange={(e) => setEditedAddress({ ...editedAddress, is_primary: e.target.checked })}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <label htmlFor={`is_primary_${address.id}`} className="ml-2 block text-sm text-gray-700">
                        Adresse principale
                      </label>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{address.street_address}</p>
                      <p className="text-gray-600">
                        {address.postal_code} {address.city}
                      </p>
                      <p className="text-gray-600">{address.country}</p>
                      {address.is_primary && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-white mt-2">
                          Adresse principale
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditAddress(address)}
                        className="text-primary hover:text-primary-dark"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(address.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 