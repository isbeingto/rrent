# FE-5-105: i18n 框架搭建与系统级文案迁移

## 1. 概述

本任务完成了前端 i18n 框架的搭建，并迁移了系统级通用文案（Layout, Menu, Common Actions）以及 Tenants 和 Payments 模块的文案。

## 2. 技术选型

- **库**: `i18next`, `react-i18next`, `i18next-browser-languagedetector`
- **资源结构**: 按模块拆分 JSON 文件 (`common`, `layout`, `tenants`, `payments`)
- **默认语言**: `zh-CN` (中文)

## 3. 目录结构

```
frontend/src/
├── i18n/
│   └── index.ts          # i18n 初始化配置
├── locales/
│   └── zh-CN/            # 中文资源文件
│       ├── common.json   # 通用文案 (按钮, 状态, 提示)
│       ├── layout.json   # 布局文案 (菜单, 顶部栏)
│       ├── tenants.json  # 租客模块文案
│       └── payments.json # 支付模块文案
```

## 4. 迁移内容

### 4.1 系统级组件
- **SiderNav**: 菜单项名称 (`layout:menu.*`)
- **OrgSwitcher**: 组织切换提示 (无硬编码文本，逻辑保持不变)
- **MainLayout**: 顶部栏、底部栏 (如有)

### 4.2 业务模块
- **Tenants (租客)**:
  - 列表页 (`src/pages/tenants/index.tsx`): 表头, 状态 Tag, 筛选器
  - 详情页 (`src/pages/tenants/show.tsx`): Descriptions Label, 状态 Tag
- **Payments (支付)**:
  - 列表页 (`src/pages/payments/index.tsx`): 表头, 状态 Tag, 操作按钮 ("标记已支付")
  - 详情页 (`src/pages/payments/show.tsx`): Descriptions Label, Alert 提示, 操作按钮

## 5. 使用指南

### 5.1 添加新翻译
在 `src/locales/zh-CN/` 下对应的 JSON 文件中添加键值对。

### 5.2 在组件中使用
```tsx
import { useTranslation } from "react-i18next";

const MyComponent = () => {
  const { t } = useTranslation();
  
  // 基本用法 (推荐提供默认值)
  return <div>{t("common:actions.save", "保存")}</div>;
  
  // 带参数
  return <div>{t("payments:dueInfo.overdue", { days: 5 })}</div>;
};
```

### 5.3 测试
单元测试中 `useTranslation` 会返回 key 或默认值。如果需要测试特定翻译，需 mock `react-i18next`。
目前测试已通过，主要依赖默认值回退机制。

## 6. 后续计划
- 迁移剩余模块 (Organizations, Properties, Units, Leases)
- 支持英文 (en-US) 资源文件
- 完善测试环境的 i18n Mock
