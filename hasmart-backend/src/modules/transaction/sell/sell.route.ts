import { SellController } from "./sell.controller";
import { asyncHandler } from "../../../middleware/error-handler";
import { validateHandler } from "../../../middleware/validate-handler";
import { BaseRouter } from "../../../base/base-router";
import {
  SellBodySchema,
  SellParamsSchema,
  SellInvoiceParamsSchema,
} from "./sell.validator";
import { useFilter } from "../../../middleware/use-filter";
import { useAuth } from "../../../middleware/use-auth";
import { JwtService } from "../../common/jwt/jwt.service";
import { useBranch } from "../../../middleware/use-branch";

export class SellRouter extends BaseRouter {
  constructor(
    private controller: SellController,
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
          "invoiceNumber",
          "dueDate",
          "recordedTotalAmount",
          "masterMemberName", // relation
        ],
        true,
      ),
      useBranch(),
      asyncHandler(
        async (req, res) => await this.controller.getAllSells(req, res),
      ),
    );

    this.router.get(
      "/:sellId",
      useAuth(this.jwtService),
      validateHandler({ params: SellParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.getSellById(req, res),
      ),
    );

    this.router.get(
      "/:invoiceNumber/invoice",
      useAuth(this.jwtService),
      validateHandler({ params: SellInvoiceParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.getSellByInvoice(req, res),
      ),
    );

    this.router.post(
      "/",
      useAuth(this.jwtService),
      validateHandler({ body: SellBodySchema }),
      asyncHandler(
        async (req, res) => await this.controller.createSell(req, res),
      ),
    );

    this.router.put(
      "/:sellId",
      useAuth(this.jwtService),
      validateHandler({ params: SellParamsSchema, body: SellBodySchema }),
      asyncHandler(
        async (req, res) => await this.controller.updateSell(req, res),
      ),
    );

    this.router.delete(
      "/:sellId",
      useAuth(this.jwtService),
      validateHandler({ params: SellParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.deleteSell(req, res),
      ),
    );
  }
}
