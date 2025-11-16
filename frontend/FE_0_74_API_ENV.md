# FE-0-74：前端 API 环境变量（`VITE_API_BASE_URL`）

## 变量说明

- **变量名**：`VITE_API_BASE_URL`
- **用途**：用于全局设置前端发起 API 请求时的根地址；所有 Axios/Fetch 调用统一引用 `src/shared/config/env.ts` 中的 `API_BASE_URL`。
- **取值方式**：通过 `import.meta.env.VITE_API_BASE_URL` 读取；`env.ts` 会在开发模式下默认回退到 `http://localhost:3000`，在非开发环境下必须显式提供该变量，否则会抛出错误。

## 示例配置

### 1. 本地开发

复制 `.env.example` 为 `.env.local`，只调整该文件中 `VITE_API_BASE_URL` 的值即可，例如：

```dotenv
VITE_API_BASE_URL="http://localhost:3000"
```

然后重新启动 `pnpm dev`，即可让前端通过 `http://localhost:3000` 发起请求。

### 2. Docker / 容器环境

在容器启动命令中注入环境变量，例如：

```bash
VITE_API_BASE_URL="http://backend:3000" pnpm dev
```

或者在 `docker-compose` 中声明：

```yaml
services:
  frontend:
    environment:
      - VITE_API_BASE_URL=http://backend:3000
```

### 3. 生产/预发布

在构建或部署脚本中传入目标环境地址：

```bash
VITE_API_BASE_URL="https://api.rrent.example.com" pnpm build
```

部署完毕后，`env.ts` 会直接读取该值（不会使用本地默认值），如果遗漏了变量会抛出异常并在控制台打印 `[Env] VITE_API_BASE_URL is required in production`。

## 排查建议

1. **Console 日志**：启动 dev 模式 (`pnpm dev`) 后，打开浏览器 DevTools Console，可以看到 `[HTTP] API_BASE_URL = ...`，值应与 `.env.local` 中一致。
2. **Network 请求**：任意一个 API 请求（如 `/organizations?`) 的 URL 应以 `${API_BASE_URL}` 开头；若仍是默认 `http://localhost:3000`，说明 `.env.local` 未生效或未重启。
3. **构建失败**：如果在生产构建时报错 `VITE_API_BASE_URL is required in production`，请确认构建命令中已经设置该环境变量，且未意外被 `.env.example` 覆盖。
4. **不要提交真实生产地址**：`.env.example` 仅保留占位值与注释，真实地址请在部署时通过 CI/CD 传入环境变量。
