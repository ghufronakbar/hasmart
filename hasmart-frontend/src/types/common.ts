export interface MetaData {
  code: number;
  timestamp: string;
  status: string;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface FilterQuery {
  page?: number;
  limit?: number;
  sort?: string;
  sortBy?: string;
  search?: string;
  dateStart?: string;
  dateEnd?: string;
  [key: string]: unknown;
}

export interface BaseResponse<T> {
  metaData: MetaData;
  data: T | null | undefined;
  errors?: {
    message?: string;
    details?: {
      message: string;
      code: string;
      path: string[];
    }[];
  };
  filterQuery?: FilterQuery | null;
  pagination?: PaginationInfo | null;
}
