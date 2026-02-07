type CreatePaginationParams = {
  total: number;
  page: number;
  limit: number;
};

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export class BaseService {
  private readonly serviceName = BaseService.name;
  constructor() {}

  protected debug(any: any) {
    console.log(`[${this.serviceName}] ${any}`);
  }

  protected error(any: any) {
    console.error(`[${this.serviceName}] ${any}`);
  }

  protected info(any: any) {
    console.info(`[${this.serviceName}] ${any}`);
  }

  protected warn(any: any) {
    console.warn(`[${this.serviceName}] ${any}`);
  }

  protected createPagination({
    total,
    page,
    limit,
  }: CreatePaginationParams): Pagination {
    const totalPages = Math.ceil(total / limit);

    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }
}
