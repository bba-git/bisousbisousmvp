'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'professionnel' | 'client'>('professionnel');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

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
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un professionnel ou un service..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
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