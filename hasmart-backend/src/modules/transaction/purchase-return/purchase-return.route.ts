import { PurchaseReturnController } from "./purchase-return.controller";
import { asyncHandler } from "../../../middleware/error-handler";
import { validateHandler } from "../../../middleware/validate-handler";
import { BaseRouter } from "../../../base/base-router";
import {
  PurchaseReturnBodySchema,
  PurchaseReturnParamsSchema,
} from "./purchase-return.validator";
import { useFilter } from "../../../middleware/use-filter";
import { useAuth } from "../../../middleware/use-auth";
import { JwtService } from "../../common/jwt/jwt.service";
import { useBranch } from "../../../middleware/use-branch";

export class PurchaseReturnRouter extends BaseRouter {
  constructor(
    private controller: PurchaseReturnController,
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
          "transactionDate",
          "dueDate",
          "recordedTotalAmount",
          "masterSupplierName", // special relation
        ],
        true,
      ),

      useBranch(),
      asyncHandler(
        async (req, res) =>
          await this.controller.getAllPurchaseReturns(req, res),
      ),
    );

    this.router.get(
      "/:purchaseReturnId",
      useAuth(this.jwtService),
      validateHandler({ params: PurchaseReturnParamsSchema }),
      asyncHandler(
        async (req, res) =>
          await this.controller.getPurchaseReturnById(req, res),
      ),
    );

    this.router.post(
      "/",
      useAuth(this.jwtService),
      validateHandler({ body: PurchaseReturnBodySchema }),
      asyncHandler(
        async (req, res) =>
          await this.controller.createPurchaseReturn(req, res),
      ),
    );

    this.router.put(
      "/:purchaseReturnId",
      useAuth(this.jwtService),
      validateHandler({
        params: PurchaseReturnParamsSchema,
        body: PurchaseReturnBodySchema,
      }),
      asyncHandler(
        async (req, res) =>
          await this.controller.updatePurchaseReturn(req, res),
      ),
    );

    this.router.delete(
      "/:purchaseReturnId",
      useAuth(this.jwtService),
      validateHandler({ params: PurchaseReturnParamsSchema }),
      asyncHandler(
        async (req, res) =>
          await this.controller.deletePurchaseReturn(req, res),
      ),
    );
  }
}
