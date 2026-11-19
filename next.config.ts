import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: "E:\\mapout",
  },
  serverExternalPackages: ["@getbrevo/brevo", "imagekit", "jspdf", "nodemailer"],
};

export default nextConfig;
