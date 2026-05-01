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
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  if (request.method === 'OPTIONS') {
    return new Response('OK', { headers });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Supabase credentials missing' }), { status: 500, headers });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    if (request.method === 'GET') {
      const { searchParams } = new URL(request.url);
      const key = searchParams.get('key');
      
      if (!key) return new Response(JSON.stringify({ error: 'Key missing' }), { status: 400, headers });

      const { data, error } = await supabase
        .from('kv_store')
        .select('value')
        .eq('key', key)
        .single();

      if (error && error.code !== 'PGRST116') {
        return new Response(JSON.stringify({ value: null, error: error.message }), { status: 200, headers });
      }

      return new Response(JSON.stringify({ value: data ? data.value : null }), { status: 200, headers });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const { key, value } = body;
      
      if (!key) return new Response(JSON.stringify({ error: 'Key missing' }), { status: 400, headers });

      const { error } = await supabase
        .from('kv_store')
        .upsert({ key, value }, { onConflict: 'key' });

      if (error) {
        return new Response(JSON.stringify({ error: 'Upsert failed', details: error.message }), { status: 500, headers });
      }

      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Internal Error', message: error.message }), { status: 500, headers });
  }
}
