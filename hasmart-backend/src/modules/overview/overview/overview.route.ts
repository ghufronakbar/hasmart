import { OverviewController } from "./overview.controller";
import { asyncHandler } from "../../../middleware/error-handler";
import { BaseRouter } from "../../../base/base-router";
import { useFilter } from "../../../middleware/use-filter";
import { useBranch } from "../../../middleware/use-branch";
import { JwtService } from "../../common/jwt/jwt.service";
import { useAuth } from "../../../middleware/use-auth";

export class OverviewRouter extends BaseRouter {
  constructor(
    private controller: OverviewController,
    private jwtService: JwtService,
  ) {
    super();
    this.registerRoutes();
  }

  private registerRoutes() {
    // GET /financial-summary
    this.router.get(
      "/financial-summary",
      useAuth(this.jwtService),
      useBranch(),
      useFilter(),
      asyncHandler(
        async (req, res) => await this.controller.getFinancialSummary(req, res),
      ),
    );

    // GET /sales-trend
    this.router.get(
      "/sales-trend",
      useAuth(this.jwtService),
      useBranch(),
      useFilter(),
      asyncHandler(
        async (req, res) => await this.controller.getSalesTrend(req, res),
      ),
    );

    // GET /top-products
    this.router.get(
      "/top-products",
      useAuth(this.jwtService),
      useBranch(),
      useFilter(),
      asyncHandler(
        async (req, res) => await this.controller.getTopProducts(req, res),
      ),
    );

    // GET /stock-alerts
    this.router.get(
      "/stock-alerts",
      useAuth(this.jwtService),
      useBranch(),
      asyncHandler(
        async (req, res) => await this.controller.getStockAlerts(req, res),
      ),
    );
  }
}
