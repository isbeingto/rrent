import { Edit, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";
import { useCan } from "@refinedev/core";
import { useNavigate, useParams } from "react-router";
import React, { useEffect } from "react";

/**
 * Tenants Edit 页面 (FE-2-89)
 *
 * 编辑租客表单
 * - 字段：fullName, email, phone, idNumber, notes
 * - organizationId 不需要在表单中，由后端从 context 获取
 * - 前端校验：与 create 保持一致
 * - AccessControl：只有 OWNER/PROPERTY_MGR/OPERATOR 可访问
 */

const TenantsEdit: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  
  const { data: canEdit } = useCan({
    resource: "tenants",
    action: "edit",
    params: { id: params.id },
  });

  // 如果无权限，重定向到列表页
  useEffect(() => {
    if (canEdit && !canEdit.can) {
      navigate("/tenants");
    }
  }, [canEdit, navigate]);

  const { formProps, saveButtonProps } = useForm({
    resource: "tenants",
    action: "edit",
    id: params.id,
    redirect: "list",
  });

  return (
    <Edit saveButtonProps={saveButtonProps}>
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
    </Edit>
  );
};

export default TenantsEdit;
