// GET /.netlify/functions/rates  (public)
//
// Proxies the West Coast Capital Mortgage rate desk file (assets/rates.json on
// the corporate site) so the boutique board shows the same numbers the main
// site publishes — one place to update rates. Cached at the edge for 10 minutes.

const SOURCE = process.env.RATES_SOURCE_URL || 'https://westcoastcapitalmortgage.com/assets/rates.json'

const headers = {
  'content-type': 'application/json',
  'cache-control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600',
  'access-control-allow-origin': '*',
}

export default async () => {
  try {
    const res = await fetch(SOURCE, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error('upstream ' + res.status)
    const data = await res.json()
    const products = Array.isArray(data?.products)
      ? data.products
          .filter((p) => p && typeof p.name === 'string' && Number.isFinite(Number(p.rate)))
          .map((p) => ({ name: p.name, rate: Number(p.rate) }))
      : []
    return new Response(JSON.stringify({
      ok: true,
      effective: typeof data?.effective === 'string' ? data.effective : '',
      source: typeof data?.source === 'string' ? data.source : '',
      products,
    }), { status: 200, headers })
  } catch (e) {
    console.error('[rates] fetch failed:', e?.message)
    return new Response(JSON.stringify({ ok: false, error: 'rates_unavailable' }), { status: 502, headers: { ...headers, 'cache-control': 'no-store' } })
  }
}
