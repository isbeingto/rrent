import { Show, TextField, NumberField, DateField } from "@refinedev/antd";
import { useShow, useCan, useList } from "@refinedev/core";
import { Typography, Tag, Card, Descriptions, Space, Button, Table, Row, Col } from "antd";
import { useParams, Link } from "react-router";
import React, { useEffect, useState } from "react";
import http from "../../shared/api/http";

/**
 * Leases Show 页面 (FE-3-96)
 *
 * 聚合展示租约详情
 * - 租约总览：状态、金额、账单周期、日期
 * - 关联对象：租客信息、房源信息（单元+物业）
 * - 账单列表：该租约的所有 Payment 记录
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

interface ITenant {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  isActive: boolean;
}

interface IUnit {
  id: string;
  unitNumber: string;
  floor?: string;
  area?: number;
  propertyId: string;
}

interface IProperty {
  id: string;
  name: string;
  address?: string;
}

interface IPayment {
  id: string;
  leaseId: string;
  type: string;
  amount: number | string; // Prisma Decimal 可能返回字符串
  status: string;
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
}

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
  rentAmount: number | string; // Prisma Decimal 可能返回字符串
  currency: string;
  depositAmount?: number | string | null; // Prisma Decimal 可能返回字符串或 null
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

  // 状态管理：租客、单元、物业、支付单
  const [tenant, setTenant] = useState<ITenant | null>(null);
  const [unit, setUnit] = useState<IUnit | null>(null);
  const [property, setProperty] = useState<IProperty | null>(null);
  const [loadingTenant, setLoadingTenant] = useState(false);
  const [loadingUnit, setLoadingUnit] = useState(false);
  const [loadingProperty, setLoadingProperty] = useState(false);

  // 使用 useList 获取支付单
  const paymentsQuery = useList<IPayment>({
    resource: "payments",
    filters: lease ? [
      {
        field: "leaseId",
        operator: "eq",
        value: lease.id,
      },
    ] : [],
    queryOptions: {
      enabled: !!lease,
    },
    pagination: {
      pageSize: 50,
    },
  });

  const payments = paymentsQuery.query.data?.data || [];
  const loadingPayments = paymentsQuery.query.isLoading;

  // 获取租客信息
  useEffect(() => {
    if (!lease?.tenantId) return;
    
    const fetchTenant = async () => {
      setLoadingTenant(true);
      try {
        const response = await http.get<ITenant>(`/tenants/${lease.tenantId}`, {
          params: { organizationId: lease.organizationId },
        });
        setTenant(response.data);
      } catch (error) {
        console.error("Failed to fetch tenant:", error);
      } finally {
        setLoadingTenant(false);
      }
    };

    fetchTenant();
  }, [lease?.tenantId, lease?.organizationId]);

  // 获取单元信息
  useEffect(() => {
    if (!lease?.unitId) return;
    
    const fetchUnit = async () => {
      setLoadingUnit(true);
      try {
        const response = await http.get<IUnit>(`/units/${lease.unitId}`, {
          params: { organizationId: lease.organizationId },
        });
        setUnit(response.data);
      } catch (error) {
        console.error("Failed to fetch unit:", error);
      } finally {
        setLoadingUnit(false);
      }
    };

    fetchUnit();
  }, [lease?.unitId, lease?.organizationId]);

  // 获取物业信息
  useEffect(() => {
    if (!lease?.propertyId) return;
    
    const fetchProperty = async () => {
      setLoadingProperty(true);
      try {
        const response = await http.get<IProperty>(`/properties/${lease.propertyId}`, {
          params: { organizationId: lease.organizationId },
        });
        setProperty(response.data);
      } catch (error) {
        console.error("Failed to fetch property:", error);
      } finally {
        setLoadingProperty(false);
      }
    };

    fetchProperty();
  }, [lease?.propertyId, lease?.organizationId]);

  if (!lease) {
    return <div>加载中...</div>;
  }

  const statusInfo = statusConfig[lease.status as LeaseStatus];

  // 支付类型映射
  const paymentTypeLabels: Record<string, string> = {
    RENT: "租金",
    DEPOSIT: "押金",
    UTILITY: "水电费",
    OTHER: "其他",
  };

  // 支付状态配置
  const paymentStatusConfig: Record<string, { color: string; text: string }> = {
    PENDING: { color: "warning", text: "待支付" },
    PAID: { color: "success", text: "已支付" },
    OVERDUE: { color: "error", text: "逾期" },
    CANCELLED: { color: "default", text: "已取消" },
  };

  // 支付单表格列
  const paymentColumns = [
    {
      title: "支付单 ID",
      dataIndex: "id",
      key: "id",
      render: (id: string) => (
        <Link to={`/payments/show/${id}`}>
          <Typography.Link>{id.substring(0, 8)}...</Typography.Link>
        </Link>
      ),
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      render: (type: string) => paymentTypeLabels[type] || type,
    },
    {
      title: "金额",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number | string) => {
        const numAmount = typeof amount === 'number' ? amount : parseFloat(amount?.toString() || '0');
        return (
          <NumberField
            value={numAmount}
            options={{
              style: "currency",
              currency: "CNY",
            }}
          />
        );
      },
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const config = paymentStatusConfig[status] || { color: "default", text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "到期日",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (dueDate?: string) =>
        dueDate ? <DateField value={dueDate} format="YYYY-MM-DD" /> : "-",
    },
    {
      title: "支付日期",
      dataIndex: "paidAt",
      key: "paidAt",
      render: (paidAt?: string) =>
        paidAt ? <DateField value={paidAt} format="YYYY-MM-DD" /> : "-",
    },
    {
      title: "操作",
      key: "action",
      render: (_text: unknown, record: IPayment) => (
        <Link to={`/payments/show/${record.id}`}>
          <Button type="link" size="small">
            查看详情
          </Button>
        </Link>
      ),
    },
  ];

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
      {/* 租约总览区块 */}
      <Card title="租约总览" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="租约 ID">
                <TextField value={lease.id} copyable />
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="账单周期">
                {billCycleLabels[lease.billCycle as BillCycle]}
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={12}>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="租金金额">
                <NumberField
                  value={typeof lease.rentAmount === 'number' ? lease.rentAmount : parseFloat(lease.rentAmount?.toString() || '0')}
                  options={{
                    style: "currency",
                    currency: lease.currency,
                  }}
                />
              </Descriptions.Item>
              <Descriptions.Item label="押金金额">
                {lease.depositAmount !== undefined && lease.depositAmount !== null ? (
                  <NumberField
                    value={typeof lease.depositAmount === 'number' ? lease.depositAmount : parseFloat(lease.depositAmount?.toString() || '0')}
                    options={{
                      style: "currency",
                      currency: lease.currency,
                    }}
                  />
                ) : (
                  "-"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="起止日期">
                <DateField value={lease.startDate} format="YYYY-MM-DD" />
                {" ~ "}
                {lease.endDate ? (
                  <DateField value={lease.endDate} format="YYYY-MM-DD" />
                ) : (
                  "未设置"
                )}
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      {/* 关联对象区块 */}
      <Card title="关联对象" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          {/* 租客信息 */}
          <Col span={12}>
            <Card
              title="租客信息"
              type="inner"
              loading={loadingTenant}
              extra={
                tenant && (
                  <Link to={`/tenants/show/${tenant.id}`}>
                    <Button type="link" size="small">
                      查看租客详情
                    </Button>
                  </Link>
                )
              }
            >
              {tenant ? (
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="姓名">
                    {tenant.fullName}
                  </Descriptions.Item>
                  <Descriptions.Item label="邮箱">{tenant.email}</Descriptions.Item>
                  <Descriptions.Item label="电话">
                    {tenant.phone || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="状态">
                    <Tag color={tenant.isActive ? "success" : "default"}>
                      {tenant.isActive ? "激活" : "未激活"}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <Typography.Text type="secondary">
                  租客 ID: {lease.tenantId}
                </Typography.Text>
              )}
            </Card>
          </Col>

          {/* 房源信息 */}
          <Col span={12}>
            <Card
              title="房源信息"
              type="inner"
              loading={loadingUnit || loadingProperty}
              extra={
                unit && (
                  <Link to={`/units/show/${unit.id}`}>
                    <Button type="link" size="small">
                      查看单元详情
                    </Button>
                  </Link>
                )
              }
            >
              {property && unit ? (
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="物业名称">
                    {property.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="单元编号">
                    {unit.unitNumber}
                  </Descriptions.Item>
                  <Descriptions.Item label="楼层">
                    {unit.floor || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="面积">
                    {unit.area ? `${unit.area} m²` : "-"}
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <>
                  <Typography.Text type="secondary" style={{ display: "block" }}>
                    物业 ID: {lease.propertyId}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ display: "block" }}>
                    单元 ID: {lease.unitId}
                  </Typography.Text>
                </>
              )}
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 账单列表区块 */}
      <Card title="账单列表（Payments）" style={{ marginBottom: 16 }}>
        <Table
          dataSource={payments}
          columns={paymentColumns}
          rowKey="id"
          loading={loadingPayments}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          locale={{
            emptyText: "该租约暂无账单记录",
          }}
        />
      </Card>

      {/* 备注 */}
      {lease.notes && (
        <Card title="备注">
          <Typography.Paragraph>{lease.notes}</Typography.Paragraph>
        </Card>
      )}
    </Show>
  );
};

export default LeasesShow;
