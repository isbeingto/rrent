import { Show } from "@refinedev/antd";
import { Descriptions, Typography, Tag } from "antd";
import { useOne, useCan } from "@refinedev/core";
import { useNavigate, useParams } from "react-router";
import React, { useEffect } from "react";

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

  return (
    <Show isLoading={isLoading}>
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
