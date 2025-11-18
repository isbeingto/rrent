import React from "react";
import { List, useTable, CreateButton } from "@refinedev/antd";
import { Table } from "antd";
import { useCan, BaseRecord } from "@refinedev/core";
import type { ColumnsType } from "antd/es/table";

/**
 * 通用资源列表表格组件
 * 
 * FE-2-94: 抽象通用列表页逻辑，减少重复代码
 * 
 * 用途：
 * - 统一处理分页、排序、筛选
 * - 复用 Refine useTable + AntD Table 的集成
 * - 保持现有 API 契约（page/limit/sort/order）
 * 
 * 使用示例：
 * ```tsx
 * <ResourceTable
 *   resource="organizations"
 *   title="组织列表"
 *   columns={columns}
 *   defaultPageSize={20}
 *   defaultSorter={{ field: "createdAt", order: "desc" }}
 * />
 * ```
 */

export interface ResourceTableProps<TData extends BaseRecord = BaseRecord> {
  /** 资源名称（如 "organizations", "properties"） */
  resource: string;
  
  /** 页面标题（可选，默认使用 resource） */
  title?: string;
  
  /** 表格列定义 */
  columns: ColumnsType<TData>;
  
  /** 顶部筛选区域（可选） */
  filters?: React.ReactNode;
  
  /** 额外的头部内容（可选，如自定义按钮） */
  extraHeader?: React.ReactNode;
  
  /** 默认每页大小（可选，默认 20） */
  defaultPageSize?: number;
  
  /** 默认排序（可选） */
  defaultSorter?: {
    field: string;
    order: "asc" | "desc";
  };
  
  /** 是否显示创建按钮（可选，默认检查权限后显示） */
  showCreateButton?: boolean;
  
  /** 自定义行键（可选，默认 "id"） */
  rowKey?: string;
}

export function ResourceTable<TData extends BaseRecord = BaseRecord>({
  resource,
  title,
  columns,
  filters,
  extraHeader,
  defaultPageSize = 20,
  defaultSorter,
  showCreateButton = true,
  rowKey = "id",
}: ResourceTableProps<TData>) {
  // 检查创建权限
  const { data: canCreate } = useCan({
    resource,
    action: "create",
  });

  // 使用 Refine 的 useTable hook
  const { tableProps } = useTable<TData>({
    resource,
    pagination: {
      pageSize: defaultPageSize,
    },
    sorters: defaultSorter
      ? {
          initial: [
            {
              field: defaultSorter.field,
              order: defaultSorter.order,
            },
          ],
        }
      : undefined,
  });

  return (
    <List
      title={title}
      headerButtons={({ defaultButtons }) => (
        <>
          {defaultButtons}
          {showCreateButton && canCreate?.can && <CreateButton />}
          {extraHeader}
        </>
      )}
    >
      {/* 筛选区域 */}
      {filters && <div style={{ marginBottom: 16 }}>{filters}</div>}

      {/* 表格 */}
      <Table<TData>
        {...tableProps}
        columns={columns}
        rowKey={rowKey}
        scroll={{ x: "max-content" }}
        pagination={{
          ...tableProps.pagination,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </List>
  );
}

export default ResourceTable;
