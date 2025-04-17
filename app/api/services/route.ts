import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  console.log('🔍 API: Services endpoint called');
  const { searchParams } = new URL(request.url);
  const searchQuery = searchParams.get('q');
  console.log('🔍 API: Search query:', searchQuery);

  try {
    console.log('🔍 API: Initializing Supabase query');
    
    if (!searchQuery) {
      console.log('🔍 API: No search query provided, fetching all services');
      const { data: allServices, error: allError } = await supabase
        .from('professional_services')
        .select('*');
      
      console.log('🔍 API: All services query result:', {
        data: allServices,
        error: allError
      });

      if (allError) {
        console.error('❌ API: Error fetching all services:', allError);
        return NextResponse.json({ error: allError.message }, { status: 500 });
      }

      return NextResponse.json(allServices);
    }

    console.log('🔍 API: Executing search with query:', searchQuery);
    const { data, error } = await supabase
      .from('professional_services')
      .select('*')
      .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      .order('title', { ascending: true });

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
