import { Routes, Route } from "react-router";
import { Authenticated } from "@refinedev/core";
import MainLayout from "./layout/MainLayout";
import Dashboard from "@pages/dashboard";
import NotFound from "@pages/not-found";
import LoginPage from "@pages/auth/LoginPage";
import OrganizationsList from "@pages/organizations";
import OrganizationsCreate from "@pages/organizations/create";
import OrganizationsEdit from "@pages/organizations/edit";
import OrganizationsShow from "@pages/organizations/show";
import PropertiesList from "@pages/properties";
import PropertiesCreate from "@pages/properties/create";
import PropertiesEdit from "@pages/properties/edit";
import PropertiesShow from "@pages/properties/show";
import UnitsList from "@pages/units";
import UnitsCreate from "@pages/units/create";
import UnitsEdit from "@pages/units/edit";
import UnitsShow from "@pages/units/show";
import TenantsList from "@pages/tenants";
import TenantsCreate from "@pages/tenants/create";
import TenantsEdit from "@pages/tenants/edit";
import TenantsShow from "@pages/tenants/show";
import LeasesList from "@pages/leases";
import PaymentsList from "@pages/payments";

/**
 * 应用路由配置
 *
 * 使用 MainLayout 作为根布局，包含 Dashboard、业务资源列表和 404 页面
 * /login 为公开路由，不包装在 MainLayout 中
 * FE-1-78: 使用 Authenticated 组件保护所有业务路由
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* 公开路由 - 登录页 */}
      <Route path="/login" element={<LoginPage />} />

      {/* 主应用布局及业务路由 - 需要认证 */}
      <Route
        path="/"
        element={
          <Authenticated
            key="authenticated"
            fallback={<LoginPage />}
            redirectOnFail="/login"
          >
            <MainLayout />
          </Authenticated>
        }
      >
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
        <Route
          path="organizations/create"
          element={<OrganizationsCreate />}
          handle={{ breadcrumb: "Create" }}
        />
        <Route
          path="organizations/edit/:id"
          element={<OrganizationsEdit />}
          handle={{ breadcrumb: "Edit" }}
        />
        <Route
          path="organizations/show/:id"
          element={<OrganizationsShow />}
          handle={{ breadcrumb: "Details" }}
        />

        {/* Properties */}
        <Route
          path="properties"
          element={<PropertiesList />}
          handle={{ breadcrumb: "Properties" }}
        />
        <Route
          path="properties/create"
          element={<PropertiesCreate />}
          handle={{ breadcrumb: "Create" }}
        />
        <Route
          path="properties/edit/:id"
          element={<PropertiesEdit />}
          handle={{ breadcrumb: "Edit" }}
        />
        <Route
          path="properties/show/:id"
          element={<PropertiesShow />}
          handle={{ breadcrumb: "Details" }}
        />

        {/* Units */}
        <Route
          path="units"
          element={<UnitsList />}
          handle={{ breadcrumb: "Units" }}
        />
        <Route
          path="units/create"
          element={<UnitsCreate />}
          handle={{ breadcrumb: "Create" }}
        />
        <Route
          path="units/edit/:id"
          element={<UnitsEdit />}
          handle={{ breadcrumb: "Edit" }}
        />
        <Route
          path="units/show/:id"
          element={<UnitsShow />}
          handle={{ breadcrumb: "Details" }}
        />

        {/* Tenants */}
        <Route
          path="tenants"
          element={<TenantsList />}
          handle={{ breadcrumb: "Tenants" }}
        />
        <Route
          path="tenants/create"
          element={<TenantsCreate />}
          handle={{ breadcrumb: "Create" }}
        />
        <Route
          path="tenants/edit/:id"
          element={<TenantsEdit />}
          handle={{ breadcrumb: "Edit" }}
        />
        <Route
          path="tenants/show/:id"
          element={<TenantsShow />}
          handle={{ breadcrumb: "Details" }}
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
