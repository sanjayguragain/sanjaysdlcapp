/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  images: {
    // Allow GitHub user avatar images
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
