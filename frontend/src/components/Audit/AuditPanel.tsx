import React from "react";
import { Card, Typography } from "antd";
import { useList } from "@refinedev/core";
import { useTranslation } from "react-i18next";
import { TableSkeleton, SectionEmpty } from "../ui";
import { Table, Tag, Space } from "antd";
import dayjs from "dayjs";

const { Title, Text } = Typography;

/**
 * 审计日志面板组件
 *
 * FE-5-106: 审计面板
 * FE-5-107: 集成统一的 Skeleton 和 Empty 状态
 * 
 * 用于在详情页展示实体的审计日志历史
 * - 租约详情页：展示租约相关的所有操作记录
 * - 物业详情页：展示物业相关的所有操作记录
 *
 * 功能特性：
 * - 使用 useList 调用后端审计日志 API
 * - 自动传递 organizationId（通过 dataProvider）
 * - 按创建时间倒序展示最近 20 条记录
 * - 支持事件类型国际化展示
 * - 无编辑/删除功能（审计日志不可变）
 * - 统一的 loading 和 empty 状态
 */

interface AuditPanelProps {
  /**
   * 实体类型（如 "LEASE", "PROPERTY"）
   */
  entity: string;

  /**
   * 实体 ID（如租约 ID、物业 ID）
   */
  entityId: string;
}

interface IAuditLog {
  id: string;
  organizationId: string;
  userId?: string;
  entity: string;
  entityId?: string;
  action: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    fullName?: string;
  };
}

/**
 * 获取操作类型的颜色
 */
const getActionColor = (action: string): string => {
  if (action.includes("CREATED")) return "green";
  if (action.includes("UPDATED")) return "blue";
  if (action.includes("DELETED")) return "red";
  if (action.includes("ACTIVATED")) return "success";
  if (action.includes("TERMINATED")) return "error";
  if (action.includes("MARK_PAID")) return "cyan";
  return "default";
};

export const AuditPanel: React.FC<AuditPanelProps> = ({ entity, entityId }) => {
  const { t } = useTranslation();

  // 查询审计日志
  const { query } = useList<IAuditLog>({
    resource: "audit-logs",
    filters: [
      {
        field: "entity",
        operator: "eq",
        value: entity,
      },
      {
        field: "entityId",
        operator: "eq",
        value: entityId,
      },
    ],
    sorters: [
      {
        field: "createdAt",
        order: "desc",
      },
    ],
    pagination: {
      pageSize: 20,
    },
  });

  const auditLogs = query.data?.data || [];
  const isLoading = query.isLoading;

  // 表格列定义
  const columns = [
    {
      title: t("audit.fields.action"),
      dataIndex: "action",
      key: "action",
      width: 180,
      render: (action: string) => (
        <Tag color={getActionColor(action)}>
          {t(`audit.actions.${action}`, action)}
        </Tag>
      ),
    },
    {
      title: t("audit.fields.user"),
      dataIndex: "user",
      key: "user",
      width: 200,
      render: (_: unknown, record: IAuditLog) => {
        if (!record.user) {
          return <Text type="secondary">{t("audit.system")}</Text>;
        }
        return (
          <Space direction="vertical" size={0}>
            <Text strong>{record.user.fullName || record.user.email}</Text>
            {record.user.fullName && (
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {record.user.email}
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: t("audit.fields.createdAt"),
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (createdAt: string) => (
        <Text>{dayjs(createdAt).format("YYYY-MM-DD HH:mm:ss")}</Text>
      ),
    },
    {
      title: "IP",
      dataIndex: "ip",
      key: "ip",
      width: 140,
      render: (ip?: string) =>
        ip ? <Text type="secondary">{ip}</Text> : <Text type="secondary">-</Text>,
    },
  ];

  return (
    <Card
      title={
        <Title level={5} style={{ margin: 0 }}>
          {t("audit.panelTitle")}
        </Title>
      }
      style={{ marginTop: 24 }}
    >
      {/* 加载中状态 */}
      {isLoading && <TableSkeleton rows={5} compact />}

      {/* 空状态 */}
      {!isLoading && auditLogs.length === 0 && (
        <SectionEmpty
          type="default"
          title={t("audit.empty.title")}
          description={t("audit.empty.description")}
        />
      )}

      {/* 数据表格 */}
      {!isLoading && auditLogs.length > 0 && (
        <Table<IAuditLog>
          dataSource={auditLogs}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      )}
    </Card>
  );
};
