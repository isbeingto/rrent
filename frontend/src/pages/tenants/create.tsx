import { Create, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";
import { useCan } from "@refinedev/core";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import React, { useEffect } from "react";
import {
  buildRequiredRule,
  buildEmailRule,
  buildPhoneRule,
  buildMaxLengthRule,
} from "../../shared/validation/rules";

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
  const { t } = useTranslation();
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
      <Form {...formProps} layout="vertical" scrollToFirstError>
        <Form.Item
          label={t("common:fields.tenantName")}
          name="fullName"
          rules={[
            buildRequiredRule(t, "tenantName"),
            buildMaxLengthRule(t, 100),
          ]}
        >
          <Input placeholder={t("common:fields.tenantName")} />
        </Form.Item>

        <Form.Item
          label={t("common:fields.tenantEmail")}
          name="email"
          rules={[
            buildRequiredRule(t, "tenantEmail"),
            buildEmailRule(t),
          ]}
        >
          <Input placeholder={t("common:fields.tenantEmail")} />
        </Form.Item>

        <Form.Item
          label={t("common:fields.tenantPhone")}
          name="phone"
          rules={[
            buildRequiredRule(t, "tenantPhone"),
            buildPhoneRule(t),
            buildMaxLengthRule(t, 20),
          ]}
        >
          <Input placeholder={t("common:fields.tenantPhone")} />
        </Form.Item>

        <Form.Item
          label={t("common:fields.tenantIdNumber")}
          name="idNumber"
          rules={[
            buildMaxLengthRule(t, 50),
          ]}
        >
          <Input placeholder={t("common:fields.tenantIdNumber")} />
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
