import { TFunction } from "i18next";
import { Rule } from "antd/es/form";

/**
 * 统一表单校验规则生成器
 * 
 * FE-5-108: 表单校验提示统一
 * 
 * 集中管理所有常用的表单验证规则，确保：
 * 1. 错误文案统一走 i18n
 * 2. 不同页面使用相同的规则生成同样的错误提示
 * 3. 易于维护和扩展
 */

/**
 * 生成必填字段规则
 * @param t i18next 函数
 * @param fieldKey 字段 i18n key (如 "tenantName")
 * @example
 * rules={[buildRequiredRule(t, "tenantName")]}
 */
export const buildRequiredRule = (t: TFunction, fieldKey: string): Rule => ({
  required: true,
  message: t("common:validation.required", {
    field: t(`common:fields.${fieldKey}`),
    defaultValue: `请输入${fieldKey}`,
  }),
});

/**
 * 生成必选下拉框规则（与 buildRequiredRule 文案略有不同）
 * @param t i18next 函数
 * @param fieldKey 字段 i18n key
 * @example
 * rules={[buildRequiredSelectRule(t, "leaseProperty")]}
 */
export const buildRequiredSelectRule = (t: TFunction, fieldKey: string): Rule => ({
  required: true,
  message: t("common:validation.requiredSelect", {
    field: t(`common:fields.${fieldKey}`),
    defaultValue: `请选择${fieldKey}`,
  }),
});

/**
 * 生成邮箱校验规则
 * @param t i18next 函数
 * @example
 * rules={[buildRequiredRule(t, "email"), buildEmailRule(t)]}
 */
export const buildEmailRule = (t: TFunction): Rule => ({
  type: "email",
  message: t("common:validation.email"),
});

/**
 * 生成手机号规则（简单正则验证）
 * @param t i18next 函数
 * @example
 * rules={[buildPhoneRule(t)]}
 */
export const buildPhoneRule = (t: TFunction): Rule => ({
  pattern: /^[0-9+\-\s()]*$/,
  message: t("common:validation.phone"),
});

/**
 * 生成正数验证规则
 * @param t i18next 函数
 * @example
 * rules={[buildRequiredRule(t, "rentAmount"), buildPositiveNumberRule(t)]}
 */
export const buildPositiveNumberRule = (t: TFunction): Rule => ({
  validator: (_, value) => {
    if (value !== undefined && value !== null && value <= 0) {
      return Promise.reject(
        new Error(t("common:validation.positiveNumber"))
      );
    }
    return Promise.resolve();
  },
});

/**
 * 生成最大长度规则
 * @param t i18next 函数
 * @param max 最大长度
 * @example
 * rules={[buildMaxLengthRule(t, 100)]}
 */
export const buildMaxLengthRule = (t: TFunction, max: number): Rule => ({
  max,
  message: t("common:validation.maxLength", {
    max,
    defaultValue: `最多输入 ${max} 个字符`,
  }),
});

/**
 * 生成最小长度规则
 * @param t i18next 函数
 * @param min 最小长度
 * @example
 * rules={[buildMinLengthRule(t, 6)]}
 */
export const buildMinLengthRule = (t: TFunction, min: number): Rule => ({
  min,
  message: t("common:validation.minLength", {
    min,
    defaultValue: `至少输入 ${min} 个字符`,
  }),
});

/**
 * 生成日期范围校验规则（endDate >= startDate）
 * @param t i18next 函数
 * @param form Form 实例（用于获取 startDate 字段值）
 * @example
 * rules={[buildDateRangeRule(t, form)]}
 */
export const buildDateRangeRule = (
  t: TFunction,
  form: { getFieldValue: (fieldName: string) => unknown } | null
): Rule => ({
  validator: (_, value) => {
    if (!value) return Promise.resolve();

    if (!form) return Promise.resolve();
    
    const startDate = form.getFieldValue("startDate");
    if (!startDate) return Promise.resolve();

    if (new Date(value as string) < new Date(startDate as string)) {
      return Promise.reject(new Error(t("common:validation.dateRange")));
    }
    return Promise.resolve();
  },
});

/**
 * 生成金额字段规则（正数 + 小数位限制）
 * 
 * TODO: 后续可根据需求扩展，如：
 * - 支持最大金额限制
 * - 支持最小金额限制
 * 
 * @param t i18next 函数
 * @example
 * rules={[buildRequiredRule(t, "rentAmount"), buildAmountRule(t)]}
 */
export const buildAmountRule = (t: TFunction): Rule => ({
  validator: (_, value) => {
    if (value === undefined || value === null || value === "") {
      return Promise.resolve();
    }
    
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    
    // 检查是否为有效数字
    if (isNaN(numValue)) {
      return Promise.reject(
        new Error(t("common:validation.number"))
      );
    }
    
    // 检查是否为正数
    if (numValue <= 0) {
      return Promise.reject(
        new Error(t("common:validation.positiveNumber"))
      );
    }
    
    return Promise.resolve();
  },
});

/**
 * 生成密码规则（最小长度 6）
 * @param t i18next 函数
 * @example
 * rules={[buildRequiredRule(t, "password"), buildPasswordRule(t)]}
 */
export const buildPasswordRule = (t: TFunction): Rule => ({
  min: 6,
  message: t("common:validation.password.minLength", {
    min: 6,
    defaultValue: "密码长度至少 6 位",
  }),
});

/**
 * 模式匹配规则工厂函数
 * @param t i18next 函数
 * @param pattern 正则表达式
 * @param fieldName 字段名称（用于错误提示）
 * @example
 * rules={[buildPatternRule(t, /^[A-Z0-9]+$/, "组织编码")]}
 */
export const buildPatternRule = (
  t: TFunction,
  pattern: RegExp,
  fieldName?: string
): Rule => ({
  pattern,
  message: fieldName
    ? t("common:validation.pattern") + ` (${fieldName})`
    : t("common:validation.pattern"),
});

/**
 * 自定义验证规则工厂函数
 * 用于复杂业务规则（通常已有自定义 validator 的场景）
 * 
 * @param validator 自定义验证函数
 * @param message 错误提示（来自 i18n）
 * @example
 * rules={[
 *   buildCustomRule(
 *     (_, value) => value > someThreshold ? Promise.resolve() : Promise.reject(),
 *     t("custom.error.message")
 *   )
 * ]}
 */
export const buildCustomRule = (
  validator: (rule: Rule, value: unknown) => Promise<void>,
  message?: string
): Rule => ({
  validator: async (_, value) => {
    try {
      await validator({} as Rule, value);
    } catch {
      throw new Error(message || "验证失败");
    }
  },
});

/**
 * 合并多个规则
 * 简化语法糖，用于组合多个规则
 * 
 * @param rules Rule[] 规则数组
 * @returns Rule[] 合并后的规则数组
 * @example
 * rules={mergeRules([
 *   buildRequiredRule(t, "email"),
 *   buildEmailRule(t)
 * ])}
 */
export const mergeRules = (rules: Rule[]): Rule[] => rules.filter(Boolean);
