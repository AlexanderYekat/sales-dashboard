/** @type {import('next').NextConfig} */
const nextConfig = {
  // Отключаем все аналитики и метрики Vercel
  vercelAnalytics: false,
  speedInsights: false,
  // Отключаем загрузку внешних скриптов Vercel
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self';"
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
