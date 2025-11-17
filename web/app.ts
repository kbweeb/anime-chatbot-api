const apiInput = document.getElementById('api') as HTMLInputElement
const msgInput = document.getElementById('msg') as HTMLInputElement
const sendBtn = document.getElementById('send') as HTMLButtonElement
const out = document.getElementById('out') as HTMLPreElement

function log(line: string) {
  out.textContent = `${out.textContent ? out.textContent + "\n" : ""}${line}`
}

// Prefill deploy URL
apiInput.value = apiInput.value || 'https://anime-chatbot-api.vercel.app'

sendBtn.onclick = async () => {
  const base = apiInput.value.trim()
  const msg = msgInput.value.trim()
  if (!msg) return alert('Type a message')
  try {
    log(`> ${msg}`)
    const res = await fetch(`${base.replace(/\/$/, '')}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg }),
    })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    const json = await res.json()
    log(`< ${json.reply}`)
  } catch (e: any) {
    log(`! ${e.message || e}`)
  }
}
