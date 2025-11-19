import { useOne, BaseRecord } from "@refinedev/core";

/**
 * 增强的 useOne hook，提供统一的 loading 和 empty 状态
 * 
 * 用于详情页（Show），简化 Skeleton 和 Empty 状态的处理
 * 
 * @example
 * ```tsx
 * const { data: org, isLoading, notFound } = useShowPage<IOrganization>({
 *   resource: "organizations",
 *   id: params.id,
 * });
 * 
 * if (isLoading) return <PageSkeleton />;
 * if (notFound) return <SectionEmpty type="notFound" />;
 * ```
 */

interface UseShowPageParams {
  resource: string;
  id?: string;
}

export function useShowPage<TData extends BaseRecord = BaseRecord>({ resource, id }: UseShowPageParams) {
  const { query } = useOne<TData>({
    resource,
    id: id || "",
    queryOptions: {
      enabled: !!id,
    },
  });

  const data = query.data?.data;
  const isLoading = query.isLoading;
  const notFound = !isLoading && !data;

  return {
    data,
    isLoading,
    notFound,
    query,
  };
}
