// Minimal ChatGPT-like UI in vanilla JS
const els = {
  api: document.getElementById('api'),
  saveApi: document.getElementById('saveApi'),
  msg: document.getElementById('msg'),
  send: document.getElementById('send'),
  messages: document.getElementById('messages'),
  composer: document.getElementById('composer'),
}

const store = {
  get apiBase() { return localStorage.getItem('apiBase') || 'https://anime-chatbot-api.vercel.app' },
  set apiBase(v) { localStorage.setItem('apiBase', v) },
  get history() { try { return JSON.parse(localStorage.getItem('history')||'[]') } catch { return [] } },
  set history(v) { localStorage.setItem('history', JSON.stringify(v)) },
}

function sanitize(s){ return String(s==null?'':s) }

function renderMessages() {
  els.messages.innerHTML = ''
  for (const m of store.history) {
    const node = renderMsg(m.role, m.content)
    els.messages.appendChild(node)
  }
  els.messages.scrollTop = els.messages.scrollHeight
}

function renderMsg(role, content) {
  const tpl = document.getElementById('tpl-msg')
  const node = tpl.content.firstElementChild.cloneNode(true)
  node.classList.add(role)
  node.querySelector('.msg__bubble').textContent = sanitize(content)
  node.querySelector('.msg__avatar').title = role
  return node
}

function addMessage(role, content) {
  const entry = { role, content }
  const hist = store.history
  hist.push(entry)
  store.history = hist
  els.messages.appendChild(renderMsg(role, content))
  els.messages.scrollTop = els.messages.scrollHeight
}

function setBusy(b) {
  els.send.disabled = b
  els.composer.classList.toggle('busy', b)
}

function autoGrow(textarea) {
  textarea.style.height = 'auto'
  textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px'
}

// Init
els.api.value = store.apiBase
renderMessages()
autoGrow(els.msg)

els.saveApi.addEventListener('click', () => {
  const v = els.api.value.trim()
  if(!v) return alert('Enter API Base URL')
  store.apiBase = v
  alert('Saved')
})

els.msg.addEventListener('input', () => autoGrow(els.msg))

els.composer.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    els.send.click()
  }
})

els.composer.addEventListener('submit', async (e) => {
  e.preventDefault()
  const base = (els.api.value.trim() || store.apiBase).replace(/\/$/, '')
  const text = els.msg.value.trim()
  if (!base) return alert('Enter API Base URL')
  if (!text) return

  try {
    setBusy(true)
    addMessage('user', text)
    els.msg.value = ''
    autoGrow(els.msg)

    const res = await fetch(`${base}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    const data = await res.json()
    addMessage('assistant', data.reply ?? '(no reply)')
  } catch (err) {
    addMessage('assistant', `Error: ${err.message || err}`)
  } finally {
    setBusy(false)
  }
})
