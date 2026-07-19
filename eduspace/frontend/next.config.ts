/** @type {import('next').NextConfig} */
const nextConfig = {
  // 跳过TS类型构建报错
  typescript: {
    ignoreBuildErrors: true
  },
  // 本地接口代理转发
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:5328/api/:path*'
      }
    ];
  }
}

module.exports = nextConfig