'use client';

import { useState, ChangeEvent, FormEvent, ReactElement } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    profession: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | ReactElement>('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const userType = searchParams.get('type') || 'client';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Sign up the user with metadata and correct redirect URL
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            user_type: userType,
            profession: userType === 'professionnel' ? formData.profession : null,
          },
        },
      });

      if (authError) {
        console.error('Signup error:', authError);
        if (authError.message.includes('email')) {
          setError('Cette adresse email est déjà utilisée ou invalide');
        } else if (authError.message.includes('password')) {
          setError('Le mot de passe doit contenir au moins 6 caractères');
        } else if (authError.message.includes('seconds')) {
          setError('Veuillez patienter quelques secondes avant de réessayer');
        } else {
          setError(`Erreur lors de l'inscription: ${authError.message}`);
        }
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Une erreur est survenue lors de la création du compte');
        setIsLoading(false);
        return;
      }

      // 2. Create profile directly
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          user_type: userType as 'client' | 'professionnel',
          profession: userType === 'professionnel' ? formData.profession : null,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        setError(`Erreur lors de la création du profil: ${profileError.message}`);
        setIsLoading(false);
        return;
      }

      // Check if email confirmation is required
      if (authData.user?.identities?.[0]?.identity_data?.email_verified === false) {
        setSuccessMessage(
          <>
            Un email de vérification a été envoyé à {formData.email}.<br />
            Veuillez vérifier votre boîte de réception (et les spams).<br />
            <br />
            Si vous ne recevez pas l'email, vous pouvez{' '}
            <button
              onClick={async () => {
                const { error } = await supabase.auth.resend({
                  type: 'signup',
                  email: formData.email,
                });
                if (error) {
                  setError(`Erreur lors de l'envoi de l'email: ${error.message}`);
                } else {
                  setSuccessMessage('Un nouvel email de vérification a été envoyé.');
                }
              }}
              className="text-primary hover:text-primary-dark underline"
            >
              renvoyer l'email de confirmation
            </button>
            .
          </>
        );
      } else {
        setSuccessMessage('Inscription réussie ! Redirection vers le tableau de bord...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
      
      setIsLoading(false);

    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Une erreur inattendue est survenue');
      setIsLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Créer un compte {userType === 'professionnel' ? 'professionnel' : 'client'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
                {successMessage}
              </div>
            )}

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Prénom
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="firstName"
                    id="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nom
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="lastName"
                    id="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Adresse email
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                Téléphone
              </label>
              <div className="mt-1">
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            {userType === 'professionnel' && (
              <div>
                <label
                  htmlFor="profession"
                  className="block text-sm font-medium text-gray-700"
                >
                  Profession
                </label>
                <div className="mt-1">
                  <select
                    name="profession"
                    id="profession"
                    required
                    value={formData.profession}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    <option value="">Sélectionnez une profession</option>
                    <option value="Avocat">Avocat</option>
                    <option value="Expert-comptable">Expert-comptable</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Mot de passe
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  name="password"
                  id="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirmer le mot de passe
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isLoading ? 'bg-gray-400' : 'bg-primary hover:bg-primary-dark'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
              >
                {isLoading ? 'Inscription en cours...' : "S'inscrire"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Déjà un compte?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/auth/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 