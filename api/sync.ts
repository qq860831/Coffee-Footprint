import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response('OK', { headers });
  }

  // Resolve env variables inside the handler
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    return new Response(JSON.stringify({ error: 'Supabase credentials not configured. Please check Vercel Environment Variables.' }), { status: 500, headers });
  }

  let supabase;
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return new Response(JSON.stringify({ error: 'Supabase client initialization failed.' }), { status: 500, headers });
  }

  try {
    if (request.method === 'GET') {
      const { searchParams } = new URL(request.url);
      const key = searchParams.get('key');
      
      if (!key) {
        return new Response(JSON.stringify({ error: 'Key is required' }), { status: 400, headers });
      }

      const { data, error } = await supabase
        .from('kv_store')
        .select('value')
        .eq('key', key)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Supabase GET Error:', error);
        return new Response(JSON.stringify({ value: null, error: error.message }), { status: 200, headers });
      }

      return new Response(JSON.stringify({ value: data ? data.value : null }), { status: 200, headers });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const { key, value } = body;
      
      if (!key) {
        return new Response(JSON.stringify({ error: 'Key is required' }), { status: 400, headers });
      }

      const { error } = await supabase
        .from('kv_store')
        .upsert({ key, value }, { onConflict: 'key' });

      if (error) {
        console.error('Supabase POST Error:', error);
        return new Response(JSON.stringify({ error: 'Database update failed', details: error.message }), { status: 500, headers });
      }

      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers });
  }
}
