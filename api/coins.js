const PUMP_ORIGIN = 'https://pump.fun';
const PUMP_API = 'https://frontend-api-v3.pump.fun';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Accept, Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const upstream = new URL(`${PUMP_API}/coins`);
  for (const [key, value] of Object.entries(req.query)) {
    if (value != null) upstream.searchParams.set(key, String(value));
  }

  try {
    const upstreamRes = await fetch(upstream, {
      headers: { Accept: 'application/json', Origin: PUMP_ORIGIN },
    });
    const body = await upstreamRes.text();
    res.setHeader('Content-Type', upstreamRes.headers.get('content-type') || 'application/json');
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
    return res.status(upstreamRes.status).send(body);
  } catch (err) {
    return res.status(502).json({ error: 'Pump API proxy failed', message: err.message });
  }
}