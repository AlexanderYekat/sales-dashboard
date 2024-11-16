/** @type {import('next').NextConfig} */
const nextConfig = {
  // Оставляем только необходимые настройки
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
