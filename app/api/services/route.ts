import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    console.log('Search query:', query);

    let result;
    if (query) {
      result = await supabase
        .from('professional_services')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    } else {
      result = await supabase
        .from('professional_services')
        .select('*');
    }

    console.log('Query result:', {
      data: result.data,
      error: result.error,
      count: result.data?.length
    });

    if (result.error) {
      console.error('Error:', result.error);
      return NextResponse.json(
        { error: 'Failed to search services' },
        { status: 500 }
      );
    }

    return NextResponse.json({ services: result.data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 