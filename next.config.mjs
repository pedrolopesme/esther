/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production' && process.env.BASE_PATH;

const nextConfig = {
  output: 'export',
  basePath: isProd ? process.env.BASE_PATH : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
