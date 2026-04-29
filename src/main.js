import { sdk } from '@farcaster/miniapp-sdk'
import { ethers } from 'ethers'
import './styles.css'

const SCORE_READER = '0xd3C43A38D1D3E47E9c420a733e439B03FAAdebA8'
const BASE_CHAIN_ID = 8453
const BASE_CHAIN_HEX = '0x2105'
const BASE_RPC_URL = import.meta.env.VITE_BASE_RPC_URL || 'https://base-rpc.publicnode.com'
const SCORE_RPC_URLS = Array.from(new Set([
  BASE_RPC_URL,
  'https://mainnet.base.org',
  'https://base.llamarpc.com'
].filter(Boolean)))
const GM_DATA = '0x676d'
const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin + window.location.pathname

const ABI = [
  'function getScore(uint256 fid) view returns (uint24 score)'
]

const state = {
  context: null,
  fid: '',
  score: null,
  wallet: '',
  loading: false,
  status: 'Ready',
  errors: [],
  activeTab: 'score'
}

window.__appErrors = []
window.addEventListener('error', (event) => window.__appErrors.push(event.error?.message || event.message || String(event)))
window.addEventListener('unhandledrejection', (event) => window.__appErrors.push(event.reason?.message || String(event.reason)))

const qs = (sel) => document.querySelector(sel)
const short = (value) => value ? `${value.slice(0, 6)}…${value.slice(-4)}` : 'Not connected'
const pct = (score) => Math.max(0, Math.min(100, Math.round((score?.normalized || 0) * 100)))

function badge(score) {
  if (!score || score.raw === 0) return ['No score', 'muted']
  if (score.normalized >= 0.8) return ['High trust', 'good']
  if (score.normalized >= 0.55) return ['Normal', 'ok']
  return ['Limited', 'warn']
}

function history() {
  try { return JSON.parse(localStorage.getItem('checkin-history') || '[]') } catch { return [] }
}

function saveHistory(item) {
  const next = [item, ...history()].slice(0, 8)
  localStorage.setItem('checkin-history', JSON.stringify(next))
}

function renderScorePanel(label, tone) {
  return `
    <section class="panel-view active" data-view="score">
      <div class="score-orb">
        <div class="score-ring" style="--p:${pct(state.score)}">
          <span>${state.score ? (state.score.normalized || 0).toFixed(3) : '—'}</span>
          <small>Neynar score</small>
        </div>
      </div>

      <div class="score-meta modern">
        <span class="badge ${tone}">${label}</span>
        <span>${state.score?.source === 'neynar-api' ? 'Neynar API' : 'Onchain Base'} · Raw ${state.score?.raw ?? '—'} / 1,000,000</span>
      </div>

      <div class="form-card score-only">
        <label>Farcaster FID</label>
        <div class="input-row">
          <input id="fidInput" inputmode="numeric" value="${state.fid}" placeholder="e.g. 3" aria-label="Farcaster FID" />
          <button id="scoreBtn" ${state.loading ? 'disabled' : ''}>${state.loading ? 'Checking…' : 'Check score'}</button>
        </div>
        <p class="field-help">Enter a Farcaster FID. Uses the server Neynar API when configured, with onchain Base fallback.</p>
      </div>

      <div class="info-strip">
        <b>Farcaster score</b>
        <span>Uses Neynar API securely via backend, then falls back to Base onchain score.</span>
      </div>
    </section>`
}

function renderCheckinPanel() {
  return `
    <section class="panel-view active" data-view="checkin">
      <div class="checkin-hero-mini">
        <div>
          <span class="eyebrow">GM onchain</span>
          <h2>GM on Base</h2>
          <p>Send a zero-value GM transaction to yourself on Base. No receiver field, just a pure onchain proof.</p>
        </div>
        <div class="fee-chip">Gas only</div>
      </div>

      <div class="wallet-card">
        <span>Wallet</span>
        <b>${short(state.wallet)}</b>
      </div>

      <div class="form-card gm-card">
        <div class="gm-preview">
          <span>Message</span>
          <b>gm</b>
          <small>Transaction data: ${GM_DATA}</small>
        </div>
        <div class="actions sticky-actions">
          <button id="connectBtn" class="secondary">${state.wallet ? 'Wallet connected' : 'Connect wallet'}</button>
          <button id="checkinBtn">${state.wallet ? 'Send GM' : 'Connect & GM'}</button>
        </div>
      </div>

      <div class="history-card compact">
        <div class="section-title row-title"><span>Recent GM tx</span><small>${history().length} tx</small></div>
        <div class="history-list">
          ${history().length ? history().map(item => `<a class="tx" href="https://basescan.org/tx/${item.hash}" target="_blank"><span>${new Date(item.time).toLocaleString()}</span><b>${short(item.hash)}</b></a>`).join('') : '<p class="empty">No GM transactions yet.</p>'}
        </div>
      </div>
    </section>`
}

