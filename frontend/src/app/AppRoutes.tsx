import { Routes, Route } from "react-router";
import MainLayout from "./layout/MainLayout";
import Dashboard from "@pages/dashboard";
import NotFound from "@pages/not-found";
import LoginPage from "@pages/auth/LoginPage";
import OrganizationsList from "@pages/organizations";
import PropertiesList from "@pages/properties";
import UnitsList from "@pages/units";
import TenantsList from "@pages/tenants";
import LeasesList from "@pages/leases";
import PaymentsList from "@pages/payments";

/**
 * 应用路由配置
 *
 * 使用 MainLayout 作为根布局，包含 Dashboard、业务资源列表和 404 页面
 * /login 为公开路由，不包装在 MainLayout 中
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* 公开路由 - 登录页 */}
      <Route path="/login" element={<LoginPage />} />

      {/* 主应用布局及业务路由 */}
      <Route path="/" element={<MainLayout />}>
        {/* Dashboard 首页 */}
        <Route
          index
          element={<Dashboard />}
          handle={{ breadcrumb: "Dashboard" }}
        />

        {/* Organizations */}
        <Route
          path="organizations"
          element={<OrganizationsList />}
          handle={{ breadcrumb: "Organizations" }}
        />

        {/* Properties */}
        <Route
          path="properties"
          element={<PropertiesList />}
          handle={{ breadcrumb: "Properties" }}
        />

        {/* Units */}
        <Route
          path="units"
          element={<UnitsList />}
          handle={{ breadcrumb: "Units" }}
        />

        {/* Tenants */}
        <Route
          path="tenants"
          element={<TenantsList />}
          handle={{ breadcrumb: "Tenants" }}
        />

        {/* Leases */}
        <Route
          path="leases"
          element={<LeasesList />}
          handle={{ breadcrumb: "Leases" }}
        />

        {/* Payments */}
        <Route
          path="payments"
          element={<PaymentsList />}
          handle={{ breadcrumb: "Payments" }}
        />

        {/* 404 页面 */}
        <Route path="*" element={<NotFound />} handle={{ breadcrumb: "404" }} />
      </Route>
    </Routes>
  );
}
