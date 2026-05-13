import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pg'],
  experimental: {
    serverMinification: false,
  },
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.punjabnewsline.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-67d1ab583258479d9bb02142f0fb4d11.r2.dev',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'www.punjabnewsline.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/vi/**',
      },
    ],
    localPatterns: [
      {
        pathname: '/r2-images/**',
        search: '',
      },
      {
        pathname: '/images/**',
        search: '',
      },
    ],
  },
  async redirects() {
    return [
      // Legacy ASP.NET URLs
      { source: '/default.aspx', destination: '/', permanent: true },
      { source: '/home.aspx', destination: '/', permanent: true },
      // { source: '/news/details.aspx', destination: '/news', permanent: true },
      { source: '/index.aspx', destination: '/', permanent: true },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/r2-images/:path*',
        destination: `${process.env.NEXT_PUBLIC_R2_URL || 'https://pub-67d1ab583258479d9bb02142f0fb4d11.r2.dev'}/images/:path*`,
      },
    ]
  },
}

export default nextConfig
