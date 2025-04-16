import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    let data;
    let error;

    if (query) {
      const result = await supabase
        .rpc('search_services', { query: query });
      data = result.data;
      error = result.error;
    } else {
      // If no query, return all services with professional info
      const result = await supabase
        .from('professional_services')
        .select(`
          *,
          profiles:professional_id (
            first_name,
            last_name,
            profession
          )
        `);
      data = result.data?.map(service => ({
        ...service,
        first_name: service.profiles?.first_name,
        last_name: service.profiles?.last_name,
        profession: service.profiles?.profession,
        rank: 0
      }));
      error = result.error;
    }

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json(
        { error: 'Failed to perform search' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 