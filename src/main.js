import { sdk } from '@farcaster/miniapp-sdk'
import { ethers } from 'ethers'
import './styles.css'

const SCORE_READER = '0xd3C43A38D1D3E47E9c420a733e439B03FAAdebA8'
const BASE_CHAIN_ID = 8453
const BASE_CHAIN_HEX = '0x2105'
const BASE_RPC_URL = import.meta.env.VITE_BASE_RPC_URL || 'https://base-rpc.publicnode.com'
const DEFAULT_FEE_ETH = import.meta.env.VITE_CHECKIN_FEE_ETH || '0.000001'
const DEFAULT_RECIPIENT = import.meta.env.VITE_CHECKIN_RECIPIENT || ''
const APP_URL = import.meta.env.VITE_APP_URL || 'https://gyoomei.github.io/neynar-score-checkin/'

const ABI = [
  'function getScore(uint256 fid) view returns (uint24 score)',
  'function getScore(address verifier) view returns (uint24 score)'
]

const state = {
  context: null,
  fid: '',
  address: '',
  score: null,
  wallet: '',
  recipient: DEFAULT_RECIPIENT,
  feeEth: DEFAULT_FEE_ETH,
  loading: false,
  status: 'Ready',
  errors: []
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

function render() {
  const [label, tone] = badge(state.score)
  qs('#app').innerHTML = `
    <main class="shell">
      <section class="hero card">
        <div class="topline">
          <span class="pill">Base · Farcaster · Neynar</span>
          <button class="ghost" id="shareBtn">Share</button>
        </div>
        <h1>Neynar Score Check-in</h1>
        <p class="sub">Check any Farcaster user's Neynar quality score directly from Base, then check in with an ultra-low onchain fee.</p>
        <div class="userbar">
          <div class="avatar">${state.context?.user?.pfpUrl ? `<img src="${state.context.user.pfpUrl}" alt=""/>` : '⌁'}</div>
          <div>
            <strong>${state.context?.user?.displayName || state.context?.user?.username || 'Browser preview'}</strong>
            <span>${state.context?.user?.fid ? `FID ${state.context.user.fid}` : 'Open in Farcaster for auto FID'}</span>
          </div>
        </div>
      </section>

      <section class="grid">
        <div class="card score-card">
          <div class="section-title">Score checker</div>
          <label>Farcaster FID</label>
          <div class="input-row">
            <input id="fidInput" inputmode="numeric" value="${state.fid}" placeholder="e.g. 3" />
            <button id="scoreBtn">${state.loading ? 'Checking…' : 'Check'}</button>
          </div>
          <label>Or wallet address</label>
          <div class="input-row">
            <input id="addrInput" value="${state.address}" placeholder="0x..." />
            <button id="walletScoreBtn">By wallet</button>
          </div>

          <div class="meter-wrap">
            <div class="score-big">${state.score ? (state.score.normalized || 0).toFixed(3) : '—'}</div>
            <div class="meter"><span style="width:${pct(state.score)}%"></span></div>
            <div class="score-meta">
              <span class="badge ${tone}">${label}</span>
              <span>Raw: ${state.score?.raw ?? '—'} / 1,000,000</span>
            </div>
          </div>
          <p class="note">No API key needed: this reads Neynar's onchain score reader contract on Base.</p>
        </div>

        <div class="card checkin-card">
          <div class="section-title">Ultra-low fee check-in</div>
          <div class="wallet-box">
            <span>Wallet</span>
            <b>${short(state.wallet)}</b>
          </div>
          <label>Receiver address</label>
          <input id="recipientInput" value="${state.recipient}" placeholder="0x receiver for check-in fee" />
          <label>Fee ETH on Base</label>
          <input id="feeInput" value="${state.feeEth}" inputmode="decimal" />
          <div class="actions">
            <button id="connectBtn" class="secondary">Connect</button>
            <button id="checkinBtn">Check in</button>
          </div>
          <p class="note">Default fee is ${DEFAULT_FEE_ETH} ETH. Use Base mainnet for very low gas. Set <code>VITE_CHECKIN_RECIPIENT</code> before production deploy.</p>
        </div>
      </section>

      <section class="card history-card">
        <div class="section-title">Recent check-ins</div>
        <div class="history-list">
          ${history().length ? history().map(item => `<a class="tx" href="https://basescan.org/tx/${item.hash}" target="_blank"><span>${new Date(item.time).toLocaleString()}</span><b>${short(item.hash)}</b></a>`).join('') : '<p class="empty">No check-ins yet.</p>'}
        </div>
      </section>

      <div class="toast">${state.status}</div>
    </main>`

  qs('#fidInput').addEventListener('input', (e) => { state.fid = e.target.value.trim() })
  qs('#addrInput').addEventListener('input', (e) => { state.address = e.target.value.trim() })
  qs('#recipientInput').addEventListener('input', (e) => { state.recipient = e.target.value.trim() })
  qs('#feeInput').addEventListener('input', (e) => { state.feeEth = e.target.value.trim() })
  qs('#scoreBtn').addEventListener('click', checkScoreByFid)
  qs('#walletScoreBtn').addEventListener('click', checkScoreByAddress)
  qs('#connectBtn').addEventListener('click', connectWallet)
  qs('#checkinBtn').addEventListener('click', checkIn)
  qs('#shareBtn').addEventListener('click', shareApp)
}

function setStatus(message) { state.status = message; render() }
function setLoading(value, message) { state.loading = value; if (message) state.status = message; render() }

async function readContract() {
  const provider = new ethers.JsonRpcProvider(BASE_RPC_URL, BASE_CHAIN_ID)
  return new ethers.Contract(SCORE_READER, ABI, provider)
}

async function checkScoreByFid() {
  if (!state.fid || Number.isNaN(Number(state.fid))) return setStatus('Enter a valid FID first')
  setLoading(true, 'Reading Neynar score by FID…')
  try {
    const contract = await readContract()
    const raw = await contract['getScore(uint256)'](BigInt(state.fid))
    state.score = { raw: Number(raw), normalized: Number(raw) / 1_000_000, type: 'fid', value: state.fid }
    setLoading(false, `Score loaded for FID ${state.fid}`)
  } catch (err) {
    setLoading(false, err?.message || 'Failed to read score')
  }
}

async function checkScoreByAddress() {
  if (!ethers.isAddress(state.address)) return setStatus('Enter a valid wallet address')
  setLoading(true, 'Reading Neynar score by wallet…')
  try {
    const contract = await readContract()
    const raw = await contract['getScore(address)'](state.address)
    state.score = { raw: Number(raw), normalized: Number(raw) / 1_000_000, type: 'address', value: state.address }
    setLoading(false, `Score loaded for ${short(state.address)}`)
  } catch (err) {
    setLoading(false, err?.message || 'Failed to read score')
  }
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
    if (state.wallet && !state.address) state.address = state.wallet
    setStatus(`Connected ${short(state.wallet)}`)
  } catch (err) {
    setStatus(err?.message || 'Wallet connection failed')
  }
}

