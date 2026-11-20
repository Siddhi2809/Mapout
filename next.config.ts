import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@getbrevo/brevo", "imagekit", "jspdf", "nodemailer"],
};

export default nextConfig;
