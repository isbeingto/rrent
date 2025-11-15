import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RRent - 房屋租赁管理系统',
  description: '高性能的房屋租赁管理系统',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
