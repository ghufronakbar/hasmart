import { AdjustStockController } from "./adjust-stock.controller";
import { asyncHandler } from "../../../middleware/error-handler";
import { validateHandler } from "../../../middleware/validate-handler";
import { BaseRouter } from "../../../base/base-router";
import {
  AdjustmentBodySchema,
  AdjustmentParamsSchema,
} from "./adjust-stock.validator";
import { useFilter } from "../../../middleware/use-filter";
import { useAuth } from "../../../middleware/use-auth";
import { JwtService } from "../../common/jwt/jwt.service";
import { useBranch } from "../../../middleware/use-branch";

export class AdjustStockRouter extends BaseRouter {
  constructor(
    private controller: AdjustStockController,
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
          "gapAmount",
          "finalAmount",
          "masterItem_name", // relation
        ],
        true,
      ),
      useBranch(),
      asyncHandler(
        async (req, res) => await this.controller.getAllAdjustments(req, res),
      ),
    );

    this.router.get(
      "/:adjustmentId",
      useAuth(this.jwtService),
      validateHandler({ params: AdjustmentParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.getAdjustmentById(req, res),
      ),
    );

    this.router.post(
      "/",
      useAuth(this.jwtService),
      validateHandler({ body: AdjustmentBodySchema }),
      asyncHandler(
        async (req, res) => await this.controller.createAdjustment(req, res),
      ),
    );

    this.router.delete(
      "/:adjustmentId",
      useAuth(this.jwtService),
      validateHandler({ params: AdjustmentParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.deleteAdjustment(req, res),
      ),
    );
  }
}
