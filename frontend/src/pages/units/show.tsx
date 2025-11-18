import { Show } from "@refinedev/antd";
import { Descriptions, Typography, Tag, Button, Card, Space, Tooltip } from "antd";
import { useOne, useCan } from "@refinedev/core";
import { useNavigate, useParams } from "react-router";
import React, { useEffect, useState } from "react";
import http from "@shared/api/http";
import {
  determineOccupancy,
  formatOccupancyDisplay,
  type ILease,
  type OccupancyInfo,
} from "@shared/units/occupancy";

const { Text } = Typography;

/**
 * Units Show 页面 (FE-2-87)
 *
 * 单元详情展示
 * - 使用 Descriptions 展示所有字段
 * - 显示所属物业名称（关联数据）
 * - AccessControl：任何已登录用户都可查看
 */

interface IUnit {
  id: string;
  propertyId: string;
  name?: string;
  unitNumber: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  areaSqm?: number;
  status: "VACANT" | "OCCUPIED" | "RESERVED" | "MAINTENANCE" | "OFFLINE";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  property?: {
    id: string;
    name: string;
  };
}

const statusColorMap: Record<string, string> = {
  VACANT: "green",
  OCCUPIED: "red",
  RESERVED: "orange",
  MAINTENANCE: "blue",
  OFFLINE: "gray",
};

const statusLabelMap: Record<string, string> = {
  VACANT: "空置",
  OCCUPIED: "已出租",
  RESERVED: "预订",
  MAINTENANCE: "维护中",
  OFFLINE: "下线",
};

