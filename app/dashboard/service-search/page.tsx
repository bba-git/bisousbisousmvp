'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  professional_id: string;
  first_name: string;
  last_name: string;
  profession: string;
  rank: number;
}

export default function ServiceSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      setError('');

      try {
        const { data, error } = await supabase
          .rpc('search_services', { query: debouncedQuery });

        if (error) throw error;

        setResults(data || []);
      } catch (err: any) {
        console.error('Search error:', err);
        setError('Erreur lors de la recherche: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Rechercher un service
          </h1>

          {/* Search input */}
          <div className="mb-8">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un service (ex: consultation, analyse, création d'entreprise...)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
              />
              {loading && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {/* Results */}
          {results.length > 0 ? (
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
                      href={`/dashboard/service-request?service_id=${result.id}&professional_id=${result.professional_id}`}
                      className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark"
                    >
                      Réserver
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : debouncedQuery ? (
            <div className="text-center py-8 text-gray-500">
              Aucun résultat trouvé pour "{debouncedQuery}"
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Commencez à taper pour rechercher des services
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 