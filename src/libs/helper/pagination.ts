export interface Pagination {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationDefaults {
  defaultLimit?: number;
  maxLimit?: number;
}

export function parsePagination(
  query: Record<string, any>,
  defaults: PaginationDefaults = {},
): Pagination {
  const page = Math.max(1, Math.floor(Number(query.page) || 1));
  const limit = Math.min(
    defaults.maxLimit || 100,
    Math.max(1, Math.floor(Number(query.limit) || defaults.defaultLimit || 10)),
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
