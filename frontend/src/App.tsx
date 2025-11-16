import { Refine, GitHubBanner } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import { useNotificationProvider } from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";

import dataProvider from "@refinedev/simple-rest";
import { App as AntdApp } from "antd";
import { BrowserRouter } from "react-router";
import routerProvider, {
  UnsavedChangesNotifier,
  DocumentTitleHandler,
} from "@refinedev/react-router";
import { ColorModeContextProvider } from "./contexts/color-mode";
import AppRoutes from "./app/AppRoutes";
// FE-0-74: Import HTTP client to initialize API_BASE_URL
import "@shared/api/http";

function App() {
  return (
    <BrowserRouter>
      <GitHubBanner />
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <AntdApp>
            <DevtoolsProvider>
              {/* TODO(FE-0-71): replace refine dataProvider with Axios-based implementation */}
              {/* TODO(FE-0-72): wire authProvider & interceptors (JWT) */}
              <Refine
                dataProvider={dataProvider(
                  import.meta.env.VITE_API_BASE_URL ||
                    "https://api.fake-rest.refine.dev"
                )}
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
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
