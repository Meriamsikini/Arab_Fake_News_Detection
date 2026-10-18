// Les appels /api/* du navigateur sont relayés vers l'API FastAPI (évite les problèmes de CORS).
const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};
export default nextConfig;
