import type { NextConfig } from 'next';

const isDocker = process.env.DOCKER_BUILD === 'true' || process.env.CI === 'true';

const nextConfig: NextConfig = {
  /* config options here */
  // Standalone output only in Docker/CI (Windows has symlink permission issues)
  ...(isDocker && { output: 'standalone' }),
};

export default nextConfig;
