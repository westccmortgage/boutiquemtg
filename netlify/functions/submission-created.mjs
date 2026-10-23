// Netlify Forms event function: runs on every verified form submission.
// https://docs.netlify.com/functions/trigger-on-events/
//
// Relays the lead into GR CRM (grcrm.com lead-inbound), the same system of
// record the other West Coast Capital Mortgage sites feed. The CRM dedupes by
// email/phone, routes the lead and arms automations; everything that is not a
// contact field is folded into the note so nothing is lost.
//
// Env:
//   BOUTIQUE_CRM_LEAD_TOKEN  per-source token from GR CRM → Lead sources (24 hex chars)
//   CRM_LEAD_URL             optional, default https://grcrm.com/.netlify/functions/lead-inbound
//
// Without a token the function logs and exits 200 — Netlify still stores the
// submission and emails the office, so a lead is never lost.

const CRM_LEAD_URL = process.env.CRM_LEAD_URL || 'https://grcrm.com/.netlify/functions/lead-inbound'

const NOTE_SKIP = new Set([
  'form-name', 'form_name', 'company', 'name', 'full_name', 'first_name', 'last_name', 'email', 'phone', 'message',
  'submission_id', 'site', 'language',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'gbraid', 'wbraid', 'fbclid',
  'landing_page', 'conversion_page', 'source_path', 'page_path', 'referrer', 'ip', 'user_agent',
])

const text = (v) => (v == null ? '' : String(v).trim())

function buildNote(data) {
  const answers = Object.entries(data)
    .filter(([k, v]) => !NOTE_SKIP.has(k) && text(v))
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${text(v)}`)
  const source = ['utm_source', 'utm_medium', 'utm_campaign'].map((k) => text(data[k])).filter(Boolean)
  let page = ''
  try { page = new URL(text(data.conversion_page) || text(data.landing_page) || '/', 'https://boutiquemtg.com').pathname } catch { /* ignore */ }
  return [
    'boutiquemtg.com — ' + (text(data['form-name']) || 'website form'),
    answers.join(' · '),
    [source.length && `Source: ${source.join(' / ')}`, page && `Page: ${page}`, text(data.gclid) && 'Google Ads click'].filter(Boolean).join(' · '),
    text(data.message),
  ].filter(Boolean).join('\n')
}

export default async (req) => {
  let payload
  try { ({ payload } = await req.json()) } catch { return new Response('bad request', { status: 400 }) }
  const data = payload?.data
  if (!data || typeof data !== 'object') return new Response('no data', { status: 400 })

  const token = process.env.BOUTIQUE_CRM_LEAD_TOKEN || process.env.WCCM_CRM_LEAD_TOKEN
  if (!token) {
    console.warn('[submission-created] no CRM token configured; submission kept in Netlify Forms only')
    return new Response('ok (no crm)', { status: 200 })
  }

  const body = {
    name: text(data.name),
    email: text(data.email),
    phone: text(data.phone),
    message: buildNote(data),
    source: 'boutiquemtg.com',
    loan_purpose: text(data.goal),
    loan_type: text(data.program_interest),
    tags: ['boutiquemtg', text(data.goal), text(data.state)].filter(Boolean).join(','),
  }

  try {
    const res = await fetch(CRM_LEAD_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-lead-token': token },
      body: JSON.stringify(body),
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      console.error('[submission-created] CRM returned', res.status)
      return new Response('crm error', { status: 502 })
    }
    return new Response('ok', { status: 200 })
  } catch (e) {
    console.error('[submission-created] relay failed:', e?.message)
    return new Response('relay failed', { status: 502 })
  }
}
