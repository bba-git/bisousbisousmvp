import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ProfessionalList from '@/components/professional-list';

interface PageProps {
  params: {
    profession: string;
    location: string;
  };
}

export default async function LocationPage({ params }: PageProps) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/auth/login');
  }

  const { data: profession } = await supabase
    .from('professions')
    .select('id')
    .eq('name', decodeURIComponent(params.profession))
    .single();

  if (!profession) {
    return <div>Profession not found</div>;
  }

  const { data: professionals, error } = await supabase
    .from('profiles')
    .select(`
      id,
      first_name,
      last_name,
      description,
      specialties,
      working_hours
    `)
    .eq('user_type', 'professional')
    .eq('profession_id', profession.id)
    .ilike('location', `%${decodeURIComponent(params.location)}%`);

  if (error) {
    console.error('Error fetching professionals:', error);
    return <div>Error loading professionals</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {decodeURIComponent(params.profession)} in {decodeURIComponent(params.location)}
      </h1>
      <ProfessionalList professionals={professionals || []} />
    </div>
  );
} 