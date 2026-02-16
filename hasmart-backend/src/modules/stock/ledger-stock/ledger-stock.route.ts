import { LedgerStockController } from "./ledger-stock.controller";
import { asyncHandler } from "../../../middleware/error-handler";
import { validateHandler } from "../../../middleware/validate-handler";
import { BaseRouter } from "../../../base/base-router";
import { LedgerStockQuerySchema } from "./ledger-stock.validator";
import { useFilter } from "../../../middleware/use-filter";
import { useAuth } from "../../../middleware/use-auth";
import { JwtService } from "../../common/jwt/jwt.service";

export class LedgerStockRouter extends BaseRouter {
  constructor(
    private controller: LedgerStockController,
    private jwtService: JwtService,
  ) {
    super();
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.get(
      "/",
      useAuth(this.jwtService),
      useFilter(["transactionDate"]),
      validateHandler({ query: LedgerStockQuerySchema }),
      asyncHandler(
        async (req, res) => await this.controller.getAllLedgerStock(req, res),
      ),
    );
  }
}
