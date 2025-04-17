'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  professional_id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  first_name: string;
  last_name: string;
  profession: string;
}

interface ProfessionalResult {
  id: string;
  first_name: string;
  last_name: string;
  profession: string;
  verified: boolean;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'professionnel' | 'client'>('professionnel');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [professionalResults, setProfessionalResults] = useState<ProfessionalResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const router = useRouter();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Perform both searches
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setProfessionalResults([]);
      return;
    }

    const performSearches = async () => {
      setIsLoading(true);
      try {
        // Perform services search
        const servicesResponse = await fetch(`/api/services?q=${encodeURIComponent(debouncedQuery)}`);
        if (!servicesResponse.ok) {
          throw new Error('Failed to fetch services');
        }
        const servicesData = await servicesResponse.json();
        setResults(servicesData);

        // Perform professionals search
        const professionalsResponse = await fetch(`/api/professionals/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (!professionalsResponse.ok) {
          throw new Error('Failed to fetch professionals');
        }
        const professionalsData = await professionalsResponse.json();
        setProfessionalResults(professionalsData);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    performSearches();
  }, [debouncedQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search-results?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-primary">BisousBisous</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" className="text-gray-600 hover:text-primary">
                Connexion
              </Link>
              <Link
                href="/auth/register"
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
              >
                Inscription
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Bienvenue sur BisousBisous
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            La plateforme qui connecte les professionnels du bien-être avec leurs clients
          </p>
        </div>

        <div className="max-w-3xl mx-auto mt-8 mb-12">
          <form onSubmit={handleSearch} className="flex gap-2 relative">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un service ou un professionnel..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {isLoading && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                </div>
              )}
              {(results.length > 0 || professionalResults.length > 0) && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg max-h-[500px] overflow-y-auto">
                  {results.length > 0 && (
                    <div className="p-2 border-b">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Services</h3>
                      {results.slice(0, 5).map((result) => (
                        <Link
                          key={result.id}
                          href={`/auth/login?redirect=/dashboard/service-request?service_id=${result.id}&professional_id=${result.professional_id}`}
                          className="block p-3 hover:bg-gray-50 border-b last:border-b-0"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-sm font-medium text-gray-900">
                                {result.title}
                              </h3>
                              <p className="mt-0.5 text-xs text-gray-600 line-clamp-1">
                                {result.description}
                              </p>
                              <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                                <span className="font-medium text-primary">
                                  {result.price.toFixed(2)}€
                                </span>
                                <span>•</span>
                                <span>{result.duration}</span>
                                <span>•</span>
                                <span>
                                  {result.first_name} {result.last_name}
                                  {result.profession && ` • ${result.profession}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  {professionalResults.length > 0 && (
                    <div className="p-2">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Professionnels</h3>
                      {professionalResults.slice(0, 5).map((result) => (
                        <Link
                          key={result.id}
                          href={`/${(result.profession || 'autre').toLowerCase()}/eguilles/${result.id}`}
                          className="block p-3 hover:bg-gray-50 border-b last:border-b-0"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="text-sm font-medium text-gray-900">
                                  {result.first_name} {result.last_name}
                                </h3>
                                {result.verified ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Vérifié
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Non vérifié
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                                {result.profession && (
                                  <>
                                    <span>{result.profession}</span>
                                    <span>•</span>
                                  </>
                                )}
                                <span>Éguilles</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              type="submit"
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-opacity-90"
            >
              Rechercher
            </button>
          </form>
        </div>

        <div className="max-w-3xl mx-auto mt-12">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setActiveTab('professionnel')}
                className={`flex-1 py-2 px-4 rounded-lg ${
                  activeTab === 'professionnel'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Je suis un professionnel
              </button>
              <button
                onClick={() => setActiveTab('client')}
                className={`flex-1 py-2 px-4 rounded-lg ${
                  activeTab === 'client'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Je suis un client
              </button>
            </div>

            {activeTab === 'professionnel' ? (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Pour les professionnels
                </h2>
                <p className="text-gray-600">
                  Gérez votre activité, rencontrez de nouveaux clients et développez votre
                  entreprise.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li>✓ Tableau de bord personnalisé</li>
                  <li>✓ Gestion des rendez-vous</li>
                  <li>✓ Profil professionnel</li>
                  <li>✓ Système de notation</li>
                </ul>
                <Link
                  href="/auth/register?type=professionnel"
                  className="inline-block bg-primary text-white px-6 py-3 rounded-lg mt-4 hover:bg-opacity-90"
                >
                  Créer un compte professionnel
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Pour les clients
                </h2>
                <p className="text-gray-600">
                  Trouvez le professionnel parfait pour vos besoins en bien-être.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li>✓ Recherche de professionnels</li>
                  <li>✓ Prise de rendez-vous en ligne</li>
                  <li>✓ Avis et recommandations</li>
                  <li>✓ Suivi de vos séances</li>
                </ul>
                <Link
                  href="/auth/register?type=client"
                  className="inline-block bg-primary text-white px-6 py-3 rounded-lg mt-4 hover:bg-opacity-90"
                >
                  Créer un compte client
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 