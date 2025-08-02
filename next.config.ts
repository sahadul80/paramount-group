import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        domains: [
          'i.pravatar.cc',
          'drive.google.com',
          'lh3.googleusercontent.com' // Google Drive thumbnails
        ],
      },
};

export default nextConfig;
