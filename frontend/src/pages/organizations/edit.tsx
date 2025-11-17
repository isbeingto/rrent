import { Edit, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";
import { useCan } from "@refinedev/core";
import { useNavigate, useParams } from "react-router";
import React, { useEffect } from "react";

/**
 * Organizations Edit 页面
 *
 * FE-2-83: 编辑组织表单
 * - 字段：name, description, timezone（code 不可修改）
 * - 前端校验：与 create 页面保持一致
 * - AccessControl：只有 OWNER/ADMIN 可访问
 */

const OrganizationsEdit: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  
  const { data: canEdit } = useCan({
    resource: "organizations",
    action: "edit",
    params: { id: params.id },
  });

  // 如果无权限，重定向到列表页
  useEffect(() => {
    if (canEdit && !canEdit.can) {
      navigate("/organizations");
    }
  }, [canEdit, navigate]);

  const { formProps, saveButtonProps } = useForm({
    resource: "organizations",
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
          label="组织名称"
          name="name"
          rules={[
            { required: true, message: "请输入组织名称" },
            { max: 100, message: "组织名称不能超过100个字符" },
          ]}
        >
          <Input placeholder="请输入组织名称" />
        </Form.Item>

        <Form.Item
          label="组织编码"
          name="code"
        >
          <Input disabled placeholder="组织编码不可修改" />
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
            placeholder="请输入组织描述（可选）"
          />
        </Form.Item>

        <Form.Item
          label="时区"
          name="timezone"
          rules={[
            { max: 50, message: "时区不能超过50个字符" },
          ]}
        >
          <Input placeholder="请输入时区（如：Asia/Shanghai，可选）" />
        </Form.Item>
      </Form>
    </Edit>
  );
};

export default OrganizationsEdit;
