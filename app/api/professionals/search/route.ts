import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  console.log('🔍 API: Professionals search endpoint called');
  const { searchParams } = new URL(request.url);
  const searchQuery = searchParams.get('q');
  console.log('🔍 API: Search query:', searchQuery);

  try {
    console.log('🔍 API: Initializing Supabase query');
    
    if (!searchQuery) {
      console.log('🔍 API: No search query provided, fetching all professionals');
      const { data: allProfessionals, error: allError } = await supabase
        .from('profiles')
        .select('*');
      
      console.log('🔍 API: All professionals query result:', {
        data: allProfessionals,
        error: allError
      });

      if (allError) {
        console.error('❌ API: Error fetching all professionals:', allError);
        return NextResponse.json({ error: allError.message }, { status: 500 });
      }

      return NextResponse.json(allProfessionals);
    }

    console.log('🔍 API: Executing search with query:', searchQuery);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`last_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery.toLowerCase()}%,last_name.ilike.%${searchQuery.toUpperCase()}%`);

    console.log('🔍 API: Search query result:', {
      data,
      error,
      query: searchQuery
    });

    if (error) {
      console.error('❌ API: Error in search query:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ API: Search completed successfully');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 