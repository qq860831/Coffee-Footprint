import { kv } from '@vercel/kv';

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

  try {
    if (request.method === 'GET') {
      const { searchParams } = new URL(request.url);
      const key = searchParams.get('key');
      
      if (!key) {
        return new Response(JSON.stringify({ error: 'Key is required' }), { status: 400, headers });
      }

      const data = await kv.get(key);
      return new Response(JSON.stringify({ value: data }), { status: 200, headers });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const { key, value } = body;
      
      if (!key) {
        return new Response(JSON.stringify({ error: 'Key is required' }), { status: 400, headers });
      }

      await kv.set(key, value);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    return new Response('Method not allowed', { status: 405, headers });
  } catch (error) {
    console.error('KV Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers });
  }
}
