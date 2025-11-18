/**
 * Unit Occupancy Logic (FE-3-98)
 *
 * 单元占用状态判定逻辑，基于最近一条 active lease
 * 根据租约状态和时间判定单元的占用情况
 */

/**
 * 租约状态枚举（对应后端 Prisma LeaseStatus）
 */
export enum LeaseStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  TERMINATED = "TERMINATED",
  EXPIRED = "EXPIRED",
}

/**
 * 占用状态类型
 */
export enum OccupancyStatus {
  OCCUPIED = "OCCUPIED", // 占用中
  UPCOMING = "UPCOMING", // 即将入住
  VACANT = "VACANT", // 空置
}

/**
 * 租约信息（用于占用判定）
 */
export interface ILease {
  id: string;
  status: LeaseStatus;
  startDate: string;
  endDate?: string | null;
  tenant?: {
    id: string;
    fullName: string;
  };
  rentAmount?: number | string;
}

/**
 * 占用信息结果
 */
export interface OccupancyInfo {
  status: OccupancyStatus;
  statusLabel: string;
  statusColor: string;
  lease?: ILease;
  tenantName?: string;
  tooltipText?: string;
}

/**
 * 占用状态标签映射
 */
export const occupancyStatusLabelMap: Record<OccupancyStatus, string> = {
  [OccupancyStatus.OCCUPIED]: "占用中",
  [OccupancyStatus.UPCOMING]: "即将入住",
  [OccupancyStatus.VACANT]: "空置",
};

/**
 * 占用状态颜色映射（Ant Design Tag 颜色）
 */
export const occupancyStatusColorMap: Record<OccupancyStatus, string> = {
  [OccupancyStatus.OCCUPIED]: "green",
  [OccupancyStatus.UPCOMING]: "blue",
  [OccupancyStatus.VACANT]: "default",
};

/**
 * 判定单元占用状态
 *
 * 业务规则：
 * 1. 占用中的状态：ACTIVE + 当前时间在 [startDate, endDate] 范围内（或无 endDate）
 * 2. 即将入住：PENDING + startDate 在未来
 * 3. 空置：无租约 / TERMINATED / EXPIRED / 其他状态
 *
 * @param lease 最近一条租约（按 startDate DESC 排序）
 * @returns 占用信息对象
 */
export function determineOccupancy(lease?: ILease | null): OccupancyInfo {
  // 无租约 → 空置
  if (!lease) {
    return {
      status: OccupancyStatus.VACANT,
      statusLabel: occupancyStatusLabelMap[OccupancyStatus.VACANT],
      statusColor: occupancyStatusColorMap[OccupancyStatus.VACANT],
    };
  }

  const now = new Date();
  const startDate = new Date(lease.startDate);
  const endDate = lease.endDate ? new Date(lease.endDate) : null;

  // 根据状态和时间判定
  switch (lease.status) {
    case LeaseStatus.ACTIVE: {
      // 检查时间范围
      const isInRange =
        now >= startDate && (endDate === null || now <= endDate);

      if (isInRange) {
        // 占用中
        return {
          status: OccupancyStatus.OCCUPIED,
          statusLabel: occupancyStatusLabelMap[OccupancyStatus.OCCUPIED],
          statusColor: occupancyStatusColorMap[OccupancyStatus.OCCUPIED],
          lease,
          tenantName: lease.tenant?.fullName,
          tooltipText: formatLeaseTooltip(lease),
        };
      } else {
        // ACTIVE 但时间超出范围，理论上应该被定时任务更新为 EXPIRED
        // 这里仍然显示为占用中，但实际应该联系后端修复
        return {
          status: OccupancyStatus.OCCUPIED,
          statusLabel: occupancyStatusLabelMap[OccupancyStatus.OCCUPIED],
          statusColor: occupancyStatusColorMap[OccupancyStatus.OCCUPIED],
          lease,
          tenantName: lease.tenant?.fullName,
          tooltipText: formatLeaseTooltip(lease),
        };
      }
    }

    case LeaseStatus.PENDING: {
      // 即将入住（开始日期在未来）
      if (now < startDate) {
        return {
          status: OccupancyStatus.UPCOMING,
          statusLabel: occupancyStatusLabelMap[OccupancyStatus.UPCOMING],
          statusColor: occupancyStatusColorMap[OccupancyStatus.UPCOMING],
          lease,
          tenantName: lease.tenant?.fullName,
          tooltipText: formatLeaseTooltip(lease),
        };
      } else {
        // PENDING 但开始日期已过，应该被激活或取消
        // 这里也视为即将入住，但实际应该联系后端处理
        return {
          status: OccupancyStatus.UPCOMING,
          statusLabel: occupancyStatusLabelMap[OccupancyStatus.UPCOMING],
          statusColor: occupancyStatusColorMap[OccupancyStatus.UPCOMING],
          lease,
          tenantName: lease.tenant?.fullName,
          tooltipText: formatLeaseTooltip(lease),
        };
      }
    }

    case LeaseStatus.TERMINATED:
    case LeaseStatus.EXPIRED:
    case LeaseStatus.DRAFT:
    default:
      // 空置
      return {
        status: OccupancyStatus.VACANT,
        statusLabel: occupancyStatusLabelMap[OccupancyStatus.VACANT],
        statusColor: occupancyStatusColorMap[OccupancyStatus.VACANT],
        lease,
        tooltipText: "最近租约已终止或过期",
      };
  }
}

/**
 * 格式化租约为 Tooltip 文本
 * @param lease 租约对象
 * @returns Tooltip 显示文本
 */
function formatLeaseTooltip(lease: ILease): string {
  const startDate = new Date(lease.startDate).toLocaleDateString("zh-CN");
  const endDate = lease.endDate
    ? new Date(lease.endDate).toLocaleDateString("zh-CN")
    : "未定";

  const tenantName = lease.tenant?.fullName || "未知租客";

  return `租客：${tenantName}\n租期：${startDate} ~ ${endDate}`;
}

/**
 * 格式化租约显示文本（用于列表列）
 * @param occupancyInfo 占用信息
 * @returns 显示文本
 */
export function formatOccupancyDisplay(occupancyInfo: OccupancyInfo): string {
  if (
    occupancyInfo.status === OccupancyStatus.VACANT ||
    !occupancyInfo.tenantName
  ) {
    return occupancyInfo.statusLabel;
  }

  return `${occupancyInfo.statusLabel} · ${occupancyInfo.tenantName}`;
}
