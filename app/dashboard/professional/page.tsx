'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ProfessionalService {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
}

export default function ProfessionalDashboard() {
  const [activeTab, setActiveTab] = useState<'requests' | 'calendar' | 'profile'>('requests');
  const [services, setServices] = useState<ProfessionalService[]>([]);
  const [newService, setNewService] = useState<Omit<ProfessionalService, 'id'>>({
    title: '',
    description: '',
    price: 0,
    duration: ''
  });
  const [editingService, setEditingService] = useState<ProfessionalService | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setFetching(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('professional_services')
        .select('*')
        .eq('professional_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (err: any) {
      console.error('Error fetching services:', err);
      setError('Erreur lors du chargement des services');
    } finally {
      setFetching(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Vous devez être connecté pour ajouter un service');
        return;
      }

      const { error: insertError } = await supabase
        .from('professional_services')
        .insert({
          professional_id: user.id,
          ...newService
        });

      if (insertError) throw insertError;

      setNewService({
        title: '',
        description: '',
        price: 0,
        duration: ''
      });
      setSuccess('Service ajouté avec succès');
      fetchServices();
    } catch (err: any) {
      console.error('Error adding service:', err);
      setError('Erreur lors de l\'ajout du service: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabase
        .from('professional_services')
        .update({
          title: editingService.title,
          description: editingService.description,
          price: editingService.price,
          duration: editingService.duration
        })
        .eq('id', editingService.id);

      if (updateError) throw updateError;

      setEditingService(null);
      setSuccess('Service mis à jour avec succès');
      fetchServices();
    } catch (err: any) {
      console.error('Error updating service:', err);
      setError('Erreur lors de la mise à jour du service: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('professional_services')
        .delete()
        .eq('id', serviceId);

      if (deleteError) throw deleteError;

      setSuccess('Service supprimé avec succès');
      fetchServices();
    } catch (err: any) {
      console.error('Error deleting service:', err);
      setError('Erreur lors de la suppression du service: ' + err.message);
    }
  };

  // Mock data for service requests
  const serviceRequests = [
    {
      id: 1,
      clientName: 'Marie Dupont',
      serviceType: 'Massage',
      date: '2024-03-15',
      time: '14:00',
      status: 'pending',
    },
    {
      id: 2,
      clientName: 'Jean Martin',
      serviceType: 'Coiffure',
      date: '2024-03-16',
      time: '10:00',
      status: 'confirmed',
    },
    {
      id: 3,
      clientName: 'Sophie Leroy',
      serviceType: 'Manucure',
      date: '2024-03-17',
      time: '15:30',
      status: 'pending',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64">
            <div className="bg-white shadow rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Tableau de bord
              </h2>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    activeTab === 'requests'
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Demandes de service
                </button>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    activeTab === 'calendar'
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Calendrier
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    activeTab === 'profile'
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Mes services
                </button>
              </nav>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1">
            {activeTab === 'requests' && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Demandes de service
                  </h3>
                </div>
                <div className="border-t border-gray-200">
                  <ul className="divide-y divide-gray-200">
                    {serviceRequests.map((request) => (
                      <li key={request.id} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-primary truncate">
                              {request.clientName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {request.serviceType} - {request.date} à {request.time}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                request.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {request.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                            </span>
                            <button className="text-primary hover:text-primary-dark">
                              Voir détails
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'calendar' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Calendrier
                </h3>
                {/* TODO: Implement calendar component */}
                <div className="text-center text-gray-500">
                  Calendrier à implémenter
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Mes services
                </h3>
                {error && (
                  <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md">
                    {success}
                  </div>
                )}

                {/* Add/Edit service form */}
                <form onSubmit={editingService ? handleUpdateService : handleAddService} className="mb-8 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Titre du service
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                      value={editingService ? editingService.title : newService.title}
                      onChange={(e) => {
                        if (editingService) {
                          setEditingService({ ...editingService, title: e.target.value });
                        } else {
                          setNewService({ ...newService, title: e.target.value });
                        }
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                      value={editingService ? editingService.description : newService.description}
                      onChange={(e) => {
                        if (editingService) {
                          setEditingService({ ...editingService, description: e.target.value });
                        } else {
                          setNewService({ ...newService, description: e.target.value });
                        }
                      }}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Prix (€)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                        value={editingService ? editingService.price : newService.price}
                        onChange={(e) => {
                          if (editingService) {
                            setEditingService({ ...editingService, price: parseFloat(e.target.value) });
                          } else {
                            setNewService({ ...newService, price: parseFloat(e.target.value) });
                          }
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Durée
                      </label>
                      <input
                        type="text"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                        value={editingService ? editingService.duration : newService.duration}
                        onChange={(e) => {
                          if (editingService) {
                            setEditingService({ ...editingService, duration: e.target.value });
                          } else {
                            setNewService({ ...newService, duration: e.target.value });
                          }
                        }}
                        placeholder="ex: 30 min"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-4">
                    {editingService && (
                      <button
                        type="button"
                        onClick={() => setEditingService(null)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Annuler
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark disabled:opacity-50"
                    >
                      {loading ? 'Enregistrement...' : editingService ? 'Mettre à jour' : 'Ajouter le service'}
                    </button>
                  </div>
                </form>

                {/* List of services */}
                {fetching ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-gray-600">Chargement des services...</p>
                  </div>
                ) : services.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Aucun service disponible. Ajoutez votre premier service ci-dessus.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div key={service.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">{service.title}</h4>
                            <p className="mt-1 text-gray-600">{service.description}</p>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <span className="font-medium">{service.price.toFixed(2)}€</span>
                              <span className="mx-2">•</span>
                              <span>{service.duration}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setEditingService(service)}
                              className="text-primary hover:text-primary-dark"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => handleDeleteService(service.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 