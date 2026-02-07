import { Request, Response } from "express";
import { Pagination } from "./base-service";
import { FilterQueryType } from "src/middleware/use-filter";

export class BaseController {
  constructor() {}

  private status: Record<number, string> = {
    200: "OK",
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    500: "INTERNAL_SERVER_ERROR",
  };

  private baseResponse(
    req: Request,
    res: Response,
    code: number,
    data: unknown,
    errors?: unknown,
    pagination?: Pagination,
    filterQuery?: FilterQueryType,
  ) {
    try {
      res.status(code).json({
        metaData: {
          code: code,
          timestamp: new Date().toISOString(),
          status: this.status[code],
        },
        data,
        errors,
        pagination,
        filterQuery,
      });
    } catch (error) {
      console.log("hit base response error", error);
      this.baseResponse(req, res, 500, error);
    }
  }

  protected sendList(
    req: Request,
    res: Response,
    data: unknown,
    pagination?: Pagination,
    filterQuery?: FilterQueryType,
  ) {
    this.baseResponse(req, res, 200, data, undefined, pagination, filterQuery);
  }

  protected sendOk(req: Request, res: Response, data: unknown) {
    this.baseResponse(req, res, 200, data);
  }

  protected sendBadRequest(req: Request, res: Response, data: unknown) {
    this.baseResponse(req, res, 400, data);
  }

  protected sendUnauthorized(req: Request, res: Response, data: unknown) {
    this.baseResponse(req, res, 401, data);
  }

  protected sendForbidden(req: Request, res: Response, data: unknown) {
    this.baseResponse(req, res, 403, data);
  }

  protected sendNotFound(req: Request, res: Response, data: unknown) {
    this.baseResponse(req, res, 404, data);
  }

  protected sendInternalError(req: Request, res: Response, data: unknown) {
    this.baseResponse(req, res, 500, data);
  }

  protected sendPdfFile(
    req: Request,
    res: Response,
    data: Buffer,
    filename: string,
  ) {
    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", `attachment; filename=${filename}`);
    res.send(data);
  }

  protected sendHtmlFile(
    req: Request,
    res: Response,
    data: string,
    filename: string,
  ) {
    res.set("Content-Type", "text/html");
    res.set("Content-Disposition", `attachment; filename=${filename}`);
    res.send(data);
  }
}
