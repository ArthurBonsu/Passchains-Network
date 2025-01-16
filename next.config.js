/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Improve build performance
  swcMinify: true,
  optimizeFonts: true,
  
  // Source map and debugging options
  productionBrowserSourceMaps: false, // Changed to false for better performance

  // Improved logging and error reporting
  typescript: {
    ignoreBuildErrors: false, // Show all TypeScript errors
  },

  webpack: (config, { isServer }) => {
    // Optimize source mapping
    config.devtool = isServer ? false : 'cheap-source-map';

    // Fallback configurations for browser compatibility
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        os: require.resolve('os-browserify/browser'),
        zlib: require.resolve('browserify-zlib'),
      };
    }

    // Code splitting and optimization
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 250000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        automaticNameDelimiter: '~',
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      },
    };

    // Reduce build noise
    config.stats = 'minimal';

    return config;
  },

  // Experimental performance improvements
  experimental: {
    optimizePackageImports: ['react', 'react-dom', 'next'],
    optimisticClientCache: true,
    // Disable server components for now
    serverComponents: false,
  },

  // Performance monitoring
  onDemandEntries: {
    maxInactiveAge: 30 * 1000, // Reduced from 60 to 30 seconds
    pagesBufferLength: 2, // Reduced from 5 to 2
  },

  // Image optimization
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: [], // Add allowed image domains if needed
    formats: ['image/avif', 'image/webp'],
  },

  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },

  // Bundle analyzer configuration
  ...(process.env.ANALYZE && {
    webpack: (config, { isServer }) => {
      const { BundleAnalyzerPlugin } = require('@next/bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerPort: isServer ? 8888 : 8889,
          openAnalyzer: true,
        })
      );
      return config;
    },
  }),
};

module.exports = nextConfig;