import { Refine, GitHubBanner } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import { useTranslation } from "react-i18next";

import { useNotificationProvider } from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";

import { App as AntdApp, ConfigProvider } from "antd";
import { dataProvider } from "@providers/dataProvider";
import { authProvider } from "@providers/authProvider";
import { accessControlProvider } from "@providers/accessControlProvider";
import { BrowserRouter } from "react-router";
import routerProvider, {
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { ColorModeContextProvider } from "./contexts/color-mode";
import AppRoutes from "./app/AppRoutes";
// FE-0-74: Import HTTP client to initialize API_BASE_URL
import "@shared/api/http";

function App() {
  useTranslation();

  return (
    <BrowserRouter>
      <GitHubBanner />
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <ConfigProvider>
            <AntdApp>
              <DevtoolsProvider>
                {/* FE-1-77: Use custom Axios-based dataProvider */}
                {/* FE-1-78: Use custom authProvider */}
                {/* FE-1-79: Use custom accessControlProvider */}
                <Refine
                  dataProvider={dataProvider}
                  authProvider={authProvider}
                  accessControlProvider={accessControlProvider}
                  notificationProvider={useNotificationProvider}
                  routerProvider={routerProvider}
                  resources={[
                    { name: "organizations", list: "/organizations" },
                    { name: "properties", list: "/properties" },
                    { name: "units", list: "/units" },
                    { name: "tenants", list: "/tenants" },
                    { name: "leases", list: "/leases" },
                    { name: "payments", list: "/payments" },
                  ]}
                  options={{
                    syncWithLocation: true,
                    warnWhenUnsavedChanges: true,
                    projectId: "wt0frU-6jJ9O1-di1xxS",
                  }}
                >
                  <AppRoutes />
                  <RefineKbar />
                  <UnsavedChangesNotifier />
                  <DocumentTitleHandler />
                </Refine>
                <DevtoolsPanel />
              </DevtoolsProvider>
            </AntdApp>
          </ConfigProvider>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