async function checkIn() {
  if (!ethers.isAddress(state.recipient)) return setStatus('Set a valid receiver address first')
  if (!state.feeEth || Number(state.feeEth) <= 0) return setStatus('Set a valid tiny fee')
  const provider = await getWalletProvider()
  if (!provider) return setStatus('No wallet provider. Open inside Farcaster or install MetaMask.')
  try {
    setStatus('Preparing Base check-in…')
    await ensureBase(provider)
    const accounts = await provider.request({ method: 'eth_requestAccounts' })
    const from = accounts?.[0]
    if (!from) return setStatus('Wallet not connected')
    state.wallet = from
    const value = ethers.toBeHex(ethers.parseEther(state.feeEth))
    const hash = await provider.request({
      method: 'eth_sendTransaction',
      params: [{ from, to: state.recipient, value }]
    })
    saveHistory({ hash, from, to: state.recipient, feeEth: state.feeEth, time: Date.now(), fid: state.fid || state.context?.user?.fid || null })
    setStatus(`Checked in: ${short(hash)}`)
  } catch (err) {
    setStatus(err?.shortMessage || err?.message || 'Check-in transaction failed')
  }
}

async function shareApp() {
  const scoreText = state.score ? ` My Neynar score is ${state.score.normalized.toFixed(3)}.` : ''
  const text = `Check your Farcaster Neynar score and check in on Base.${scoreText}`
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
