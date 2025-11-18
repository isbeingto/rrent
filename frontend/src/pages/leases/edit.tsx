import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, DatePicker, Select } from "antd";
import { useCan } from "@refinedev/core";
import { useNavigate, useParams } from "react-router";
import React, { useEffect } from "react";
import dayjs from "dayjs";

/**
 * Leases Edit 页面 (FE-2-91)
 *
 * 编辑租约表单
 * - 可编辑字段：
 *   - startDate, endDate（日期调整）
 *   - rentAmount, depositAmount（金额调整）
 *   - billCycle（计费周期）
 *   - status（状态）
 *   - notes（备注）
 * - 不可编辑字段（根据 UpdateLeaseDto）：
 *   - tenantId, unitId, propertyId, organizationId（关键关联，不允许修改）
 * - organizationId 作为 query 参数传递（由 dataProvider 处理）
 * - AccessControl：只有 OWNER/PROPERTY_MGR/OPERATOR 可访问
 */

// 租约状态枚举（与 backend 保持一致）
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

const billCycleLabels: Record<BillCycle, string> = {
  [BillCycle.ONE_TIME]: "一次性",
  [BillCycle.MONTHLY]: "月付",
  [BillCycle.QUARTERLY]: "季付",
  [BillCycle.YEARLY]: "年付",
};

const statusLabels: Record<LeaseStatus, string> = {
  [LeaseStatus.DRAFT]: "草稿",
  [LeaseStatus.PENDING]: "待激活",
  [LeaseStatus.ACTIVE]: "生效中",
  [LeaseStatus.TERMINATED]: "已终止",
  [LeaseStatus.EXPIRED]: "已过期",
};

const LeasesEdit: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  
  const { data: canEdit } = useCan({
    resource: "leases",
    action: "edit",
    params: { id: params.id },
  });

  // 如果无权限，重定向到详情页
  useEffect(() => {
    if (canEdit && !canEdit.can) {
      navigate(`/leases/show/${params.id}`);
    }
  }, [canEdit, navigate, params.id]);

  const { formProps, saveButtonProps, query: queryResult } = useForm({
    resource: "leases",
    action: "edit",
    id: params.id,
    redirect: "show",
  });

  const leaseData = queryResult?.data?.data;

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        {/* 只读字段：显示关联信息 */}
        <Form.Item label="租客ID（不可修改）">
          <Input value={leaseData?.tenantId} disabled />
        </Form.Item>

        <Form.Item label="物业ID（不可修改）">
          <Input value={leaseData?.propertyId} disabled />
        </Form.Item>

        <Form.Item label="单元ID（不可修改）">
          <Input value={leaseData?.unitId} disabled />
        </Form.Item>

        {/* 可编辑字段 */}
        <Form.Item
          label="开始日期"
          name="startDate"
          rules={[{ required: true, message: "请选择开始日期" }]}
          getValueProps={(value) => ({
            value: value ? dayjs(value) : undefined,
          })}
          normalize={(value) => (value ? value.format("YYYY-MM-DD") : undefined)}
        >
          <DatePicker style={{ width: "100%" }} placeholder="请选择开始日期" />
        </Form.Item>

        <Form.Item
          label="结束日期"
          name="endDate"
          getValueProps={(value) => ({
            value: value ? dayjs(value) : undefined,
          })}
          normalize={(value) => (value ? value.format("YYYY-MM-DD") : undefined)}
        >
          <DatePicker style={{ width: "100%" }} placeholder="请选择结束日期（可选）" />
        </Form.Item>

        <Form.Item
          label="租金金额"
          name="rentAmount"
          rules={[
            { required: true, message: "请输入租金金额" },
            { type: "number", min: 0, message: "租金金额不能为负数" },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            placeholder="请输入租金金额"
            precision={2}
            min={0}
          />
        </Form.Item>

        <Form.Item
          label="押金金额"
          name="depositAmount"
          rules={[
            { type: "number", min: 0, message: "押金金额不能为负数" },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            placeholder="请输入押金金额（可选）"
            precision={2}
            min={0}
          />
        </Form.Item>

        <Form.Item
          label="计费周期"
          name="billCycle"
          rules={[{ required: true, message: "请选择计费周期" }]}
        >
          <Select placeholder="请选择计费周期">
            {Object.entries(billCycleLabels).map(([value, label]) => (
              <Select.Option key={value} value={value}>
                {label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="币种"
          name="currency"
        >
          <Input placeholder="币种（默认 CNY）" maxLength={10} />
        </Form.Item>

        <Form.Item
          label="状态"
          name="status"
        >
          <Select placeholder="请选择租约状态">
            {Object.entries(statusLabels).map(([value, label]) => (
              <Select.Option key={value} value={value}>
                {label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="备注" name="notes">
          <Input.TextArea
            rows={4}
            placeholder="请输入备注信息（可选）"
          />
        </Form.Item>
      </Form>
    </Edit>
  );
};

export default LeasesEdit;
