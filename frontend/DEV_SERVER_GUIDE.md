# FE-0-72 开发服务器管理指南

## 问题说明

### 根本原因

在开发过程中发现 `localhost:5173` 无法访问的问题，经排查发现：

1. **进程状态异常**: Vite 进程状态为 `T` (Stopped，已停止)
2. **端口看似正常**: `ss -tuln` 显示端口在监听，但实际无法处理请求
3. **连接超时**: curl 和浏览器连接会挂起或超时

### 问题根因

进程被停止的常见原因：

- 用户按了 `Ctrl+Z` (发送 SIGTSTP 信号)
- 终端会话断开导致进程被挂起
- Shell job control 机制导致后台进程被停止
- 进程处于 Stopped 状态时，虽然 socket 仍在监听，但无法处理任何请求

## 解决方案

### 1. 快速启动脚本（推荐）

使用封装好的脚本管理开发服务器：

```bash
# 启动服务器（持久化运行，不受终端断开影响）
./start-dev.sh
# 或
pnpm run dev:start

# 停止服务器
./stop-dev.sh
# 或
pnpm run dev:stop

# 检查服务器状态
./status-dev.sh
# 或
pnpm run dev:status
```

### 2. 脚本说明

#### start-dev.sh

- 使用 `nohup` 防止终端断开影响
- 使用 `disown` 从 shell job control 中分离
- 自动检查是否已有进程运行
- 验证服务器启动成功
- 日志输出到 `/tmp/vite-server.log`

#### stop-dev.sh

- 安全停止所有相关进程
- 验证端口释放

#### status-dev.sh

- 检查进程状态
- 检查端口监听
- 测试实际连接
- 显示最新日志

### 3. 手动操作（仅供参考）

如果需要手动排查问题：

```bash
# 1. 检查进程状态
ps aux | grep vite | grep -v grep

# 2. 检查端口
ss -tuln | grep 5173

# 3. 如果进程状态为 'T' (Stopped)，强制杀死
pkill -9 -f vite

# 4. 重新启动（使用 nohup 和 disown）
cd /srv/rrent/frontend
nohup pnpm dev > /tmp/vite-server.log 2>&1 &
disown

# 5. 验证连接
curl -s http://localhost:5173/ | head -20
```

## 验证服务器正常运行

运行状态检查：

```bash
./status-dev.sh
```

应该看到：

```
✅ 进程状态: 运行中
✅ 端口状态: 监听中
✅ http://localhost:5173/ - 可访问
```

## 访问地址

服务器启动后可通过以下地址访问：

- **本地**: http://localhost:5173
- **网络**: http://74.122.24.3:5173

## 日志查看

实时查看服务器日志：

```bash
tail -f /tmp/vite-server.log
```

## 常见问题

### Q: 为什么不直接用 `pnpm dev`？

A: 直接使用 `pnpm dev` 存在以下问题：

- 终端关闭会导致进程终止
- 按 `Ctrl+Z` 会导致进程被停止
- 进程被停止后端口看似监听但无法处理请求

### Q: 如何确保开发服务器持续运行？

A: 使用 `./start-dev.sh` 脚本，它会：

- 使用 `nohup` 忽略挂断信号
- 使用 `disown` 从 shell job control 分离
- 重定向输出到日志文件

### Q: 端口被占用怎么办？

A: 运行停止脚本清理：

```bash
./stop-dev.sh
```

### Q: 如何在生产环境部署？

A: 开发服务器仅用于开发环境。生产环境应该：

```bash
pnpm build
pnpm preview  # 或使用 Nginx/Apache 等 Web 服务器
```

## FE-0-72 验收

所有验收标准已通过：

✅ **代码验收**: 39 项检查全部通过
✅ **TypeScript 编译**: 无错误
✅ **ESLint**: 无错误
✅ **构建**: 成功 (dist 1.3M)
✅ **运行时验收**: localhost:5173 可正常访问
✅ **6 个资源**: organizations/properties/units/tenants/leases/payments 全部注册
✅ **路由配置**: 6 个路由全部可访问
✅ **导航菜单**: 7 个菜单项（1个 dashboard + 6个资源）全部启用

## 后续任务

在 FE-1 系列任务中：

- 对接真实 API
- 实现 CRUD 操作
- 添加数据筛选和分页
- 实现详情页和编辑页
