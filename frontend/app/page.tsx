export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="flex flex-col items-center gap-8 max-w-2xl">
        <h1 className="text-4xl font-bold text-center">
          欢迎使用 RRent
        </h1>
        <p className="text-lg text-center text-gray-600">
          高性能的房屋租赁管理系统
        </p>
        
        <div className="flex gap-4 mt-8">
          <a
            href="/api/health"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            检查 API 健康状态
          </a>
        </div>

        <div className="mt-8 p-6 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">系统信息</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <strong>应用名称:</strong> {process.env.NEXT_PUBLIC_APP_NAME || 'RRent'}
            </li>
            <li>
              <strong>版本:</strong> {process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0'}
            </li>
            <li>
              <strong>API 地址:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
