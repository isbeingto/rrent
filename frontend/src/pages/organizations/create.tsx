import { Create, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";
import { useCan } from "@refinedev/core";
import { useNavigate } from "react-router";
import React, { useEffect } from "react";

/**
 * Organizations Create 页面
 *
 * FE-2-83: 新建组织表单
 * - 字段：name (必填), code (必填), description (可选), timezone (可选)
 * - 前端校验：name/code 不为空，code 格式校验
 * - AccessControl：只有 OWNER/ADMIN 可访问
 */

const OrganizationsCreate: React.FC = () => {
  const navigate = useNavigate();
  
  const { data: canCreate } = useCan({
    resource: "organizations",
    action: "create",
  });

  // 如果无权限，重定向到列表页
  useEffect(() => {
    if (canCreate && !canCreate.can) {
      navigate("/organizations");
    }
  }, [canCreate, navigate]);

  const { formProps, saveButtonProps } = useForm({
    resource: "organizations",
    action: "create",
    redirect: "list",
  });

  return (
    <Create saveButtonProps={saveButtonProps}>
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
          rules={[
            { required: true, message: "请输入组织编码" },
            { min: 3, message: "组织编码至少3个字符" },
            { max: 50, message: "组织编码不能超过50个字符" },
            {
              pattern: /^[a-zA-Z0-9-]+$/,
              message: "组织编码只能包含字母、数字和连字符",
            },
          ]}
        >
          <Input placeholder="请输入组织编码（如：org-001）" />
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
    </Create>
  );
};

export default OrganizationsCreate;
