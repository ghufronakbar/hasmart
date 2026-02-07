// hasmart-backend/src/modules/report/report/report.controller.ts
import { BaseController } from "../../../base/base-controller";
import { ReportService } from "./report.service";
import { Request, Response } from "express";
import { ReportQueryFilterType } from "./report.validator";

export class ReportController extends BaseController {
  constructor(private service: ReportService) {
    super();
  }

  getPurchaseReport = async (req: Request, res: Response) => {
    const query = req.query as unknown as ReportQueryFilterType;
    const filter = req.filterQuery;

    const result = await this.service.getPurchaseReport(query, filter);

    res.setHeader("Content-Type", result.mimeType);
    const disposition = query.exportAs === "preview" ? "inline" : "attachment";
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename=${result.fileName}`,
    );
    res.send(result.buffer);
  };

  getPurchaseReturnReport = async (req: Request, res: Response) => {
    const query = req.query as unknown as ReportQueryFilterType;
    const filter = req.filterQuery;

    const result = await this.service.getPurchaseReturnReport(query, filter);

    res.setHeader("Content-Type", result.mimeType);
    const disposition = query.exportAs === "preview" ? "inline" : "attachment";
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename=${result.fileName}`,
    );
    res.send(result.buffer);
  };

  getSalesReport = async (req: Request, res: Response) => {
    const query = req.query as unknown as ReportQueryFilterType;
    const filter = req.filterQuery;

    const result = await this.service.getSalesReport(query, filter);

    res.setHeader("Content-Type", result.mimeType);
    const disposition = query.exportAs === "preview" ? "inline" : "attachment";
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename=${result.fileName}`,
    );
    res.send(result.buffer);
  };

  getSalesReturnReport = async (req: Request, res: Response) => {
    const query = req.query as unknown as ReportQueryFilterType;
    const filter = req.filterQuery;

    const result = await this.service.getSalesReturnReport(query, filter);

    res.setHeader("Content-Type", result.mimeType);
    const disposition = query.exportAs === "preview" ? "inline" : "attachment";
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename=${result.fileName}`,
    );
    res.send(result.buffer);
  };

  getSellReport = async (req: Request, res: Response) => {
    const query = req.query as unknown as ReportQueryFilterType;
    const filter = req.filterQuery;

    const result = await this.service.getSellReport(query, filter);

    res.setHeader("Content-Type", result.mimeType);
    const disposition = query.exportAs === "preview" ? "inline" : "attachment";
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename=${result.fileName}`,
    );
    res.send(result.buffer);
  };

  getSellReturnReport = async (req: Request, res: Response) => {
    const query = req.query as unknown as ReportQueryFilterType;
    const filter = req.filterQuery;

    const result = await this.service.getSellReturnReport(query, filter);

    res.setHeader("Content-Type", result.mimeType);
    const disposition = query.exportAs === "preview" ? "inline" : "attachment";
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename=${result.fileName}`,
    );
    res.send(result.buffer);
  };

  getItemReport = async (req: Request, res: Response) => {
    const query = req.query as unknown as ReportQueryFilterType;
    const branchQuery = req.branchQuery;

    const result = await this.service.getItemReport(query, branchQuery);

    res.setHeader("Content-Type", result.mimeType);
    const disposition = query.exportAs === "preview" ? "inline" : "attachment";
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename=${result.fileName}`,
    );
    res.send(result.buffer);
  };

  getMemberReport = async (req: Request, res: Response) => {
    const query = req.query as unknown as ReportQueryFilterType;
    const filter = req.filterQuery;

    const result = await this.service.getMemberReport(query, filter);

    res.setHeader("Content-Type", result.mimeType);
    const disposition = query.exportAs === "preview" ? "inline" : "attachment";
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename=${result.fileName}`,
    );
    res.send(result.buffer);
  };

  getMemberPurchaseReport = async (req: Request, res: Response) => {
    const query = req.query as unknown as ReportQueryFilterType;
    const filter = req.filterQuery;

    const result = await this.service.getMemberPurchaseReport(query, filter);

    res.setHeader("Content-Type", result.mimeType);
    const disposition = query.exportAs === "preview" ? "inline" : "attachment";
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename=${result.fileName}`,
    );
    res.send(result.buffer);
  };
}
