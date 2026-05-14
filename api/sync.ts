import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export default async function handler(request: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (!supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({ error: 'Missing Supabase environment variables' }),
      { status: 500, headers }
    );
  }

  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (!key) {
    return new Response(JSON.stringify({ error: 'Missing key parameter' }), {
      status: 400,
      headers,
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  try {
    if (request.method === 'GET') {
      const { data, error } = await supabase
        .from('kv_store')
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (error) {
        console.error('Supabase GET error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers,
        });
      }

      return new Response(JSON.stringify({ value: data?.value ?? null }), {
        status: 200,
        headers,
      });
    }

    if (request.method === 'POST') {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
          status: 400,
          headers,
        });
      }

      const { error } = await supabase
        .from('kv_store')
        .upsert({ key, value: body }, { onConflict: 'key' });

      if (error) {
        console.error('Supabase POST error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers,
        });
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers,
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Handler error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers,
    });
  }
}
