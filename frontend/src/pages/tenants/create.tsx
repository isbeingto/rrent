import { Create, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";
import { useCan } from "@refinedev/core";
import { useNavigate } from "react-router";
import React, { useEffect } from "react";

/**
 * Tenants Create 页面 (FE-2-89)
 *
 * 新建租客表单
 * - 字段：fullName (必填), email (必填), phone (必填), idNumber (可选), notes (可选)
 * - organizationId 由 dataProvider 自动注入到 body 中
 * - 前端校验：fullName/email/phone 必填，email 格式，phone 长度
 * - AccessControl：只有 OWNER/PROPERTY_MGR/OPERATOR 可访问
 */

const TenantsCreate: React.FC = () => {
  const navigate = useNavigate();
  
  const { data: canCreate } = useCan({
    resource: "tenants",
    action: "create",
  });

  // 如果无权限，重定向到列表页
  useEffect(() => {
    if (canCreate && !canCreate.can) {
      navigate("/tenants");
    }
  }, [canCreate, navigate]);

  const { formProps, saveButtonProps } = useForm({
    resource: "tenants",
    action: "create",
    redirect: "list",
  });

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="姓名"
          name="fullName"
          rules={[
            { required: true, message: "请输入租客姓名" },
            { max: 100, message: "姓名不能超过100个字符" },
          ]}
        >
          <Input placeholder="请输入租客姓名" />
        </Form.Item>

        <Form.Item
          label="邮箱"
          name="email"
          rules={[
            { required: true, message: "请输入邮箱地址" },
            { type: "email", message: "请输入有效的邮箱地址" },
          ]}
        >
          <Input placeholder="请输入邮箱地址" />
        </Form.Item>

        <Form.Item
          label="电话"
          name="phone"
          rules={[
            { required: true, message: "请输入电话号码" },
            { max: 20, message: "电话号码不能超过20个字符" },
            { pattern: /^[0-9+\-\s()]+$/, message: "请输入有效的电话号码" },
          ]}
        >
          <Input placeholder="请输入电话号码" />
        </Form.Item>

        <Form.Item
          label="身份证号"
          name="idNumber"
          rules={[
            { max: 50, message: "身份证号不能超过50个字符" },
          ]}
        >
          <Input placeholder="请输入身份证号（可选）" />
        </Form.Item>

        <Form.Item
          label="备注"
          name="notes"
        >
          <Input.TextArea 
            rows={4} 
            placeholder="请输入备注信息（可选）" 
          />
        </Form.Item>
      </Form>
    </Create>
  );
};

export default TenantsCreate;
