import { defineConfig } from 'vite'

const isVercel = Boolean(process.env.VERCEL) || process.env.DEPLOY_TARGET === 'vercel'

export default defineConfig({
  // GitHub Pages needs the repo subpath, but Vercel serves from domain root.
  // Wrong base path is the main cause of a blank page on Vercel because
  // /neynar-score-checkin/assets/... does not exist there.
  base: isVercel ? '/' : '/neynar-score-checkin/',
  build: {
    target: 'es2020'
  }
})
