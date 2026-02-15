const { PHASE_DEVELOPMENT_SERVER } = require("next/constants")

/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  // Ensure Next doesn't incorrectly infer the monorepo/workspace root (can happen when
  // unrelated lockfiles exist above this repo), which can break tracing and dev ergonomics.
  outputFileTracingRoot: __dirname
}

module.exports = (phase) => {
  // Keep dev and prod build artifacts separate so running `next build` doesn't break `next dev`
  // by overwriting `.next/static/*` (causes 404s for layout.css/main-app.js/app-pages-internals.js).
  const distDir = phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next"

  return {
    ...baseConfig,
    distDir
  }
}
