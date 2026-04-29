import { ethers } from 'ethers'

const NEYNAR_BULK_URL = 'https://api.neynar.com/v2/farcaster/user/bulk'
const SCORE_READER = '0xd3C43A38D1D3E47E9c420a733e439B03FAAdebA8'
const SCORE_ABI = ['function getScore(uint256 fid) view returns (uint24 score)']
const BASE_CHAIN_ID = 8453
const SCORE_RPC_URLS = [
  process.env.BASE_RPC_URL || process.env.VITE_BASE_RPC_URL || 'https://mainnet.base.org',
  'https://base-rpc.publicnode.com',
  'https://base.llamarpc.com'
].filter(Boolean)

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function labelForScore(score) {
  if (score >= 0.9) return 'Elite'
  if (score >= 0.7) return 'Veteran'
  if (score >= 0.5) return 'Active'
  if (score >= 0.3) return 'Regular'
  if (score >= 0.1) return 'Emerging'
  return 'Newcomer'
}

function scorePayload({ fid, score, rawScore, source, user = null }) {
  return {
    source,
    fid: Number(user?.fid || fid),
    username: user?.username || '',
    displayName: user?.display_name || user?.displayName || user?.username || `FID ${fid}`,
    pfpUrl: user?.pfp_url || user?.pfpUrl || '',
    score,
    rawScore,
    scoreLabel: labelForScore(score),
    followerCount: Number(user?.follower_count || 0),
    followingCount: Number(user?.following_count || 0),
    activeStatus: user?.active_status || '',
    verifiedAddresses: user?.verified_addresses || {}
  }
}

async function readOnchainScore(fid) {
  const errors = []
  for (const rpcUrl of SCORE_RPC_URLS) {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl, BASE_CHAIN_ID)
      const contract = new ethers.Contract(SCORE_READER, SCORE_ABI, provider)
      const raw = await contract.getScore(BigInt(fid))
      const rawScore = Number(raw)
      return scorePayload({
        fid,
        score: Math.max(0, Math.min(1, rawScore / 1_000_000)),
        rawScore,
        source: 'onchain-base'
      })
    } catch (err) {
      errors.push(`${rpcUrl}: ${err?.shortMessage || err?.message || 'RPC failed'}`)
    }
  }
  throw new Error(errors.join(' | ') || 'Onchain score unavailable')
}

async function readNeynarApiScore(fid, apiKey) {
  const url = `${NEYNAR_BULK_URL}?fids=${encodeURIComponent(fid)}`
  const upstream = await fetch(url, {
    headers: {
      accept: 'application/json',
      'x-api-key': apiKey
    }
  })

  const payload = await upstream.json().catch(() => ({}))
  if (!upstream.ok) {
    throw new Error(payload?.message || payload?.error || 'Neynar API request failed')
  }

  const user = Array.isArray(payload?.users) ? payload.users[0] : null
  if (!user) throw new Error(`No Farcaster user found for FID ${fid}`)

  const rawScore = Number(user?.experimental?.neynar_user_score ?? 0)
  const score = Math.max(0, Math.min(1, rawScore))
  return scorePayload({ fid, score, rawScore, source: 'neynar-api', user })
}

export default async function handler(req, res) {
  setCors(res)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const fid = String(req.query?.fid || '').replace(/\D/g, '')
  if (!fid || BigInt(fid) <= 0n) {
    res.status(400).json({ error: 'Valid fid is required' })
    return
  }

  const apiKey = process.env.NEYNAR_API_KEY
  if (apiKey) {
    try {
      res.status(200).json(await readNeynarApiScore(fid, apiKey))
      return
    } catch (err) {
      // Fall through to the onchain reader. This keeps the Mini App working even
      // if the Neynar key is missing, expired, or the API has a transient issue.
      console.warn('Neynar API failed, falling back to onchain score:', err?.message || err)
    }
  }

  try {
    const payload = await readOnchainScore(fid)
    res.status(200).json(payload)
  } catch (err) {
    res.status(503).json({ error: err?.message || 'Failed to fetch Neynar score' })
  }
}
