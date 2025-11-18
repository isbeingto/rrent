import { Create, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, InputNumber, DatePicker, Select } from "antd";
import { useCan } from "@refinedev/core";
import { useNavigate, useSearchParams } from "react-router";
import React, { useEffect } from "react";
import dayjs from "dayjs";

/**
 * Leases Create 页面 (FE-2-91)
 *
 * 新建租约表单
 * - 字段：
 *   - tenantId (必填，下拉选择)
 *   - unitId (必填，下拉选择)
 *   - propertyId (必填，下拉选择)
 *   - startDate (必填)
 *   - endDate (可选)
 *   - rentAmount (必填)
 *   - depositAmount (可选)
 *   - billCycle (必填，枚举)
 *   - status (可选，默认 PENDING)
 *   - notes (可选)
 * - organizationId 由 dataProvider 自动注入到 body 中（FE-2-91 修正）
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

const LeasesCreate: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // 从 URL 读取预填参数
  const prefilledUnitId = searchParams.get("unitId");
  const prefilledPropertyId = searchParams.get("propertyId");
  
  const { data: canCreate } = useCan({
    resource: "leases",
    action: "create",
  });

  // 如果无权限，重定向到列表页
  useEffect(() => {
    if (canCreate && !canCreate.can) {
      navigate("/leases");
    }
  }, [canCreate, navigate]);

  const { formProps, saveButtonProps, form } = useForm({
    resource: "leases",
    action: "create",
    redirect: "list",
  });

  // 当预填参数存在时，设置表单初始值
  useEffect(() => {
    if (prefilledUnitId || prefilledPropertyId) {
      const initialValues: Record<string, string> = {};
      if (prefilledUnitId) initialValues.unitId = prefilledUnitId;
      if (prefilledPropertyId) initialValues.propertyId = prefilledPropertyId;
      form?.setFieldsValue(initialValues);
    }
  }, [prefilledUnitId, prefilledPropertyId, form]);

  // 加载租客列表
  const { selectProps: tenantSelectProps } = useSelect({
    resource: "tenants",
    optionLabel: "fullName",
    optionValue: "id",
    pagination: {
      pageSize: 100, // 加载更多租客供选择
    },
  });

  // 加载单元列表
  const { selectProps: unitSelectProps } = useSelect({
    resource: "units",
    optionLabel: "unitNumber",
    optionValue: "id",
    pagination: {
      pageSize: 100,
    },
  });

  // 加载物业列表
  const { selectProps: propertySelectProps } = useSelect({
    resource: "properties",
    optionLabel: "name",
    optionValue: "id",
    pagination: {
      pageSize: 100,
    },
  });

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="租客"
          name="tenantId"
          rules={[{ required: true, message: "请选择租客" }]}
        >
          <Select
            {...tenantSelectProps}
            placeholder="请选择租客"
            showSearch
            filterOption={(input, option) =>
              (option?.label?.toString() ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          label="物业"
          name="propertyId"
          rules={[{ required: true, message: "请选择物业" }]}
        >
          <Select
            {...propertySelectProps}
            placeholder="请选择物业"
            disabled={!!prefilledPropertyId}
            showSearch
            filterOption={(input, option) =>
              (option?.label?.toString() ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          label="单元"
          name="unitId"
          rules={[{ required: true, message: "请选择单元" }]}
        >
          <Select
            {...unitSelectProps}
            placeholder="请选择单元"
            disabled={!!prefilledUnitId}
            showSearch
            filterOption={(input, option) =>
              (option?.label?.toString() ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          label="开始日期"
          name="startDate"
          rules={[{ required: true, message: "请选择开始日期" }]}
          getValueProps={(value) => ({
            value: value ? dayjs(value) : undefined,
          })}
          normalize={(value) => (value ? value.toISOString() : undefined)}
        >
          <DatePicker style={{ width: "100%" }} placeholder="请选择开始日期" />
        </Form.Item>

        <Form.Item
          label="结束日期"
          name="endDate"
          getValueProps={(value) => ({
            value: value ? dayjs(value) : undefined,
          })}
          normalize={(value) => (value ? value.toISOString() : undefined)}
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
          initialValue={BillCycle.MONTHLY}
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
          initialValue="CNY"
        >
          <Input placeholder="币种（默认 CNY）" maxLength={10} />
        </Form.Item>

        <Form.Item
          label="状态"
          name="status"
          initialValue={LeaseStatus.PENDING}
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
    </Create>
  );
};

export default LeasesCreate;
