# Neynar Score Check-in

Farcaster Mini App untuk cek Neynar user quality score pengguna Farcaster dan melakukan check-in onchain di Base dengan fee sangat rendah.

## Fitur

- Baca Neynar score onchain dari Base tanpa Neynar API key.
- Auto-detect FID saat dibuka di Farcaster Mini App.
- Manual cek score by FID atau by wallet address.
- Check-in via Farcaster embedded wallet / MetaMask fallback.
- Fee default sangat rendah: `0.000001 ETH` di Base.
- Riwayat check-in lokal + link Basescan.
- `fc:miniapp` embed metadata siap share.

## Kontrak Neynar score

Base mainnet score reader:

```text
0xd3C43A38D1D3E47E9c420a733e439B03FAAdebA8
```

Score raw diskalakan `1_000_000`:

```text
950000 = 0.95
550000 = 0.55
0 = no score available
```

## Setup lokal

```bash
npm install
cp .env.example .env
npm run dev
```

## Production env

```env
VITE_APP_URL=https://domain-kamu/
VITE_CHECKIN_RECIPIENT=0xReceiverAddress
VITE_CHECKIN_FEE_ETH=0.000001
VITE_BASE_RPC_URL=https://base-rpc.publicnode.com
```

`VITE_CHECKIN_RECIPIENT` wajib diisi sebelum production, karena check-in fee akan dikirim ke address ini.

## Deploy ke Vercel

Project ini sudah punya `vercel.json`. Vercel harus build dari domain root, jadi `vite.config.js` otomatis memakai `base: '/'` saat env `VERCEL=1` aktif. Ini mencegah blank page karena asset path `/neynar-score-checkin/assets/...` tidak ada di Vercel.

Setting Vercel:

```text
Framework Preset: Other / Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm ci
```

Optional env di Vercel:

```env
VITE_APP_URL=https://domain-vercel-kamu.vercel.app/
VITE_CHECKIN_RECIPIENT=0xReceiverAddress
VITE_CHECKIN_FEE_ETH=0.000001
VITE_BASE_RPC_URL=https://base-rpc.publicnode.com
```

## Deploy GitHub Pages

Repo ini juga tetap support GitHub Pages dengan Vite `base: '/neynar-score-checkin/'` saat bukan build Vercel.

```bash
npm run build
```

Untuk GitHub Pages, aktifkan Actions workflow atau deploy folder `dist`.

## Catatan Farcaster

Manifest di `public/.well-known/farcaster.json` masih perlu `accountAssociation` valid dari Farcaster developer portal agar app bisa diverifikasi penuh. Embed `fc:miniapp` sudah ada di `index.html`.
