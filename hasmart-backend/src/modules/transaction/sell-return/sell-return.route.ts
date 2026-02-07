import { SellReturnController } from "./sell-return.controller";
import { asyncHandler } from "../../../middleware/error-handler";
import { validateHandler } from "../../../middleware/validate-handler";
import { BaseRouter } from "../../../base/base-router";
import {
  SellReturnBodySchema,
  SellReturnParamsSchema,
} from "./sell-return.validator";
import { useFilter } from "../../../middleware/use-filter";
import { useAuth } from "../../../middleware/use-auth";
import { JwtService } from "../../common/jwt/jwt.service";
import { useBranch } from "../../../middleware/use-branch";

export class SellReturnRouter extends BaseRouter {
  constructor(
    private controller: SellReturnController,
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
        async (req, res) => await this.controller.getAllSellReturns(req, res),
      ),
    );

    this.router.get(
      "/:sellReturnId",
      useAuth(this.jwtService),
      validateHandler({ params: SellReturnParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.getSellReturnById(req, res),
      ),
    );

    this.router.post(
      "/",
      useAuth(this.jwtService),
      validateHandler({ body: SellReturnBodySchema }),
      asyncHandler(
        async (req, res) => await this.controller.createSellReturn(req, res),
      ),
    );

    this.router.put(
      "/:sellReturnId",
      useAuth(this.jwtService),
      validateHandler({
        params: SellReturnParamsSchema,
        body: SellReturnBodySchema,
      }),
      asyncHandler(
        async (req, res) => await this.controller.updateSellReturn(req, res),
      ),
    );

    this.router.delete(
      "/:sellReturnId",
      useAuth(this.jwtService),
      validateHandler({ params: SellReturnParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.deleteSellReturn(req, res),
      ),
    );
  }
}
