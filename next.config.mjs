/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["@tiptap/react"],
  },
  serverExternalPackages: ["@github/copilot-sdk"],
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
