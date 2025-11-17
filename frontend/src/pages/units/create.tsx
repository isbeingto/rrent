import { Create, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Select } from "antd";
import { useCan, useList } from "@refinedev/core";
import { useNavigate } from "react-router";
import React, { useEffect } from "react";

/**
 * Units Create 页面 (FE-2-87)
 *
 * 新建单元表单
 * - 字段：unitNumber (必填), floor (可选), areaSqm (可选), bedrooms (可选),
 *         bathrooms (可选), status (必填，默认 VACANT), propertyId (必填), name (可选)
 * - 前端校验：unitNumber/propertyId 必填，数值字段为正数
 * - AccessControl：只有 OWNER/ADMIN 可访问
 */

interface IProperty {
  id: string;
  name: string;
  code?: string;
}

const UnitsCreate: React.FC = () => {
  const navigate = useNavigate();
  
  const { data: canCreate } = useCan({
    resource: "units",
    action: "create",
  });

  // 如果无权限，重定向到列表页
  useEffect(() => {
    if (canCreate && !canCreate.can) {
      navigate("/units");
    }
  }, [canCreate, navigate]);

  const { formProps, saveButtonProps } = useForm({
    resource: "units",
    action: "create",
    redirect: "list",
  });

  // 获取 Properties 列表用于下拉选择
  const { result: propertiesResult } = useList<IProperty>({
    resource: "properties",
    pagination: { pageSize: 100 },
    queryOptions: { enabled: true },
  });

  const properties = (propertiesResult?.data || []) as IProperty[];

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" initialValues={{ status: "VACANT" }}>
        <Form.Item
          label="单元编号"
          name="unitNumber"
          rules={[
            { required: true, message: "请输入单元编号" },
            { max: 50, message: "单元编号不能超过50个字符" },
          ]}
        >
          <Input placeholder="请输入单元编号（如：101、A-201）" />
        </Form.Item>

        <Form.Item
          label="单元名称"
          name="name"
          rules={[
            { max: 100, message: "单元名称不能超过100个字符" },
          ]}
        >
          <Input placeholder="请输入单元名称（可选）" />
        </Form.Item>

        <Form.Item
          label="所属物业"
          name="propertyId"
          rules={[
            { required: true, message: "请选择所属物业" },
          ]}
        >
          <Select
            placeholder="请选择物业"
            options={properties.map((prop) => ({
              label: prop.name,
              value: prop.id,
            }))}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          label="楼层"
          name="floor"
          rules={[
            { type: "number", message: "楼层必须是数字" },
          ]}
        >
          <InputNumber
            placeholder="请输入楼层（可选）"
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          label="面积（㎡）"
          name="areaSqm"
          rules={[
            { type: "number", message: "面积必须是数字" },
            {
              validator: (_, value) => {
                if (value !== undefined && value !== null && value <= 0) {
                  return Promise.reject(new Error("面积必须大于0"));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber
            placeholder="请输入面积"
            min={0}
            step={0.1}
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          label="卧室数"
          name="bedrooms"
          rules={[
            { type: "number", message: "卧室数必须是数字" },
          ]}
        >
          <InputNumber
            placeholder="请输入卧室数（可选）"
            min={0}
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          label="浴室数"
          name="bathrooms"
          rules={[
            { type: "number", message: "浴室数必须是数字" },
          ]}
        >
          <InputNumber
            placeholder="请输入浴室数（可选）"
            min={0}
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          label="状态"
          name="status"
          rules={[
            { required: true, message: "请选择单元状态" },
          ]}
        >
          <Select
            placeholder="请选择状态"
            options={[
              { label: "空置", value: "VACANT" },
              { label: "已出租", value: "OCCUPIED" },
              { label: "预订", value: "RESERVED" },
              { label: "维护中", value: "MAINTENANCE" },
              { label: "下线", value: "OFFLINE" },
            ]}
          />
        </Form.Item>
      </Form>
    </Create>
  );
};

export default UnitsCreate;
