export type SortOrder = "asc" | "desc";

export interface ListQuery {
  page: number;
  pageSize: number;
  sort?: string;
  order?: SortOrder;
  raw: Record<string, unknown>;
}

function toPositiveInteger(value: unknown): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  const rounded = Math.trunc(parsed);
  if (rounded < 1 || rounded !== parsed) {
    return undefined;
  }

  return rounded;
}

function toRange(
  query: Record<string, unknown>,
): { page: number; pageSize: number } | undefined {
  const start = Number(query["_start"]);
  const end = Number(query["_end"]);

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return undefined;
  }

  const pageSize = end - start;
  if (
    pageSize <= 0 ||
    !Number.isInteger(pageSize) ||
    !Number.isInteger(start) ||
    !Number.isInteger(end)
  ) {
    return undefined;
  }

  return {
    page: Math.floor(start / pageSize) + 1,
    pageSize,
  };
}

function normalizeSort(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return undefined;
}

function normalizeOrder(value: unknown): SortOrder | undefined {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "asc" || normalized === "desc") {
      return normalized;
    }
  }
  return undefined;
}

export function parseListQuery(
  query: Record<string, unknown>,
  defaults?: { page?: number; pageSize?: number },
): ListQuery {
  const { page: defaultPage = 1, pageSize: defaultPageSize = 20 } =
    defaults ?? {};
  const raw: Record<string, unknown> = { ...query };

  const pageFromQuery = toPositiveInteger(query.page);
  const pageSizeFromQuery = toPositiveInteger(query.limit ?? query.pageSize);

  let page = pageFromQuery;
  let pageSize = pageSizeFromQuery;

  if (page === undefined || pageSize === undefined) {
    const range = toRange(query);
    if (range) {
      if (page === undefined) {
        page = range.page;
      }
      if (pageSize === undefined) {
        pageSize = range.pageSize;
      }
    }
  }

  page = page ?? defaultPage;
  pageSize = pageSize ?? defaultPageSize;

  page = Math.max(1, Math.trunc(page));
  pageSize = Math.max(1, Math.trunc(pageSize));

  const sort = normalizeSort(query.sort) ?? normalizeSort(query._sort);
  const order = normalizeOrder(query.order) ?? normalizeOrder(query._order);

  return {
    page,
    pageSize,
    sort,
    order: sort ? order : undefined,
    raw,
  };
}
