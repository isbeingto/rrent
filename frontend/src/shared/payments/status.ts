/**
 * Payment Status Computation Module (FE-3-99)
 * 
 * 提供支付单状态相关的计算函数，包括：
 * - 逾期天数计算
 * - 距到期天数计算
 * - 状态徽标配置
 * - 风险等级评估
 * 
 * 业务规则：
 * - overdueDays: 仅对 OVERDUE 或 PENDING 且 today > dueDate 计算
 * - daysToDue: 对 PENDING 且 today <= dueDate 计算
 * - 所有日期计算基于自然日（不考虑时分秒）
 */

import dayjs from "dayjs";

export enum PaymentStatus {
  PENDING = "PENDING",
  PARTIAL = "PARTIAL",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  CANCELED = "CANCELED",
}

export type RiskLevel = "safe" | "warning" | "danger" | "neutral";

export interface PaymentStatusMeta {
  // 徽标相关
  badgeStatus: PaymentStatus;
  badgeText: string;
  badgeColor: string;
  
  // 计算字段
  overdueDays: number | null;  // 逾期天数（null 表示未逾期或不适用）
  daysToDue: number | null;    // 距到期天数（null 表示已逾期或不适用）
  
  // 风险等级
  riskLevel: RiskLevel;
  
  // 辅助信息
  dueInfo: string;  // 到期信息文案，如"逾期 3 天"、"还剩 2 天"
  isUpcoming: boolean;  // 是否即将到期（<=3 天）
}

export interface PaymentInput {
  status: PaymentStatus | string;
  dueDate?: string | null;
  paidAt?: string | null;
}

/**
 * 计算两个日期之间的天数差（向下取整）
 * @param date1 较晚的日期
 * @param date2 较早的日期
 * @returns 天数差（自然日）
 */
function daysBetween(date1: Date, date2: Date): number {
  const d1 = dayjs(date1).startOf('day');
  const d2 = dayjs(date2).startOf('day');
  return d1.diff(d2, 'day');
}

/**
 * 计算支付单的状态元数据
 * @param payment 支付单数据（必须包含 status 和 dueDate）
 * @param now 当前时间（默认为当前系统时间，测试时可传入模拟时间）
 * @returns PaymentStatusMeta 对象
 */
export function computePaymentStatusMeta(
  payment: PaymentInput,
  now: Date = new Date()
): PaymentStatusMeta {
  const status = payment.status as PaymentStatus;
  const dueDate = payment.dueDate ? new Date(payment.dueDate) : null;
  const paidAt = payment.paidAt ? new Date(payment.paidAt) : null;
  
  // 默认值
  const meta: PaymentStatusMeta = {
    badgeStatus: status,
    badgeText: "",
    badgeColor: "",
    overdueDays: null,
    daysToDue: null,
    riskLevel: "neutral",
    dueInfo: "-",
    isUpcoming: false,
  };
  
  // 根据状态设置徽标和风险等级
  switch (status) {
    case PaymentStatus.PENDING:
      meta.badgeText = "待支付";
      meta.badgeColor = "blue";
      meta.riskLevel = "neutral";
      
      if (dueDate) {
        const days = daysBetween(dueDate, now);
        
        if (days < 0) {
          // 已逾期（但状态还是 PENDING，可能是后台任务未更新）
          meta.overdueDays = Math.abs(days);
          meta.dueInfo = `逾期 ${meta.overdueDays} 天`;
          meta.riskLevel = "danger";
        } else if (days === 0) {
          // 今天到期
          meta.daysToDue = 0;
          meta.dueInfo = "今天到期";
          meta.riskLevel = "warning";
          meta.isUpcoming = true;
        } else {
          // 未到期
          meta.daysToDue = days;
          meta.dueInfo = `还剩 ${days} 天`;
          
          // 即将到期（<=3 天）
          if (days <= 3) {
            meta.isUpcoming = true;
            meta.riskLevel = "warning";
          } else {
            meta.riskLevel = "safe";
          }
        }
      }
      break;
      
    case PaymentStatus.OVERDUE:
      meta.badgeText = "已逾期";
      meta.badgeColor = "red";
      meta.riskLevel = "danger";
      
      if (dueDate) {
        const days = daysBetween(now, dueDate);
        meta.overdueDays = Math.max(0, days);
        meta.dueInfo = `逾期 ${meta.overdueDays} 天`;
      } else {
        meta.dueInfo = "已逾期";
      }
      break;
      
    case PaymentStatus.PAID:
      meta.badgeText = "已支付";
      meta.badgeColor = "green";
      meta.riskLevel = "safe";
      
      if (paidAt) {
        meta.dueInfo = `已于 ${dayjs(paidAt).format('YYYY-MM-DD')} 支付`;
      } else {
        meta.dueInfo = "已支付";
      }
      break;
      
    case PaymentStatus.PARTIAL:
      meta.badgeText = "部分支付";
      meta.badgeColor = "orange";
      meta.riskLevel = "warning";
      meta.dueInfo = "部分支付";
      break;
      
    case PaymentStatus.CANCELED:
      meta.badgeText = "已取消";
      meta.badgeColor = "default";
      meta.riskLevel = "neutral";
      meta.dueInfo = "已取消";
      break;
      
    default:
      meta.badgeText = status || "未知";
      meta.badgeColor = "default";
      meta.dueInfo = "-";
  }
  
  return meta;
}

/**
 * 格式化到期日期显示（包含计算信息）
 * @param payment 支付单数据
 * @param now 当前时间
 * @returns 格式化后的字符串，如 "2025-02-01 · 逾期 3 天"
 */
export function formatDueDateWithInfo(
  payment: PaymentInput,
  now: Date = new Date()
): string {
  if (!payment.dueDate) {
    return "-";
  }
  
  const meta = computePaymentStatusMeta(payment, now);
  const dateStr = dayjs(payment.dueDate).format('YYYY-MM-DD');
  
  return `${dateStr} · ${meta.dueInfo}`;
}

/**
 * 获取风险等级对应的 Ant Design 颜色
 */
export function getRiskColor(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case "safe":
      return "#52c41a";
    case "warning":
      return "#faad14";
    case "danger":
      return "#ff4d4f";
    case "neutral":
    default:
      return "#d4d4d4";
  }
}
