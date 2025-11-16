#!/bin/bash
# 检查 Vite 开发服务器状态

echo "=== Vite 开发服务器状态 ==="
echo ""

# 检查进程
if pgrep -f "vite.*5173" > /dev/null; then
    echo "✅ 进程状态: 运行中"
    echo "   PID: $(pgrep -f 'vite.*5173')"
    ps aux | grep -E "vite.*5173" | grep -v grep | head -1
else
    echo "❌ 进程状态: 未运行"
fi

echo ""

# 检查端口
if ss -tuln | grep -q 5173; then
    echo "✅ 端口状态: 监听中"
    ss -tuln | grep 5173
else
    echo "❌ 端口状态: 未监听"
fi

echo ""

# 测试连接
echo "🔍 连接测试:"
if timeout 2 curl -s http://localhost:5173/ > /dev/null 2>&1; then
    echo "   ✅ http://localhost:5173/ - 可访问"
else
    echo "   ❌ http://localhost:5173/ - 无法访问"
fi

echo ""

# 日志文件
if [ -f /tmp/vite-server.log ]; then
    echo "📝 最新日志 (最后 10 行):"
    tail -10 /tmp/vite-server.log
else
    echo "ℹ️  日志文件不存在"
fi
