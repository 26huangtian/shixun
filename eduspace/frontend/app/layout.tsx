// frontend/app/layout.tsx
import "./globals.css"; // 引入全局样式

export const metadata = {
  title: "BookSpace - 智能图书管理系统",
  description: "Next.js 15 + Flask + Supabase 构建",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body className="antialiased">
        {/* 这里的 children 会渲染对应的页面或子布局 */}
        {children}
      </body>
    </html>
  );
}