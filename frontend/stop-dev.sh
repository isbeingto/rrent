#!/bin/bash
# 停止 Vite 开发服务器

echo "🛑 停止 Vite 开发服务器..."

if pgrep -f "vite.*5173" > /dev/null; then
    pkill -9 -f "vite.*5173"
    pkill -9 -f "pnpm dev"
    echo "✅ Vite 服务器已停止"
else
    echo "ℹ️  Vite 服务器未运行"
fi

# 清理端口
sleep 1
if ss -tuln | grep -q 5173; then
    echo "⚠️  端口 5173 仍被占用"
    lsof -i :5173 || true
else
    echo "✅ 端口 5173 已释放"
fi
