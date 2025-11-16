#!/bin/bash
# Vite 开发服务器启动脚本
# 使用 nohup 和 disown 确保进程不会被终端断开影响

set -e

cd "$(dirname "$0")"

# 检查是否已有进程在运行
if pgrep -f "vite.*5173" > /dev/null; then
    echo "⚠️  Vite 服务器已在运行"
    echo "端口状态:"
    ss -tuln | grep 5173 || echo "端口未监听"
    exit 0
fi

echo "🚀 启动 Vite 开发服务器..."

# 清理旧的日志
rm -f /tmp/vite-server.log

# 使用 nohup 启动，并重定向输出
nohup pnpm dev > /tmp/vite-server.log 2>&1 &

# 获取 PID
PID=$!

# 从 shell job control 中分离
disown $PID

echo "✅ Vite 已启动 (PID: $PID)"
echo "📝 日志文件: /tmp/vite-server.log"

# 等待服务器启动
sleep 3

# 验证服务器状态
if ss -tuln | grep -q 5173; then
    echo "✅ 服务器正在监听 5173 端口"
    echo ""
    echo "访问地址:"
    echo "  - http://localhost:5173"
    echo "  - http://$(hostname -I | awk '{print $1}'):5173"
else
    echo "❌ 服务器启动失败，请查看日志:"
    echo "   tail -f /tmp/vite-server.log"
    exit 1
fi
