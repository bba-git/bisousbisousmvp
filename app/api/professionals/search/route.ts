import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Function to remove accents and convert to lowercase
function normalizeString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lastName = searchParams.get('q');

    if (!lastName) {
      return NextResponse.json({ error: 'Last name is required' }, { status: 400 });
    }

    // Normalize the search query to match the normalized_last_name column
    const normalizedQuery = normalizeString(lastName);

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        professions:profession_id (
          name
        )
      `)
      .ilike('normalized_last_name', `%${normalizedQuery}%`);

    if (error) {
      console.error('Error searching professionals:', error);
      return NextResponse.json({ error: 'Failed to search professionals' }, { status: 500 });
    }

    // Transform the data to include profession name from the joined table
    const transformedData = data.map(profile => ({
      ...profile,
      profession: profile.professions?.name || 'Autre'
    }));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error in professionals search:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 