'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SelectType() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const validateGoogleCalendarToken = async (accessToken: string) => {
    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Google Calendar API validation failed:', errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating Google Calendar token:', error);
      return false;
    }
  };

  const handleTypeSelection = async (isProfessional: boolean) => {
    try {
      setIsLoading(true);
      setError('');

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error(`Session error: ${sessionError.message}`);
      }

      if (!session) {
        console.error('No session found');
        throw new Error('No session found');
      }

      console.log('Session data:', {
        userId: session.user.id,
        email: session.user.email,
        metadata: session.user.user_metadata
      });

      // First check if profile exists
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select()
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileCheckError) {
        console.error('Profile check error:', profileCheckError);
        throw new Error(`Profile check error: ${profileCheckError.message}`);
      }

      if (existingProfile) {
        console.log('Updating existing profile');
        // Update existing profile
        const { data, error: profileError } = await supabase
          .from('profiles')
          .update({
            user_type: isProfessional ? 'professionnel' : 'client',
            first_name: session.user.user_metadata?.full_name?.split(' ')[0] || '',
            last_name: session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            updated_at: new Date().toISOString()
          })
          .eq('id', session.user.id)
          .select()
          .single();
          
        if (profileError) {
          console.error('Profile update error:', profileError);
          throw new Error(`Profile update error: ${profileError.message}`);
        }
      } else {
        console.log('Creating new profile');
        // Create new profile
        const { data, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            user_type: isProfessional ? 'professionnel' : 'client',
            first_name: session.user.user_metadata?.full_name?.split(' ')[0] || '',
            last_name: session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            verified: false,
            profession_id: isProfessional ? (
              await supabase
                .from('professions')
                .select('id')
                .eq('name', 'Autre')
                .single()
            ).data?.id : null
          })
          .select()
          .single();

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw new Error(`Profile creation error: ${profileError.message}`);
        }
      }

      // For professionals, redirect to profile setup
      if (isProfessional) {
        router.push('/dashboard/professional/profile');
        return;
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error in type selection:', error);
      setError(`Une erreur est survenue lors de la création de votre profil: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Choisissez votre type de compte
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={() => handleTypeSelection(true)}
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {isLoading ? 'Chargement...' : 'Je suis un professionnel'}
            </button>

            <button
              onClick={() => handleTypeSelection(false)}
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50"
            >
              {isLoading ? 'Chargement...' : 'Je suis un client'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 