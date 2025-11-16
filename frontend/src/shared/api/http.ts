import axios, { AxiosInstance } from 'axios';

/**
 * HTTP 客户端基础实例
 * 
 * TODO(FE-0-71): replace refine dataProvider with Axios-based implementation
 * 将此实例集成到 Refine Data Provider 中，实现真正的 API 请求拦截、错误处理等
 * 
 * TODO(FE-0-72): wire authProvider & interceptors (JWT)
 * 添加请求拦截器，自动附加 JWT Token；响应拦截器处理认证失败重定向
 */

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const httpClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default httpClient;
