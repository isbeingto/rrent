'use client';

import { useEffect, useState } from 'react';
import { checkReadiness } from '@/lib/api';

interface HealthStatus {
  status: string;
  timestamp: string;
  database?: {
    connected: boolean;
    responseTime?: number;
  };
}

export function HealthCheck() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const data = await checkReadiness();
        setHealth(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check health');
      } finally {
        setLoading(false);
      }
    }

    fetchHealth();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-sm text-gray-600">检查后端状态...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 rounded-lg">
        <p className="text-sm text-red-600">❌ 后端连接失败: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-100 rounded-lg">
      <p className="text-sm text-green-600">
        ✅ 后端状态: {health?.status}
      </p>
      {health?.database && (
        <p className="text-xs text-green-600 mt-1">
          数据库: {health.database.connected ? '已连接' : '未连接'}
          {health.database.responseTime && ` (${health.database.responseTime}ms)`}
        </p>
      )}
    </div>
  );
}
