import { Show, TextField, NumberField, DateField } from "@refinedev/antd";
import { useShow, useCan } from "@refinedev/core";
import { Typography, Tag, Card, Descriptions, Space, Button } from "antd";
import { useParams } from "react-router";
import React from "react";

/**
 * Leases Show 页面 (FE-2-91)
 *
 * 展示租约详情
 * - 显示所有租约字段
 * - 显示关联的租客ID、单元ID、物业ID（未来可扩展为完整对象显示）
 * - 提供编辑/删除按钮（基于权限）
 * - 预留"激活租约"按钮位置（TODO: BE-6-51 激活流程）
 */

// 租约状态枚举
enum LeaseStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  TERMINATED = "TERMINATED",
  EXPIRED = "EXPIRED",
}

// 计费周期枚举
enum BillCycle {
  ONE_TIME = "ONE_TIME",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  YEARLY = "YEARLY",
}

const statusConfig: Record<LeaseStatus, { color: string; text: string }> = {
  [LeaseStatus.DRAFT]: { color: "default", text: "草稿" },
  [LeaseStatus.PENDING]: { color: "processing", text: "待激活" },
  [LeaseStatus.ACTIVE]: { color: "success", text: "生效中" },
  [LeaseStatus.TERMINATED]: { color: "error", text: "已终止" },
  [LeaseStatus.EXPIRED]: { color: "default", text: "已过期" },
};

const billCycleLabels: Record<BillCycle, string> = {
  [BillCycle.ONE_TIME]: "一次性",
  [BillCycle.MONTHLY]: "月付",
  [BillCycle.QUARTERLY]: "季付",
  [BillCycle.YEARLY]: "年付",
};

interface ILease {
  id: string;
  organizationId: string;
  propertyId: string;
  unitId: string;
  tenantId: string;
  status: LeaseStatus;
  billCycle: BillCycle;
  startDate: string;
  endDate?: string;
  rentAmount: number;
  currency: string;
  depositAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const LeasesShow: React.FC = () => {
  const params = useParams<{ id: string }>();

  const { query: queryResult } = useShow<ILease>({
    resource: "leases",
    id: params.id,
  });

  const { data: canEdit } = useCan({
    resource: "leases",
    action: "edit",
    params: { id: params.id },
  });

  const { data: canDelete } = useCan({
    resource: "leases",
    action: "delete",
    params: { id: params.id },
  });

  const lease = queryResult?.data?.data;

  if (!lease) {
    return <div>加载中...</div>;
  }

  const statusInfo = statusConfig[lease.status as LeaseStatus];

  return (
    <Show
      canEdit={canEdit?.can}
      canDelete={canDelete?.can}
      headerButtons={({ defaultButtons }) => (
        <Space>
          {/* TODO: FE-2-92 - 实现激活租约功能（调用 POST /leases/:id/activate） */}
          {lease.status === LeaseStatus.PENDING && canEdit?.can && (
            <Button type="primary" disabled>
              激活租约 (TODO)
            </Button>
          )}
          {defaultButtons}
        </Space>
      )}
    >
      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="租约ID">
            <TextField value={lease.id} />
          </Descriptions.Item>

          <Descriptions.Item label="状态">
            <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label="租客ID">
            <TextField value={lease.tenantId} />
            {/* TODO: 扩展为完整租客信息（调用 getOne("tenants", tenantId)） */}
          </Descriptions.Item>

          <Descriptions.Item label="单元ID">
            <TextField value={lease.unitId} />
            {/* TODO: 扩展为完整单元信息 */}
          </Descriptions.Item>

          <Descriptions.Item label="物业ID">
            <TextField value={lease.propertyId} />
            {/* TODO: 扩展为完整物业信息 */}
          </Descriptions.Item>

          <Descriptions.Item label="组织ID">
            <TextField value={lease.organizationId} />
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="租金信息" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="租金金额">
            <NumberField
              value={lease.rentAmount}
              options={{
                style: "currency",
                currency: lease.currency,
              }}
            />
          </Descriptions.Item>

          <Descriptions.Item label="押金金额">
            {lease.depositAmount !== undefined ? (
              <NumberField
                value={lease.depositAmount}
                options={{
                  style: "currency",
                  currency: lease.currency,
                }}
              />
            ) : (
              "-"
            )}
          </Descriptions.Item>

          <Descriptions.Item label="计费周期">
            {billCycleLabels[lease.billCycle as BillCycle]}
          </Descriptions.Item>

          <Descriptions.Item label="币种">
            <TextField value={lease.currency} />
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="时间信息" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="开始日期">
            <DateField value={lease.startDate} format="YYYY-MM-DD" />
          </Descriptions.Item>

          <Descriptions.Item label="结束日期">
            {lease.endDate ? (
              <DateField value={lease.endDate} format="YYYY-MM-DD" />
            ) : (
              "-"
            )}
          </Descriptions.Item>

          <Descriptions.Item label="创建时间">
            <DateField value={lease.createdAt} format="YYYY-MM-DD HH:mm:ss" />
          </Descriptions.Item>

          <Descriptions.Item label="更新时间">
            <DateField value={lease.updatedAt} format="YYYY-MM-DD HH:mm:ss" />
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {lease.notes && (
        <Card title="备注">
          <Typography.Paragraph>{lease.notes}</Typography.Paragraph>
        </Card>
      )}
    </Show>
  );
};

export default LeasesShow;