function render() {
  const [label, tone] = badge(state.score)
  const scoreProfile = state.score?.profile || null
  const userName = scoreProfile?.displayName || state.context?.user?.displayName || state.context?.user?.username || 'Farcaster user'
  const userMeta = scoreProfile?.username ? `@${scoreProfile.username} · FID ${scoreProfile.fid}` : (state.context?.user?.fid ? `FID ${state.context.user.fid}` : 'Open in Farcaster for auto FID')
  const avatarUrl = scoreProfile?.pfpUrl || state.context?.user?.pfpUrl || ''
  qs('#app').innerHTML = `
    <main class="app-shell">
      <header class="mini-header">
        <div class="brand-dot"><img src="/neynar-app-logo.png" alt="" /></div>
        <div>
          <h1>Neynar Score</h1>
          <p>Farcaster trust score</p>
        </div>
        <button class="icon-btn" id="shareBtn" aria-label="Share">↗</button>
      </header>

      <section class="profile-card">
        <div class="avatar">${avatarUrl ? `<img src="${avatarUrl}" alt=""/>` : '⌁'}</div>
        <div class="profile-copy">
          <span>${userName}</span>
          <b>${userMeta}</b>
        </div>
        <div class="network-pill">${state.score?.source === 'neynar-api' ? 'API' : 'Base'}</div>
      </section>

      <nav class="tabbar" aria-label="Primary">
        <button class="tab ${state.activeTab === 'score' ? 'active' : ''}" id="tabScore"><span>⌕</span>Score</button>
        <button class="tab ${state.activeTab === 'checkin' ? 'active' : ''}" id="tabCheckin"><span>✓</span>Check-in</button>
      </nav>

      <section class="hero-card">
        <span class="eyebrow">Neynar · Farcaster · Base</span>
        <h2>Check trust. Prove activity.</h2>
        <p>Score lookup and lightweight Base check-in in one clean Mini App flow.</p>
      </section>

      <section class="content-card">
        ${state.activeTab === 'score' ? renderScorePanel(label, tone) : renderCheckinPanel()}
      </section>

      ${state.status && state.status !== 'Ready' ? `<div class="toast">${state.status}</div>` : ''}
    </main>`

  qs('#tabScore').addEventListener('click', () => { state.activeTab = 'score'; state.status = 'Ready'; render() })
  qs('#tabCheckin').addEventListener('click', () => { state.activeTab = 'checkin'; state.status = 'Ready'; render(); autoConnectWallet() })
  qs('#shareBtn').addEventListener('click', shareApp)

  if (state.activeTab === 'score') {
    qs('#fidInput').addEventListener('input', (e) => { state.fid = e.target.value.replace(/\D/g, '') })
    qs('#fidInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') checkScoreByFid() })
    qs('#scoreBtn').addEventListener('click', checkScoreByFid)
  } else {
    qs('#connectBtn').addEventListener('click', connectWallet)
    qs('#checkinBtn').addEventListener('click', checkIn)
  }
}

function renderStatusOnly() {
  const existing = qs('.toast')
  if (!state.status || state.status === 'Ready') {
    existing?.remove()
    return
  }
  if (existing) {
    existing.textContent = state.status
    return
  }
  const app = qs('.app-shell')
  if (!app) return render()
  const toast = document.createElement('div')
  toast.className = 'toast'
  toast.textContent = state.status
  app.appendChild(toast)
}

function setStatus(message) {
  state.status = message
  renderStatusOnly()
}

function setLoading(value, message) {
  state.loading = value
  if (message) state.status = message
  const btn = qs('#scoreBtn')
  if (btn) {
    btn.disabled = value
    btn.textContent = value ? 'Checking…' : 'Check score'
  }
  renderStatusOnly()
}

async function readScoreFromRpc(fid, rpcUrl) {
  const provider = new ethers.JsonRpcProvider(rpcUrl, BASE_CHAIN_ID)
  const contract = new ethers.Contract(SCORE_READER, ABI, provider)
  return contract['getScore(uint256)'](BigInt(fid))
}

function cleanFid(value) {
  return String(value || '').replace(/\D/g, '')
}

