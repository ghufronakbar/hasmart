// hasmart-backend/src/modules/report/report/report.route.ts
import { ReportController } from "./report.controller";
import { asyncHandler } from "../../../middleware/error-handler";
import { validateHandler } from "../../../middleware/validate-handler";
import { BaseRouter } from "../../../base/base-router";
import { ReportQueryFilterSchema } from "./report.validator";
import { useFilter } from "../../../middleware/use-filter";
import { JwtService } from "../../../modules/common/jwt/jwt.service";
import { useAuth } from "../../../middleware/use-auth";
import { useBranch } from "../../../middleware/use-branch";

export class ReportRouter extends BaseRouter {
  constructor(
    private controller: ReportController,
    private jwtService: JwtService,
  ) {
    super();
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.get(
      "/purchase",
      useFilter(),
      useAuth(this.jwtService),
      validateHandler({ query: ReportQueryFilterSchema }),
      asyncHandler(
        async (req, res) => await this.controller.getPurchaseReport(req, res),
      ),
    );

    this.router.get(
      "/purchase-return",
      useFilter(),
      useAuth(this.jwtService),
      validateHandler({ query: ReportQueryFilterSchema }),
      asyncHandler(
        async (req, res) =>
          await this.controller.getPurchaseReturnReport(req, res),
      ),
    );

    this.router.get(
      "/sales",
      useFilter(),
      useAuth(this.jwtService),
      validateHandler({ query: ReportQueryFilterSchema }),
      asyncHandler(
        async (req, res) => await this.controller.getSalesReport(req, res),
      ),
    );

    this.router.get(
      "/sales-return",
      useFilter(),
      useAuth(this.jwtService),
      validateHandler({ query: ReportQueryFilterSchema }),
      asyncHandler(
        async (req, res) =>
          await this.controller.getSalesReturnReport(req, res),
      ),
    );

    this.router.get(
      "/sell",
      useFilter(),
      useAuth(this.jwtService),
      validateHandler({ query: ReportQueryFilterSchema }),
      asyncHandler(
        async (req, res) => await this.controller.getSellReport(req, res),
      ),
    );

    this.router.get(
      "/sell-return",
      useFilter(),
      useAuth(this.jwtService),
      validateHandler({ query: ReportQueryFilterSchema }),
      asyncHandler(
        async (req, res) => await this.controller.getSellReturnReport(req, res),
      ),
    );

    this.router.get(
      "/item",
      useFilter(),
      useBranch(),
      // useAuth(this.jwtService),
      validateHandler({ query: ReportQueryFilterSchema }),
      asyncHandler(
        async (req, res) => await this.controller.getItemReport(req, res),
      ),
    );

    this.router.get(
      "/member",
      useFilter(),
      // useAuth(this.jwtService),
      validateHandler({ query: ReportQueryFilterSchema }),
      asyncHandler(
        async (req, res) => await this.controller.getMemberReport(req, res),
      ),
    );
    this.router.get(
      "/member-purchase",
      useFilter(),
      validateHandler({ query: ReportQueryFilterSchema }),
      asyncHandler(
        async (req, res) =>
          await this.controller.getMemberPurchaseReport(req, res),
      ),
    );
  }
}
