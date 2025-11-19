import React from "react";
import { Empty, Button, Space } from "antd";
import { ReloadOutlined, FilterOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

/**
 * 统一空状态组件
 * 
 * 用于显示无数据/筛选结果为空/加载失败等状态
 * - 提供一致的视觉体验
 * - 支持自定义操作按钮
 * - 所有文案通过 i18n 管理
 * 
 * 使用场景：
 * - ResourceTable 无数据时
 * - AuditPanel 无审计记录时
 * - 详情页数据不存在时
 */

export type EmptyType = "default" | "filtered" | "error" | "notFound";

interface SectionEmptyProps {
  /** 空状态类型（可选，默认 "default"） */
  type?: EmptyType;
  
  /** 标题（可选，会根据 type 自动选择） */
  title?: string;
  
  /** 描述文本（可选，会根据 type 自动选择） */
  description?: string;
  
  /** 自定义图标（可选） */
  icon?: React.ReactNode;
  
  /** 操作按钮（可选） */
  actions?: React.ReactNode;
  
  /** 显示"重置筛选"按钮（可选，默认 false） */
  showResetFilters?: boolean;
  
  /** 显示"刷新"按钮（可选，默认 false） */
  showReload?: boolean;
  
  /** 重置筛选回调（可选） */
  onResetFilters?: () => void;
  
  /** 刷新回调（可选） */
  onReload?: () => void;
}

export const SectionEmpty: React.FC<SectionEmptyProps> = ({
  type = "default",
  title,
  description,
  icon,
  actions,
  showResetFilters = false,
  showReload = false,
  onResetFilters,
  onReload,
}) => {
  const { t } = useTranslation();

  // 根据类型选择默认文案（使用 i18n）
  const getDefaultContent = () => {
    switch (type) {
      case "filtered":
        return {
          description: title || t("empty.filtered.title"),
          subDescription: description || t("empty.filtered.description"),
        };
      case "error":
        return {
          description: title || t("empty.error.title"),
          subDescription: description || t("empty.error.description"),
        };
      case "notFound":
        return {
          description: title || t("empty.notFound.title"),
          subDescription: description || t("empty.notFound.description"),
        };
      default:
        return {
          description: title || t("empty.default.title"),
          subDescription: description || t("empty.default.description"),
        };
    }
  };

  const content = getDefaultContent();

  // 构建操作按钮
  const actionButtons = actions || (
    <Space>
      {showResetFilters && onResetFilters && (
        <Button icon={<FilterOutlined />} onClick={onResetFilters}>
          {t("empty.actions.resetFilters")}
        </Button>
      )}
      {showReload && onReload && (
        <Button icon={<ReloadOutlined />} onClick={onReload}>
          {t("empty.actions.reload")}
        </Button>
      )}
    </Space>
  );

  return (
    <Empty
      image={icon || Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <div>
          <div style={{ fontSize: "14px", fontWeight: 500, marginBottom: 4 }}>
            {content.description}
          </div>
          <div style={{ fontSize: "12px", color: "#999" }}>
            {content.subDescription}
          </div>
        </div>
      }
    >
      {(actions || showResetFilters || showReload) && actionButtons}
    </Empty>
  );
};
