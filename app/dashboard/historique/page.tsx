'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ServiceRequest {
  id: string;
  service_type: string;
  preferred_date: string;
  preferred_time: string;
  location: string;
  description: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  created_at: string;
  client_id: string;
  professional_id?: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_type: 'client' | 'professionnel';
}

export default function Historique() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'completed' | 'cancelled'>('all');
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const checkUser = async () => {
      try {
        console.log('Checking user authentication...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Auth error:', authError);
          if (mounted) {
            setError('Erreur d\'authentification: ' + authError.message);
            setLoading(false);
          }
          return;
        }

        if (!user) {
          console.log('No user found, redirecting to login...');
          router.push('/auth/login');
          return;
        }

        console.log('User found:', user.id);
        console.log('Fetching profile for user:', user.id);
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        console.log('Profile query result:', { data: profileData, error: profileError });

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          if (mounted) {
            setError('Erreur lors du chargement du profil: ' + profileError.message);
            setLoading(false);
          }
          return;
        }

        if (!profileData) {
          console.error('No profile found for user:', user.id);
          if (mounted) {
            setError('Profil non trouvé pour cet utilisateur');
            setLoading(false);
          }
          return;
        }

        console.log('Profile found:', profileData);
        if (mounted) {
          setProfile(profileData);
          await fetchRequests(profileData);
        }
      } catch (err: any) {
        console.error('Error in checkUser:', err);
        if (mounted) {
          setError('Une erreur est survenue: ' + (err.message || 'Erreur inconnue'));
          setLoading(false);
        }
      }
    };

    checkUser();

    return () => {
      mounted = false;
    };
  }, [router]);

  const fetchRequests = async (userProfile: Profile) => {
    try {
      console.log('Fetching requests for profile:', userProfile.id);
      setLoading(true);
      let query = supabase
        .from('service_requests')
        .select('*');

      if (userProfile.user_type === 'client') {
        query = query.eq('client_id', userProfile.id);
      } else {
        query = query.eq('professional_id', userProfile.id);
      }

      const { data: requestsData, error: requestsError } = await query.order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching requests:', requestsError);
        throw requestsError;
      }

      console.log('Requests fetched:', requestsData?.length || 0);
      setRequests(requestsData || []);
    } catch (err: any) {
      console.error('Error in fetchRequests:', err);
      setError(`Erreur lors du chargement des demandes: ${err.message || 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'accepted':
        return 'Accepté';
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  const filteredRequests = requests.filter(request => 
    filter === 'all' || request.status === filter
  );

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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
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
                Historique des demandes
              </h3>
              <div className="flex space-x-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                >
                  <option value="all">Tous</option>
                  <option value="pending">En attente</option>
                  <option value="accepted">Acceptés</option>
                  <option value="completed">Terminés</option>
                  <option value="cancelled">Annulés</option>
                </select>
              </div>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Aucune demande trouvée</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {request.service_type}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {new Date(request.preferred_date).toLocaleDateString('fr-FR')} à{' '}
                          {request.preferred_time}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {request.location}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {getStatusText(request.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {request.description}
                    </p>
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