async function readScoreFromNeynarApi(fid) {
  const response = await fetch(`/api/neynar-score?fid=${encodeURIComponent(fid)}`, {
    headers: { accept: 'application/json' }
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.error || 'Neynar API unavailable')

  const normalized = Math.max(0, Math.min(1, Number(payload.score || 0)))
  return {
    raw: Math.round(normalized * 1_000_000),
    normalized,
    type: 'fid',
    source: payload.source || 'neynar-api',
    value: fid,
    profile: payload
  }
}

async function checkScoreByFid() {
  const fid = cleanFid(state.fid)
  if (!fid || BigInt(fid) <= 0n) return setStatus('Enter a valid Farcaster FID first')
  state.fid = fid
  setLoading(true, `Reading Neynar score for FID ${fid}…`)

  const errors = []

  try {
    state.score = await readScoreFromNeynarApi(fid)
    const sourceLabel = state.score.source === 'neynar-api' ? 'Neynar API' : 'Onchain'
    state.loading = false
    state.status = `${sourceLabel} score loaded for FID ${fid}`
    render()
    return
  } catch (err) {
    errors.push(`Neynar API: ${err?.message || 'unavailable'}`)
  }

  for (const rpcUrl of SCORE_RPC_URLS) {
    try {
      const raw = await readScoreFromRpc(fid, rpcUrl)
      const rawNumber = Number(raw)
      state.score = { raw: rawNumber, normalized: rawNumber / 1_000_000, type: 'fid', source: 'onchain-base', value: fid }
      state.loading = false
      state.status = rawNumber > 0 ? `Onchain score loaded for FID ${fid}` : `No Neynar score found for FID ${fid}`
      render()
      return
    } catch (err) {
      errors.push(`${rpcUrl}: ${err?.shortMessage || err?.message || 'RPC failed'}`)
    }
  }

  state.score = null
  state.errors = errors
  state.loading = false
  state.status = 'Could not read Neynar score. API and RPC unavailable, try again.'
  render()
}

async function getWalletProvider() {
  try {
    if (sdk?.wallet?.getEthereumProvider) {
      const provider = await sdk.wallet.getEthereumProvider()
      if (provider?.request) return provider
    }
  } catch {}
  if (window.ethereum?.request) return window.ethereum
  return null
}

async function ensureBase(provider) {
  const current = await provider.request({ method: 'eth_chainId' }).catch(() => null)
  if (current === BASE_CHAIN_HEX) return
  try {
    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: BASE_CHAIN_HEX }] })
  } catch (err) {
    if (err?.code !== 4902) throw err
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: BASE_CHAIN_HEX,
        chainName: 'Base',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: [BASE_RPC_URL],
        blockExplorerUrls: ['https://basescan.org']
      }]
    })
  }
}

async function connectWallet() {
  setStatus('Connecting wallet…')
  const provider = await getWalletProvider()
  if (!provider) return setStatus('No wallet provider. Open inside Farcaster or install MetaMask.')
  try {
    await ensureBase(provider)
    const accounts = await provider.request({ method: 'eth_requestAccounts' })
    state.wallet = accounts?.[0] || ''
    render()
    setStatus(`Connected ${short(state.wallet)}`)
    return state.wallet
  } catch (err) {
    setStatus(err?.message || 'Wallet connection failed')
    return ''
  }
}

async function autoConnectWallet() {
  if (state.wallet) return state.wallet
  const provider = await getWalletProvider()
  if (!provider) return ''
  try {
    await ensureBase(provider)
    let accounts = await provider.request({ method: 'eth_accounts' }).catch(() => [])
    if (!accounts?.[0]) accounts = await provider.request({ method: 'eth_requestAccounts' })
    state.wallet = accounts?.[0] || ''
    render()
    if (state.wallet) setStatus(`Wallet ready ${short(state.wallet)}`)
    return state.wallet
  } catch (err) {
    setStatus(err?.shortMessage || err?.message || 'Wallet connection needed')
    return ''
  }
}

async function checkIn() {
  const provider = await getWalletProvider()
  if (!provider) return setStatus('No wallet provider. Open inside Farcaster or install MetaMask.')
  try {
    setStatus('Preparing GM on Base…')
    await ensureBase(provider)
    const from = state.wallet || await autoConnectWallet()
    if (!from) return setStatus('Wallet not connected')
    state.wallet = from
    const hash = await provider.request({
      method: 'eth_sendTransaction',
      params: [{ from, to: from, value: '0x0', data: GM_DATA }]
    })
    saveHistory({ hash, from, to: from, message: 'gm', value: '0', time: Date.now(), fid: state.fid || state.context?.user?.fid || null })
    render()
    setStatus(`GM onchain: ${short(hash)}`)
  } catch (err) {
    setStatus(err?.shortMessage || err?.message || 'GM transaction failed')
  }
}

async function shareApp() {
  const scoreText = state.score ? ` My Neynar score is ${state.score.normalized.toFixed(3)}.` : ''
  const text = `Check your Neynar Farcaster score on Base.${scoreText}`
  try {
    await sdk.actions.composeCast({ text, embeds: [APP_URL] })
  } catch {
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(`${text}\n${APP_URL}`)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

async function boot() {
  render()
  try {
    state.context = await sdk.context
    if (state.context?.user?.fid) state.fid = String(state.context.user.fid)
  } catch {}
  try { await sdk.actions.ready() } catch {}
  render()
  if (state.fid) checkScoreByFid()
}

boot()
