/** @type {import('next').NextConfig} */
const nextConfig = {
  // node-ical pulls in luxon which uses BigInt in a way Webpack mishandles
  // during page-data collection. Loading it as an external server package
  // keeps it as a runtime require() and dodges the bundler entirely.
  experimental: {
    serverComponentsExternalPackages: ['node-ical'],
  },
  async redirects() {
    return [
      // Executive view config moved to /admin in Phase C of the admin section build.
      {
        source: '/settings/executive-view',
        destination: '/admin/executive-views',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
