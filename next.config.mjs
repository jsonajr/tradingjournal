/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Allow the app. subdomain to share cookies with the main domain
  // for Supabase auth sessions
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NEXT_PUBLIC_APP_URL ?? "*",
          },
        ],
      },
    ];
  },
};

export default nextConfig;