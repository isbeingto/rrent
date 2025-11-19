import { Edit, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";
import { useCan } from "@refinedev/core";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import React, { useEffect } from "react";
import {
  buildRequiredRule,
  buildEmailRule,
  buildPhoneRule,
  buildMaxLengthRule,
} from "../../shared/validation/rules";

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
  const { t } = useTranslation();
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
    </Edit>
  );
};

export default TenantsEdit;
