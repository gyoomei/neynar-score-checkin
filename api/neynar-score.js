const NEYNAR_BULK_URL = 'https://api.neynar.com/v2/farcaster/user/bulk'

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

  const apiKey = process.env.NEYNAR_API_KEY
  if (!apiKey) {
    res.status(503).json({ error: 'NEYNAR_API_KEY is not configured' })
    return
  }

  const fid = String(req.query?.fid || '').replace(/\D/g, '')
  if (!fid || BigInt(fid) <= 0n) {
    res.status(400).json({ error: 'Valid fid is required' })
    return
  }

  try {
    const url = `${NEYNAR_BULK_URL}?fids=${encodeURIComponent(fid)}`
    const upstream = await fetch(url, {
      headers: {
        accept: 'application/json',
        'x-api-key': apiKey
      }
    })

    const payload = await upstream.json().catch(() => ({}))
    if (!upstream.ok) {
      res.status(upstream.status).json({
        error: payload?.message || payload?.error || 'Neynar API request failed'
      })
      return
    }

    const user = Array.isArray(payload?.users) ? payload.users[0] : null
    if (!user) {
      res.status(404).json({ error: `No Farcaster user found for FID ${fid}` })
      return
    }

    const rawScore = Number(user?.experimental?.neynar_user_score ?? 0)
    const score = Math.max(0, Math.min(1, rawScore))

    res.status(200).json({
      source: 'neynar-api',
      fid: Number(user.fid || fid),
      username: user.username || '',
      displayName: user.display_name || user.displayName || user.username || `FID ${fid}`,
      pfpUrl: user.pfp_url || user.pfpUrl || '',
      score,
      rawScore,
      scoreLabel: labelForScore(score),
      followerCount: Number(user.follower_count || 0),
      followingCount: Number(user.following_count || 0),
      activeStatus: user.active_status || '',
      verifiedAddresses: user.verified_addresses || {}
    })
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Failed to fetch Neynar score' })
  }
}
