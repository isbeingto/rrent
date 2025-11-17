/**
 * HTTP 客户端 - 兼容性 Re-export
 * 
 * FE-1-80: 为保持向后兼容，从 lib/http.ts re-export
 * 真正的实现在 /src/lib/http.ts，避免代码重复和逻辑漂移
 * 
 * 旧路径: src/shared/api/http.ts (maintained for compatibility)
 * 新路径: src/lib/http.ts (actual implementation)
 */

export { default } from "@/lib/http";
