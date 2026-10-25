import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      // Keep the résumé link from the previous static site working.
      {
        source: "/image/Vishwaa_Reddy_Updated_Resume.pdf",
        destination: "/documents/vishwaa-reddy-resume.pdf",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
