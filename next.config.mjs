/** @type {import('next').NextConfig} */
const isProd = process.env.NEXT_PUBLIC_BASE_PATH;

const nextConfig = {
  output: 'export',
  basePath: isProd || '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
