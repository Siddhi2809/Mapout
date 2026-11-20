import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@getbrevo/brevo", "imagekit", "jspdf", "nodemailer"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
