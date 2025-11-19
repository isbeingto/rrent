import React from "react";
import { Skeleton, Table } from "antd";

/**
 * 表格加载骨架屏
 * 
 * 用于列表页的加载状态
 * - 模拟表格头部 + 数据行的结构
 * - 避免空白表格闪烁
 * 
 * 使用场景：
 * - ResourceTable（6 个资源列表页统一使用）
 * - AuditPanel（审计日志表格）
 * - 任何需要表格加载状态的地方
 */

interface TableSkeletonProps {
  /** 显示的骨架行数（可选，默认 5） */
  rows?: number;
  
  /** 列数（可选，默认 4） */
  columns?: number;
  
  /** 紧凑模式（可选，默认 false，用于嵌套表格） */
  compact?: boolean;
  
  /** 是否激活动画（可选，默认 true） */
  active?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  compact = false,
  active = true,
}) => {
  // 生成虚拟列定义
  const skeletonColumns = Array.from({ length: columns }, (_, index) => ({
    key: `col-${index}`,
    dataIndex: `col-${index}`,
    title: <Skeleton.Input active={active} size="small" style={{ width: 100 }} />,
    render: () => <Skeleton.Input active={active} size="small" style={{ width: "100%" }} />,
  }));

  // 生成虚拟数据行
  const skeletonData = Array.from({ length: rows }, (_, index) => ({
    key: `row-${index}`,
  }));

  return (
    <Table
      columns={skeletonColumns}
      dataSource={skeletonData}
      pagination={false}
      size={compact ? "small" : "middle"}
      showHeader={true}
    />
  );
};
