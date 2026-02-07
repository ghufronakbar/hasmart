import { FrontStockController } from "./front-stock.controller";
import { asyncHandler } from "../../../middleware/error-handler";
import { validateHandler } from "../../../middleware/validate-handler";
import { BaseRouter } from "../../../base/base-router";
import {
  FrontStockBodySchema,
  FrontStockParamsSchema,
  FrontStockTransferParamsSchema,
} from "./front-stock.validator";
import { useFilter } from "../../../middleware/use-filter";
import { useAuth } from "../../../middleware/use-auth";
import { JwtService } from "../../common/jwt/jwt.service";

export class FrontStockRouter extends BaseRouter {
  constructor(
    private controller: FrontStockController,
    private jwtService: JwtService,
  ) {
    super();
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.get(
      "/item",
      useAuth(this.jwtService),
      useFilter([
        "name",
        "code",
        "supplier",
        "category",
        "frontStock",
        "rearStock",
      ]),
      validateHandler({ query: FrontStockParamsSchema }),
      asyncHandler(
        async (req, res) =>
          await this.controller.getAllItemWithFrontStock(req, res),
      ),
    );

    this.router.get(
      "/transfer",
      useAuth(this.jwtService),
      useFilter(["notes"]),
      validateHandler({ query: FrontStockParamsSchema }),
      asyncHandler(
        async (req, res) =>
          await this.controller.getAllFrontStockTransfers(req, res),
      ),
    );

    this.router.post(
      "/transfer",
      useAuth(this.jwtService),
      validateHandler({ body: FrontStockBodySchema }),
      asyncHandler(
        async (req, res) =>
          await this.controller.createFrontStockTransfer(req, res),
      ),
    );

    this.router.delete(
      "/transfer/:frontStockTransferId",
      useAuth(this.jwtService),
      validateHandler({ params: FrontStockTransferParamsSchema }),
      asyncHandler(
        async (req, res) =>
          await this.controller.deleteFrontStockTransfer(req, res),
      ),
    );
  }
}
