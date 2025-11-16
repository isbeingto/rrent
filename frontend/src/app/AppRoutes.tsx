import { Routes, Route } from 'react-router';
import MainLayout from './layout/MainLayout';
import Dashboard from '@pages/dashboard';
import NotFound from '@pages/not-found';

/**
 * 应用路由配置
 * 
 * 使用 MainLayout 作为根布局，包含 Dashboard 和 404 页面
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Dashboard 首页 */}
        <Route index element={<Dashboard />} handle={{ breadcrumb: 'Dashboard' }} />
        
        {/* 404 页面 */}
        <Route path="*" element={<NotFound />} handle={{ breadcrumb: '404' }} />
      </Route>
    </Routes>
  );
}
