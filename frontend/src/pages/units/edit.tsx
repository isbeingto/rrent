import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Select } from "antd";
import { useCan, useList } from "@refinedev/core";
import { useNavigate, useParams } from "react-router";
import React, { useEffect } from "react";

/**
 * Units Edit 页面 (FE-2-87)
 *
 * 编辑单元表单
 * - 字段：unitNumber (不可修改), floor, areaSqm, bedrooms, bathrooms, status, name
 * - propertyId 可以更改（根据业务需求）
 * - 前端校验：与 create 保持一致
 * - AccessControl：只有 OWNER/ADMIN 可访问
 */

interface IProperty {
  id: string;
  name: string;
  code?: string;
}

const UnitsEdit: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  
  const { data: canEdit } = useCan({
    resource: "units",
    action: "edit",
    params: { id: params.id },
  });

  // 如果无权限，重定向到列表页
  useEffect(() => {
    if (canEdit && !canEdit.can) {
      navigate("/units");
    }
  }, [canEdit, navigate]);

  const { formProps, saveButtonProps } = useForm({
    resource: "units",
    action: "edit",
    id: params.id,
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
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="单元编号"
          name="unitNumber"
          rules={[
            { required: true, message: "请输入单元编号" },
            { max: 50, message: "单元编号不能超过50个字符" },
          ]}
        >
          <Input placeholder="请输入单元编号" />
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
    </Edit>
  );
};

export default UnitsEdit;
