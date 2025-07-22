import type { NextConfig } from "next";
import path from "path";
import {
  buildTimeFeatureFlags,
  buildTimeFeatures,
} from "@/config/features-config";
import { FILE_UPLOAD_MAX_SIZE } from "@/config/file";
import { redirects } from "@/config/routes";
import { withPlugins } from "@/config/with-plugins";

const nextConfig: NextConfig = {
  env: {
    // Add client-side feature flags
    ...buildTimeFeatureFlags,

    // You can add other build-time env variables here if needed
  },

  /*
   * Next.js configuration
   */
  images: {
    remotePatterns: [
      { hostname: "shipkit.io" }, // @dev: for testing
      { hostname: "picsum.photos" }, // @dev: for testing
      { hostname: "avatar.vercel.sh" }, // @dev: for testing
      { hostname: "github.com" }, // @dev: for testing
      { hostname: "images.unsplash.com" }, // @dev: for testing
      { hostname: "2.gravatar.com" }, // @dev: for testing
      { hostname: "avatars.githubusercontent.com" }, // @dev: github avatars
      { hostname: "vercel.com" }, // @dev: vercel button
      {
        protocol: "https",
        hostname: "**.vercel.app",
      },
      {
        protocol: "https",
        hostname: "shipkit.s3.**.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "better-auth.com",
      },
    ],
    /*
     * Next.js 15+ Enhanced Image Optimization
     * Optimized for Core Web Vitals and performance
     */
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 3600, // 1 hour cache
    // dangerouslyAllowSVG: true,
    // contentDispositionType: "attachment",
    // contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  /*
   * Redirects are located in the `src/config/routes.ts` file
   */
  redirects,

  /*
   * PostHog reverse proxy configuration
   */
  async rewrites() {
    return [
      {
        source: "/relay-64tM/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/relay-64tM/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/relay-64tM/flags",
        destination: "https://us.i.posthog.com/flags",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,

  async headers() {
    return Promise.resolve([
      // /install
      {
        source: "/install",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
      /*
       * Enhanced Security Headers
       * Adds Content Security Policy for better security
       */
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // @production
          // {
          // 	key: "Permissions-Policy",
          // 	value: "camera=(), microphone=(), geolocation=()",
          // },
        ],
      },
    ]);
  },

  // Production optimizations
  compress: true,
  poweredByHeader: false,

  /*
   * React configuration
   */
  reactStrictMode: true,

  /*
   * Source maps - DISABLED to reduce memory usage during build
   * Enable only in development or when specifically needed
   */
  productionBrowserSourceMaps: false,

  /*
   * Lint configuration
   */
  eslint: {
    /*
      !! WARNING !!
      * This allows production builds to successfully complete even if
      * your project has ESLint errors.
    */
    ignoreDuringBuilds: true,
  },
  typescript: {
    /*
      !! WARNING !!
      * Dangerously allow production builds to successfully complete even if
      * your project has type errors.
    */
    // ignoreBuildErrors: true,
  },

  // Configure `pageExtensions` to include markdown and MDX files
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],

  /*
   * Experimental configuration
   */
  experimental: {
    // esmExternals: true,
    // mdxRs: true,
    // mdxRs: {
    // 	jsxRuntime: "automatic",
    // 	jsxImportSource: "jsx-runtime",
    // 	mdxType: "gfm",
    // },

    nextScriptWorkers: true,
    serverActions: {
      bodySizeLimit: FILE_UPLOAD_MAX_SIZE,
    },
    // @see: https://nextjs.org/docs/app/api-reference/next-config-js/viewTransition
    viewTransition: true,
    webVitalsAttribution: ["CLS", "LCP", "TTFB", "FCP", "FID"],

    // Enhanced client-side router cache
    clientSegmentCache: true,

    // Optimized prefetching
    optimisticClientCache: true,

    /*
     * Client-side Router Cache Configuration
     * Optimizes navigation performance by caching page segments
     */
    staleTimes: {
      dynamic: buildTimeFeatures.PAYLOAD_ENABLED ? 0 : 90, // Payload needs to be re-rendered on every request
      static: 360, // 360 seconds for static routes
    },
  },

  /*
   * Miscellaneous configuration
   */
  devIndicators: {
    position: "bottom-left" as const,
  },

  /*
   * Logging configuration
   * @see https://nextjs.org/docs/app/api-reference/next-config-js/logging
   */
  logging: {
    fetches: {
      fullUrl: true, // This will log the full URL of the fetch request even if cached
      // hmrRefreshes: true,
    },
  },

  compiler: {
    // Logs are disabled in production unless DISABLE_LOGGING is set
    // Use DISABLE_LOGGING to disable all logging except error logs
    // Use DISABLE_ERROR_LOGGING to disable error logging too
    removeConsole:
      process.env.DISABLE_LOGGING === "true" ||
      (process.env.NODE_ENV === "production" && !process.env.DISABLE_LOGGING)
        ? process.env.DISABLE_ERROR_LOGGING === "true" ||
          (process.env.NODE_ENV === "production" &&
            !process.env.DISABLE_ERROR_LOGGING)
          ? true
          : { exclude: ["error"] }
        : false,
  },

  /*
   * Bundle Size Optimization - Enhanced
   * Excludes additional heavy dependencies and dev tools from production bundles
   */
  outputFileTracingExcludes: {
    "*": [
      "**/*.test.*",
      "**/*.spec.*",
      "**/*.stories.*",
      "**/tests/**",
      "**/.git/**",
      "**/.github/**",
      "**/.vscode/**",
      "**/.next/cache/**",
      "**/node_modules/typescript/**",
      "**/node_modules/@types/**",
      "**/node_modules/eslint/**",
      "**/node_modules/prettier/**",
      "**/node_modules/typescript/**",
      "**/node_modules/react-syntax-highlighter/**",
      "**/node_modules/canvas-confetti/**",
      "**/node_modules/@huggingface/transformers/**",
      "**/node_modules/three/**",
      "**/node_modules/@react-three/**",
      "**/node_modules/jspdf/**",
      // Additional Next.js 15 optimizations
      "**/node_modules/monaco-editor/**",
      "**/node_modules/@playwright/**",
      "**/node_modules/typescript/lib/**",
      // Exclude more heavy dependencies
      "**/node_modules/remotion/**",
      "**/node_modules/@opentelemetry/**",
      "**/node_modules/googleapis/**",
      "**/node_modules/@tsparticles/**",
      "**/node_modules/marked/**",
      "**/node_modules/remark/**",
      "**/node_modules/rehype/**",
    ],
  },
  outputFileTracingIncludes: {
    "*": ["./docs/**/*", "./src/content/**/*"],
  },

  /*
   * Turbopack configuration
   * @see https://nextjs.org/docs/app/api-reference/next-config-js/turbo
   */
  turbopack: {
    rules: {
      // Add rules for raw-loader to handle specific file types
      // This mirrors the webpack config for these extensions
      "*.(node|bin|html)": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
  },

  /*
   * Webpack configuration
   */
  webpack: (
    config: any,
    { dev, isServer }: { dev: boolean; isServer: boolean },
  ) => {
    // Enable top-level await
    config.experiments = { ...config.experiments, topLevelAwait: true };

    // Add support for async/await in web workers
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: {
        loader: "worker-loader",
        options: {
          filename: "static/[hash].worker.js",
          publicPath: "/_next/",
        },
      },
    });

    if (isServer) {
      // Ensure docs directory is included in the bundle for dynamic imports
      config.module.rules.push({
        test: /\.(md|mdx)$/,
        include: [
          path.join(process.cwd(), "docs"),
          // require("path").join(process.cwd(), "src/content/docs"),
        ],
        use: "raw-loader",
      });
    }

    return config;
  },
};

/*
 * Apply Next.js configuration plugins using the withPlugins utility.
 * The utility handles loading and applying functions exported from files
 * in the specified directory (default: src/config/nextjs).
 */
export default withPlugins(nextConfig);
