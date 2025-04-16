'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface SearchResult {
  id: string;
  professional_id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  profession: string;
}

export default function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const searchQuery = searchParams.get('q');
    if (!searchQuery) {
      router.push('/');
      return;
    }

    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/services?q=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }
        const data = await response.json();
        setResults(data);
      } catch (err) {
        setError('Une erreur est survenue lors de la recherche');
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-primary">BisousBisous</Link>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Résultats de recherche pour "{searchParams.get('q')}"
          </h1>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {/* Results */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Recherche en cours...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-6">
              {results.map((result) => (
                <div key={result.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {result.title}
                      </h3>
                      <p className="mt-2 text-gray-600">
                        {result.description}
                      </p>
                      <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
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
                    <Link
                      href={`/auth/login?redirect=/dashboard/service-request?service_id=${result.id}&professional_id=${result.professional_id}`}
                      className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark"
                    >
                      Réserver
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Aucun résultat trouvé pour "{searchParams.get('q')}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 