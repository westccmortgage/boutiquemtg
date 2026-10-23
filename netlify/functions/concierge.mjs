// POST /.netlify/functions/concierge  (public)
//
// The Boutique AI concierge. The browser sends a short, PII-light transcript;
// this function adds the compliance system prompt, calls Claude with the API key
// kept server-side, and returns one assistant reply plus an optional
// "scenario summary" the contact form can carry to the loan officer.
//
// Env:
//   ANTHROPIC_API_KEY   required — without it the UI falls back to a human hand-off message
//   ANTHROPIC_MODEL     optional, default claude-opus-5-5
//   CONCIERGE_EFFORT    optional, default "low" (chat is latency-sensitive)
//
// Compliance: the model is instructed never to quote rates/APRs/payments as fact,
// never imply approval or eligibility, stay fair-lending safe, and route to a
// licensed loan officer. It is an educational assistant, not a loan originator.

import Anthropic from '@anthropic-ai/sdk'

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5-5'
const EFFORT = process.env.CONCIERGE_EFFORT || 'low'
const MAX_TURNS = 16
const MAX_CHARS = 1500

const SYSTEM_PROMPT = `You are the Boutique Concierge for boutiquemtg.com, the private-client mortgage practice of West Coast Capital Mortgage Inc. (mortgage broker, NMLS #2817729; licensed in California, Florida and Texas; office in Burbank, CA; founder Anatoliy Kanevsky, NMLS #2775380).

Your job: explain mortgage options in plain language, help the visitor organize their scenario, and route them to a licensed loan officer. Warm, concise, confident — a knowledgeable strategist talking to a smart client. No hype, no pressure.

What the practice offers (as a broker across wholesale lenders): Conventional, High-Balance Conforming, Jumbo (incl. interest-only and asset depletion), FHA, VA, Non-QM, Bank Statement (12–24 months), 1099, DSCR investor loans (LLC vesting OK), second home, condo financing, foreign national, cash-out and rate-and-term refinance, HELOC/second liens, temporary (2-1, 1-0) and permanent buydowns, buy-before-you-sell strategies. First call is free, no credit pull to start, replies within one business day.

Hard rules:
- You are an automated assistant, NOT a licensed loan originator. Never say you approve, pre-approve, qualify, deny, lock, or quote. Never state a specific interest rate, APR, payment, fee, or loan limit as a fact or offer. If asked for today's rate, say rates change daily and the loan officer will price the exact scenario; the site shows sample rates for illustration only.
- Use "may", "typically", "often", "subject to underwriting". Never guarantee an outcome or approval.
- Fair lending: never reference or ask about race, color, religion, national origin, sex, familial status, age, disability, or marital status. Do not ask for SSN, account numbers, or dates of birth; if offered, say you don't need them here.
- Stay on mortgage/real-estate-finance topics. Politely decline unrelated requests.
- Answer in the language the visitor writes in (English, Spanish, Russian, Chinese supported).
- Keep replies short: 60–160 words, short paragraphs or 2–4 bullets. Ask at most one clarifying question per turn. When the picture is clear enough (goal, state, approximate price/loan, income type, timeline), invite them to send the scenario through the form or call (310) 654-1577.
- After your reply, if you have learned at least two concrete facts about the scenario, append a final line exactly in this format for the system (it is stripped before display):
<<SUMMARY>> one compact sentence: goal · state/city · price or loan · down payment · income type · credit band · timeline · notable factors <</SUMMARY>>`

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...CORS } })

// Best-effort per-instance rate limit (the function is public).
const hits = new Map()
const WINDOW_MS = 60_000, MAX_HITS = 20
function tooMany(key) {
  const now = Date.now()
  const recent = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 2000) for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k)
  return recent.length > MAX_HITS
}

// Light PII scrubbing before anything leaves the function: SSNs and long digit runs.
const scrub = (s) => String(s).replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[redacted]').replace(/\b\d{9,}\b/g, '[redacted]')

function sanitizeMessages(input) {
  if (!Array.isArray(input)) return null
  const out = []
  for (const m of input.slice(-MAX_TURNS)) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) continue
    const text = scrub(typeof m.content === 'string' ? m.content : '').trim().slice(0, MAX_CHARS)
    if (!text) continue
    // Merge consecutive same-role turns so the transcript always alternates.
    if (out.length && out[out.length - 1].role === m.role) out[out.length - 1].content += '\n' + text
    else out.push({ role: m.role, content: text })
  }
  while (out.length && out[0].role !== 'user') out.shift()
  return out.length && out[out.length - 1].role === 'user' ? out : null
}

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 204, headers: CORS })
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)
  if (!process.env.ANTHROPIC_API_KEY) return json({ ok: false, error: 'concierge_not_configured' }, 503)

  const ip = req.headers.get('x-nf-client-connection-ip') || (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
  if (tooMany(ip)) return json({ ok: false, error: 'Too many messages. Give it a minute, or call (310) 654-1577.' }, 429)

  let body
  try { body = await req.json() } catch { return json({ ok: false, error: 'Invalid JSON' }, 400) }
  const messages = sanitizeMessages(body?.messages)
  if (!messages) return json({ ok: false, error: 'Send at least one user message.' }, 400)

  const lang = ['en', 'es', 'ru', 'zh'].includes(body?.lang) ? body.lang : 'en'
  const context = body?.context && typeof body.context === 'object' ? JSON.stringify(body.context).slice(0, 1200) : ''
  const system = SYSTEM_PROMPT
    + `\n\nVisitor UI language: ${lang}.`
    + (context ? `\nEstimator / page context (illustrative numbers the visitor is looking at, not quotes): ${context}` : '')

  const client = new Anthropic()
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system,
      messages,
      output_config: { effort: EFFORT },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    })

    if (response.stop_reason === 'refusal') {
      return json({ ok: true, reply: "I can't help with that one here. For anything about your mortgage, call the office at (310) 654-1577 and a licensed loan officer will take it from there.", summary: '' })
    }

    let text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim()
    let summary = ''
    const m = text.match(/<<SUMMARY>>([\s\S]*?)<<\/SUMMARY>>/)
    if (m) { summary = m[1].trim().slice(0, 600); text = text.replace(m[0], '').trim() }
    if (!text) return json({ ok: false, error: 'empty_reply' }, 502)

    return json({ ok: true, reply: text, summary, model: response.model })
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return json({ ok: false, error: 'The concierge is busy — try again in a moment.' }, 429)
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
      console.error('[concierge] credentials rejected:', err.status)
      return json({ ok: false, error: 'concierge_not_configured' }, 503)
    }
    if (err instanceof Anthropic.APIError) {
      console.error('[concierge] API error', err.status, err.message)
      return json({ ok: false, error: 'The concierge is temporarily unavailable.' }, 502)
    }
    console.error('[concierge] unexpected', err?.message)
    return json({ ok: false, error: 'The concierge is temporarily unavailable.' }, 500)
  }
}
