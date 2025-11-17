export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { message = '' } = req.body || {}

    const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY
    const baseUrl = process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1'
    const model = process.env.AI_MODEL || 'llama-3.2-70b-versatile'


    if (!apiKey) {
      return res.status(200).json({ reply: '(Mock) Hello from Anime Chatbot! Set AI_API_KEY on Vercel to enable real replies.' })
    }

    // Important: avoid leading slash when joining with baseUrl, or URL(base, "/path")
    // will drop the "/openai/v1" segment. Build the endpoint manually.
    const endpoint = `${String(baseUrl || '').replace(/\/$/, '')}/chat/completions`
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: String(message || '') }],
        temperature: 0.7,
        max_tokens: 256,
      }),
    })

    if (!r.ok) {
      const txt = await r.text()
      return res.status(200).json({ reply: `(Upstream error) ${r.status} ${r.statusText}: ${txt}` })
    }
    const data = await r.json()
    const reply = data?.choices?.[0]?.message?.content ?? ''
    return res.status(200).json({ reply })
  } catch (e) {
    return res.status(200).json({ reply: `Error: ${e?.message || e}` })
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
}
