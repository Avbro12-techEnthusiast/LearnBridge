/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Next.js to bind to the port Render assigns via $PORT
  // Render sets PORT env var; Next.js reads it automatically with this config
  reactStrictMode: true,
  
  // Ensure Next.js listens on 0.0.0.0 (required by Render)
  // The PORT env var is handled by `next start -p $PORT` in package.json start script
};

module.exports = nextConfig;
