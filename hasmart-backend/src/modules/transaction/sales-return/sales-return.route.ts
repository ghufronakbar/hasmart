import { SalesReturnController } from "./sales-return.controller";
import { asyncHandler } from "../../../middleware/error-handler";
import { validateHandler } from "../../../middleware/validate-handler";
import { BaseRouter } from "../../../base/base-router";
import {
  SalesReturnBodySchema,
  SalesReturnParamsSchema,
} from "./sales-return.validator";
import { useFilter } from "../../../middleware/use-filter";
import { useAuth } from "../../../middleware/use-auth";
import { JwtService } from "../../common/jwt/jwt.service";
import { useBranch } from "../../../middleware/use-branch";

export class SalesReturnRouter extends BaseRouter {
  constructor(
    private controller: SalesReturnController,
    private jwtService: JwtService,
  ) {
    super();
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.get(
      "/",
      useAuth(this.jwtService),
      useFilter(
        [
          "transactionDate",
          "returnNumber",
          "recordedTotalAmount",
          "transactionSales_invoiceNumber", // special relation
          "masterMember_name", // special relation
        ],
        true,
      ),
      useBranch(),
      asyncHandler(
        async (req, res) => await this.controller.getAllSalesReturns(req, res),
      ),
    );

    this.router.get(
      "/:salesReturnId",
      useAuth(this.jwtService),
      validateHandler({ params: SalesReturnParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.getSalesReturnById(req, res),
      ),
    );

    this.router.post(
      "/",
      useAuth(this.jwtService),
      validateHandler({ body: SalesReturnBodySchema }),
      asyncHandler(
        async (req, res) => await this.controller.createSalesReturn(req, res),
      ),
    );

    this.router.put(
      "/:salesReturnId",
      useAuth(this.jwtService),
      validateHandler({
        params: SalesReturnParamsSchema,
        body: SalesReturnBodySchema,
      }),
      asyncHandler(
        async (req, res) => await this.controller.updateSalesReturn(req, res),
      ),
    );

    this.router.delete(
      "/:salesReturnId",
      useAuth(this.jwtService),
      validateHandler({ params: SalesReturnParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.deleteSalesReturn(req, res),
      ),
    );
  }
}
