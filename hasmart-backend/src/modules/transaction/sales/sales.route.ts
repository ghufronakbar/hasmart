import { SalesController } from "./sales.controller";
import { asyncHandler } from "../../../middleware/error-handler";
import { validateHandler } from "../../../middleware/validate-handler";
import { BaseRouter } from "../../../base/base-router";
import {
  SalesBodySchema,
  SalesParamsSchema,
  SalesInvoiceParamsSchema,
} from "./sales.validator";
import { useFilter } from "../../../middleware/use-filter";
import { useAuth } from "../../../middleware/use-auth";
import { JwtService } from "../../common/jwt/jwt.service";
import { useBranch } from "../../../middleware/use-branch";

export class SalesRouter extends BaseRouter {
  constructor(
    private controller: SalesController,
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
          "invoiceNumber",
          "recordedTotalAmount",
          "transactionDate", // special relation
          "masterMember_name", // special relation
        ],
        true,
      ),
      useBranch(),
      asyncHandler(
        async (req, res) => await this.controller.getAllSales(req, res),
      ),
    );

    this.router.get(
      "/:salesId",
      useAuth(this.jwtService),
      validateHandler({ params: SalesParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.getSalesById(req, res),
      ),
    );

    this.router.get(
      "/:invoiceNumber/invoice",
      useAuth(this.jwtService),
      validateHandler({ params: SalesInvoiceParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.getSalesByInvoice(req, res),
      ),
    );

    this.router.post(
      "/",
      useAuth(this.jwtService),
      validateHandler({ body: SalesBodySchema }),
      asyncHandler(
        async (req, res) => await this.controller.createSales(req, res),
      ),
    );

    this.router.put(
      "/:salesId",
      useAuth(this.jwtService),
      validateHandler({ params: SalesParamsSchema, body: SalesBodySchema }),
      asyncHandler(
        async (req, res) => await this.controller.updateSales(req, res),
      ),
    );

    this.router.delete(
      "/:salesId",
      useAuth(this.jwtService),
      validateHandler({ params: SalesParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.deleteSales(req, res),
      ),
    );
  }
}
