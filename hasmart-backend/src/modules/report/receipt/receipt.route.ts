import { ReceiptController } from "./receipt.controller";
import { asyncHandler } from "../../../middleware/error-handler";
import { validateHandler } from "../../../middleware/validate-handler";
import { BaseRouter } from "../../../base/base-router";
import {
  ReceiptParamsSchema,
  SalesReceiptQuerySchema,
} from "./receipt.validator";
import { useAuth } from "../../../middleware/use-auth";
import { JwtService } from "../../common/jwt/jwt.service";

export class ReceiptRouter extends BaseRouter {
  constructor(
    private controller: ReceiptController,
    private jwtService: JwtService,
  ) {
    super();
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.get(
      "/:type/:receiptId",
      useAuth(this.jwtService),
      validateHandler({ params: ReceiptParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.getReceipt(req, res),
      ),
    );

    this.router.get(
      "/sales",
      useAuth(this.jwtService),
      validateHandler({ query: SalesReceiptQuerySchema }),
      asyncHandler(
        async (req, res) =>
          await this.controller.getSalesReceiptByDate(req, res),
      ),
    );
  }
}
