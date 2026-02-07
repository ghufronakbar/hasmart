import { PurchaseController } from "./purchase.controller";
import { asyncHandler } from "../../../middleware/error-handler";
import { validateHandler } from "../../../middleware/validate-handler";
import { BaseRouter } from "../../../base/base-router";
import {
  PurchaseBodySchema,
  PurchaseParamsSchema,
  PurchaseInvoiceParamsSchema,
} from "./purchase.validator";
import { useFilter } from "../../../middleware/use-filter";
import { useAuth } from "../../../middleware/use-auth";
import { JwtService } from "../../common/jwt/jwt.service";
import { useBranch } from "../../../middleware/use-branch";

export class PurchaseRouter extends BaseRouter {
  constructor(
    private controller: PurchaseController,
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
        async (req, res) => await this.controller.getAllPurchases(req, res),
      ),
    );

    this.router.get(
      "/:purchaseId",
      useAuth(this.jwtService),
      validateHandler({ params: PurchaseParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.getPurchaseById(req, res),
      ),
    );

    this.router.get(
      "/:invoiceNumber/invoice",
      useAuth(this.jwtService),
      validateHandler({ params: PurchaseInvoiceParamsSchema }),
      asyncHandler(
        async (req, res) =>
          await this.controller.getPurchaseByInvoice(req, res),
      ),
    );

    this.router.post(
      "/",
      useAuth(this.jwtService),
      validateHandler({ body: PurchaseBodySchema }),
      asyncHandler(
        async (req, res) => await this.controller.createPurchase(req, res),
      ),
    );

    this.router.put(
      "/:purchaseId",
      useAuth(this.jwtService),
      validateHandler({
        params: PurchaseParamsSchema,
        body: PurchaseBodySchema,
      }),
      asyncHandler(
        async (req, res) => await this.controller.updatePurchase(req, res),
      ),
    );

    this.router.delete(
      "/:purchaseId",
      useAuth(this.jwtService),
      validateHandler({ params: PurchaseParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.deletePurchase(req, res),
      ),
    );
  }
}
