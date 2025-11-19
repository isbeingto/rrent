import { Create, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, InputNumber, DatePicker, Select } from "antd";
import { useCan } from "@refinedev/core";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import React, { useEffect } from "react";
import dayjs from "dayjs";
import {
  buildRequiredSelectRule,
  buildAmountRule,
  buildDateRangeRule,
} from "../../shared/validation/rules";

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
  const { t } = useTranslation();
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
    onMutationError: (error: unknown) => {
      // 提交失败使用统一文案
      const message =
        (error as Record<string, unknown>)?.message ||
        t("common:form.submitFailed");
      return { message };
    },
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
      <Form {...formProps} layout="vertical" scrollToFirstError>
        <Form.Item
          label={t("common:fields.leaseTenant")}
          name="tenantId"
          rules={[buildRequiredSelectRule(t, "leaseTenant")]}
        >
          <Select
            {...tenantSelectProps}
            placeholder={t("common:fields.leaseTenant")}
            showSearch
            filterOption={(input, option) =>
              (option?.label?.toString() ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          label={t("common:fields.leaseProperty")}
          name="propertyId"
          rules={[buildRequiredSelectRule(t, "leaseProperty")]}
        >
          <Select
            {...propertySelectProps}
            placeholder={t("common:fields.leaseProperty")}
            disabled={!!prefilledPropertyId}
            showSearch
            filterOption={(input, option) =>
              (option?.label?.toString() ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          label={t("common:fields.leaseUnit")}
          name="unitId"
          rules={[buildRequiredSelectRule(t, "leaseUnit")]}
        >
          <Select
            {...unitSelectProps}
            placeholder={t("common:fields.leaseUnit")}
            disabled={!!prefilledUnitId}
            showSearch
            filterOption={(input, option) =>
              (option?.label?.toString() ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          label={t("common:fields.leaseStartDate")}
          name="startDate"
          rules={[{ required: true, message: t("common:validation.required", { field: t("common:fields.leaseStartDate") }) }]}
          getValueProps={(value) => ({
            value: value ? dayjs(value) : undefined,
          })}
          normalize={(value) => (value ? value.toISOString() : undefined)}
        >
          <DatePicker style={{ width: "100%" }} placeholder={t("common:fields.leaseStartDate")} />
        </Form.Item>

        <Form.Item
          label={t("common:fields.leaseEndDate")}
          name="endDate"
          rules={[buildDateRangeRule(t, form)]}
          getValueProps={(value) => ({
            value: value ? dayjs(value) : undefined,
          })}
          normalize={(value) => (value ? value.toISOString() : undefined)}
        >
          <DatePicker style={{ width: "100%" }} placeholder={t("common:fields.leaseEndDate")} />
        </Form.Item>

        <Form.Item
          label={t("common:fields.rentAmount")}
          name="rentAmount"
          rules={[
            { required: true, message: t("common:validation.required", { field: t("common:fields.rentAmount") }) },
            buildAmountRule(t),
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            placeholder={t("common:fields.rentAmount")}
            precision={2}
            min={0}
          />
        </Form.Item>

        <Form.Item
          label={t("common:fields.depositAmount")}
          name="depositAmount"
          rules={[buildAmountRule(t)]}
        >
          <InputNumber
            style={{ width: "100%" }}
            placeholder={t("common:fields.depositAmount")}
            precision={2}
            min={0}
          />
        </Form.Item>

        <Form.Item
          label={t("common:fields.billCycle")}
          name="billCycle"
          rules={[buildRequiredSelectRule(t, "billCycle")]}
          initialValue={BillCycle.MONTHLY}
        >
          <Select placeholder={t("common:fields.billCycle")}>
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
          <Input placeholder="CNY" maxLength={10} />
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
