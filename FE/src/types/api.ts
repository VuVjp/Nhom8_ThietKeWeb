export interface ApiError {
  message: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ServerPaginatedResponse<T> {
  items?: T[];
  data?: T[];
  total?: number;
  totalCount?: number;
  page?: number;
  pageIndex?: number;
  pageSize?: number;
}
