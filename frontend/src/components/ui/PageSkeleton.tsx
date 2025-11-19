import React from "react";
import { Skeleton, Card } from "antd";

/**
 * 页面加载骨架屏
 * 
 * 用于详情页（Show）的加载状态
 * - 模拟卡片 + 描述列表的结构
 * - 避免内容突然出现造成的布局跳动
 * 
 * 使用场景：
 * - Organizations/Properties/Units/Tenants/Leases/Payments Show 页面
 * - 在 useOne()/useShow() 返回 isLoading === true 时显示
 */

interface PageSkeletonProps {
  /** 是否显示标题骨架（可选，默认 true） */
  showTitle?: boolean;
  
  /** 段落行数（可选，默认 8） */
  rows?: number;
  
  /** 是否激活动画（可选，默认 true） */
  active?: boolean;
}

export const PageSkeleton: React.FC<PageSkeletonProps> = ({
  showTitle = true,
  rows = 8,
  active = true,
}) => {
  return (
    <Card>
      <Skeleton
        active={active}
        title={showTitle}
        paragraph={{
          rows,
          width: ["100%", "95%", "90%", "95%", "100%", "85%", "95%", "90%"],
        }}
      />
    </Card>
  );
};
