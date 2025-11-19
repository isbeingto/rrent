import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// 引入中文资源文件
import commonZh from "../locales/zh-CN/common.json";
import layoutZh from "../locales/zh-CN/layout.json";
import tenantsZh from "../locales/zh-CN/tenants.json";
import paymentsZh from "../locales/zh-CN/payments.json";

// 资源结构
const resources = {
  "zh-CN": {
    common: commonZh,
    layout: layoutZh,
    tenants: tenantsZh,
    payments: paymentsZh,
  },
  // 预留 en-US
  // "en-US": { ... }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "zh-CN", // 默认语言
    fallbackLng: "zh-CN", // 回退语言
    
    // 命名空间配置
    ns: ["common", "layout", "tenants", "payments"],
    defaultNS: "common",

    interpolation: {
      escapeValue: false, // React 已经处理了 XSS
    },

    // 开发环境开启调试
    debug: process.env.NODE_ENV === "development",
  });

export default i18n;
