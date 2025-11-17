import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Switch, Select } from "antd";
import { useCan } from "@refinedev/core";
import { useNavigate, useParams } from "react-router";
import React, { useEffect } from "react";

/**
 * Properties Edit 页面
 *
 * FE-2-85: 编辑物业表单
 * - 字段：name, description, addressLine1, addressLine2, city, state, 
 *         postalCode, country, timezone, isActive（code 不可修改）
 * - 前端校验：与 create 页面保持一致
 * - AccessControl：只有 OWNER/ADMIN 可访问
 */

const PropertiesEdit: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  
  const { data: canEdit } = useCan({
    resource: "properties",
    action: "edit",
    params: { id: params.id },
  });

  // 如果无权限，重定向到列表页
  useEffect(() => {
    if (canEdit && !canEdit.can) {
      navigate("/properties");
    }
  }, [canEdit, navigate]);

  const { formProps, saveButtonProps } = useForm({
    resource: "properties",
    action: "edit",
    id: params.id,
    redirect: "list",
  });

  return (
    <Edit
      saveButtonProps={saveButtonProps}
    >
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="物业名称"
          name="name"
          rules={[
            { required: true, message: "请输入物业名称" },
            { max: 100, message: "物业名称不能超过100个字符" },
          ]}
        >
          <Input placeholder="请输入物业名称" />
        </Form.Item>

        <Form.Item
          label="物业编码"
          name="code"
        >
          <Input disabled placeholder="物业编码不可修改" />
        </Form.Item>

        <Form.Item
          label="描述"
          name="description"
          rules={[
            { max: 500, message: "描述不能超过500个字符" },
          ]}
        >
          <Input.TextArea
            rows={4}
            placeholder="请输入物业描述（可选）"
          />
        </Form.Item>

        <Form.Item
          label="地址第一行"
          name="addressLine1"
          rules={[
            { max: 200, message: "地址第一行不能超过200个字符" },
          ]}
        >
          <Input placeholder="请输入街道地址" />
        </Form.Item>

        <Form.Item
          label="地址第二行"
          name="addressLine2"
          rules={[
            { max: 200, message: "地址第二行不能超过200个字符" },
          ]}
        >
          <Input placeholder="请输入楼栋、单元等补充地址信息" />
        </Form.Item>

        <Form.Item
          label="城市"
          name="city"
          rules={[
            { max: 100, message: "城市不能超过100个字符" },
          ]}
        >
          <Input placeholder="请输入城市" />
        </Form.Item>

        <Form.Item
          label="省份/州"
          name="state"
          rules={[
            { max: 100, message: "省份/州不能超过100个字符" },
          ]}
        >
          <Input placeholder="请输入省份或州" />
        </Form.Item>

        <Form.Item
          label="邮政编码"
          name="postalCode"
          rules={[
            { max: 20, message: "邮政编码不能超过20个字符" },
          ]}
        >
          <Input placeholder="请输入邮政编码" />
        </Form.Item>

        <Form.Item
          label="国家"
          name="country"
          rules={[
            { max: 2, message: "国家代码不能超过2个字符" },
          ]}
        >
          <Select placeholder="请选择国家">
            <Select.Option value="CN">中国 (CN)</Select.Option>
            <Select.Option value="US">美国 (US)</Select.Option>
            <Select.Option value="UK">英国 (UK)</Select.Option>
            <Select.Option value="JP">日本 (JP)</Select.Option>
            <Select.Option value="SG">新加坡 (SG)</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="时区"
          name="timezone"
          rules={[
            { max: 50, message: "时区不能超过50个字符" },
          ]}
        >
          <Select placeholder="请选择时区">
            <Select.Option value="Asia/Shanghai">Asia/Shanghai</Select.Option>
            <Select.Option value="America/New_York">America/New_York</Select.Option>
            <Select.Option value="Europe/London">Europe/London</Select.Option>
            <Select.Option value="Asia/Tokyo">Asia/Tokyo</Select.Option>
            <Select.Option value="Asia/Singapore">Asia/Singapore</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="启用状态"
          name="isActive"
          valuePropName="checked"
        >
          <Switch checkedChildren="启用" unCheckedChildren="禁用" />
        </Form.Item>
      </Form>
    </Edit>
  );
};

export default PropertiesEdit;
