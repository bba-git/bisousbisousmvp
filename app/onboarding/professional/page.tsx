'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfessionalOnboarding() {
  const router = useRouter();
  const [siret, setSiret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sireneData, setSireneData] = useState<any>(null);
  const supabase = createClient();

  // Validate SIRET format
  const isValidSiret = (siret: string) => {
    if (!siret || siret.length !== 14) return false;
    return /^\d{14}$/.test(siret);
  };

  const handleSiretSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!isValidSiret(siret)) {
      setError('Le numéro SIRET doit contenir exactement 14 chiffres');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/sirene?siret=${siret}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la vérification du SIRET');
      }

      setSireneData(data);
      toast.success('Entreprise trouvée avec succès');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      toast.error('Erreur lors de la vérification du SIRET');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileCreation = async () => {
    if (!sireneData) return;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          siret: sireneData.siret,
          company_name: sireneData.company_name,
          ape_code: sireneData.ape_code,
          ape_label: sireneData.ape_label,
          legal_status: sireneData.legal_status,
          legal_status_label: sireneData.legal_status_label,
          creation_date: sireneData.creation_date,
          is_active: sireneData.is_active,
          type: 'professional'
        });

      if (profileError) throw profileError;

      // Insert address
      const { error: addressError } = await supabase
        .from('addresses')
        .insert({
          profile_id: user.id,
          street: sireneData.address.street,
          city: sireneData.address.city,
          postal_code: sireneData.address.postal_code,
          country: sireneData.address.country,
          is_primary: true
        });

      if (addressError) throw addressError;

      toast.success('Profil professionnel créé avec succès');
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du profil');
      toast.error('Erreur lors de la création du profil');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Création de votre profil professionnel</CardTitle>
          <CardDescription>
            Veuillez entrer votre numéro SIRET pour commencer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSiretSubmit} className="space-y-6">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Numéro SIRET (14 chiffres)"
                value={siret}
                onChange={(e) => setSiret(e.target.value.replace(/\D/g, ''))}
                maxLength={14}
                disabled={isLoading || !!sireneData}
                className="text-lg"
              />
              {error && (
                <div className="flex items-center text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {error}
                </div>
              )}
            </div>

            {!sireneData ? (
              <Button
                type="submit"
                disabled={isLoading || !isValidSiret(siret)}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Vérification en cours...
                  </>
                ) : (
                  'Vérifier le SIRET'
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center text-green-600 mb-2">
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    <span className="font-medium">Entreprise vérifiée</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Nom:</span> {sireneData.company_name}</p>
                    <p><span className="font-medium">SIRET:</span> {sireneData.siret}</p>
                    <p><span className="font-medium">APE:</span> {sireneData.ape_label}</p>
                    <p><span className="font-medium">Statut juridique:</span> {sireneData.legal_status_label}</p>
                    <p><span className="font-medium">Adresse:</span> {sireneData.address.street}, {sireneData.address.postal_code} {sireneData.address.city}</p>
                  </div>
                </div>

                <Button
                  onClick={handleProfileCreation}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Création du profil...
                    </>
                  ) : (
                    'Créer mon profil professionnel'
                  )}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 