const UnitsShow: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  
  const { data: canShow } = useCan({
    resource: "units",
    action: "show",
    params: { id: params.id },
  });

  const { data: canCreateLease } = useCan({
    resource: "leases",
    action: "create",
  });

  // 占用信息状态
  const [occupancyInfo, setOccupancyInfo] = useState<OccupancyInfo | null>(null);
  const [loadingOccupancy, setLoadingOccupancy] = useState(false);

  // 如果无权限，重定向到列表页
  useEffect(() => {
    if (canShow && !canShow.can) {
      navigate("/units");
    }
  }, [canShow, navigate]);

  const { query } = useOne<IUnit>({
    resource: "units",
    id: params.id || "",
  });

  const unit = query.data?.data;
  const isLoading = query.isLoading;

  // 获取单元的最近一条租约（用于占用判定）
  useEffect(() => {
    if (!unit?.id) return;

    const fetchOccupancy = async () => {
      setLoadingOccupancy(true);
      try {
        // 获取该单元最近一条 ACTIVE 或 PENDING 租约
        const orgId = localStorage.getItem("organizationId");
        if (!orgId) {
          console.error("[UnitShow] No organizationId found in localStorage");
          setOccupancyInfo(determineOccupancy(null));
          setLoadingOccupancy(false);
          return;
        }

        const response = await http.get<{
          items: ILease[];
          meta: { total: number };
        }>(`/leases`, {
          params: {
            organizationId: orgId,
            unitId: unit.id,
            page: 1,
            limit: 1,
            sort: "startDate",
            order: "desc",
          },
        });

        const latestLease = response.data.items[0];
        const info = determineOccupancy(latestLease);
        setOccupancyInfo(info);
      } catch (error) {
        console.error("[UnitShow] Failed to fetch occupancy info:", error);
        // 失败时仍然显示空置
        setOccupancyInfo(determineOccupancy(null));
      } finally {
        setLoadingOccupancy(false);
      }
    };

    void fetchOccupancy();
  }, [unit?.id]);

  // 格式化日期时间
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // 格式化租约日期（仅日期）
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("zh-CN");
  };

  // 格式化金额
  const formatAmount = (amount?: number | string) => {
    if (amount === undefined || amount === null) return "-";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return `¥${num.toFixed(2)}`;
  };

  return (
    <Show 
      isLoading={isLoading}
      headerButtons={({ defaultButtons }) => (
        <>
          {defaultButtons}
          {canCreateLease?.can && unit && (
            <Button
              type="default"
              onClick={() => {
                navigate(
                  `/leases/create?unitId=${unit.id}&propertyId=${unit.propertyId}`
                );
              }}
            >
              创建租约
            </Button>
          )}
        </>
      )}
    >
      {/* 占用状态卡片 (FE-3-98) */}
      <Card
        title="当前占用情况"
        loading={loadingOccupancy}
        style={{ marginBottom: 24 }}
      >
        {occupancyInfo && (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <div>
              <Text strong>占用状态：</Text>
              <Tooltip title={occupancyInfo.tooltipText}>
                <Tag color={occupancyInfo.statusColor} style={{ marginLeft: 8 }}>
                  {formatOccupancyDisplay(occupancyInfo)}
                </Tag>
              </Tooltip>
            </div>

            {occupancyInfo.lease && (
              <>
                <div>
                  <Text strong>租客姓名：</Text>
                  <Text style={{ marginLeft: 8 }}>
                    {occupancyInfo.lease.tenant?.fullName || "-"}
                  </Text>
                </div>
                <div>
                  <Text strong>租期：</Text>
                  <Text style={{ marginLeft: 8 }}>
                    {formatDate(occupancyInfo.lease.startDate)} ~{" "}
                    {formatDate(occupancyInfo.lease.endDate || undefined)}
                  </Text>
                </div>
                <div>
                  <Text strong>租金：</Text>
                  <Text style={{ marginLeft: 8 }}>
                    {formatAmount(occupancyInfo.lease.rentAmount)}
                  </Text>
                </div>
                <div>
                  <Button
                    type="primary"
                    onClick={() => {
                      navigate(`/leases/show/${occupancyInfo.lease!.id}`);
                    }}
                  >
                    查看租约详情
                  </Button>
                </div>
              </>
            )}
          </Space>
        )}
      </Card>

      <Descriptions
        title="单元详情"
        bordered
        column={1}
      >
        <Descriptions.Item label="ID">
          <Text code>{unit?.id || "-"}</Text>
        </Descriptions.Item>

        <Descriptions.Item label="单元编号">
          <Text strong>{unit?.unitNumber || "-"}</Text>
        </Descriptions.Item>

        <Descriptions.Item label="单元名称">
          {unit?.name || "-"}
        </Descriptions.Item>

        <Descriptions.Item label="所属物业">
          <Text strong>{unit?.property?.name || "-"}</Text>
        </Descriptions.Item>

        <Descriptions.Item label="楼层">
          {unit?.floor !== undefined && unit?.floor !== null ? unit.floor : "-"}
        </Descriptions.Item>

        <Descriptions.Item label="面积">
          {unit?.areaSqm !== undefined && unit?.areaSqm !== null
            ? `${unit.areaSqm}㎡`
            : "-"}
        </Descriptions.Item>

        <Descriptions.Item label="卧室数">
          {unit?.bedrooms !== undefined && unit?.bedrooms !== null
            ? unit.bedrooms
            : "-"}
        </Descriptions.Item>

        <Descriptions.Item label="浴室数">
          {unit?.bathrooms !== undefined && unit?.bathrooms !== null
            ? unit.bathrooms
            : "-"}
        </Descriptions.Item>

        <Descriptions.Item label="状态">
          {unit?.status ? (
            <Tag color={statusColorMap[unit.status]}>
              {statusLabelMap[unit.status] || unit.status}
            </Tag>
          ) : (
            "-"
          )}
        </Descriptions.Item>

        <Descriptions.Item label="是否激活">
          <Tag color={unit?.isActive ? "green" : "red"}>
            {unit?.isActive ? "是" : "否"}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="创建时间">
          {formatDateTime(unit?.createdAt)}
        </Descriptions.Item>

        <Descriptions.Item label="更新时间">
          {formatDateTime(unit?.updatedAt)}
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};

export default UnitsShow;
