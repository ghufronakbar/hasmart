import { CashFlowController } from "./cash-flow.controller";
import { asyncHandler } from "../../../middleware/error-handler";
import { validateHandler } from "../../../middleware/validate-handler";
import { BaseRouter } from "../../../base/base-router";
import {
  CashFlowBodySchema,
  CashFlowParamsSchema,
} from "./cash-flow.validator";
import { useFilter } from "../../../middleware/use-filter";
import { useAuth } from "../../../middleware/use-auth";
import { JwtService } from "../../common/jwt/jwt.service";
import { useBranch } from "../../../middleware/use-branch";

export class CashFlowRouter extends BaseRouter {
  constructor(
    private controller: CashFlowController,
    private jwtService: JwtService,
  ) {
    super();
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.get(
      "/",
      useAuth(this.jwtService),
      useBranch(),
      useFilter(["notes", "transactionDate"], true),
      asyncHandler(
        async (req, res) => await this.controller.getAllCashFlows(req, res),
      ),
    );

    this.router.get(
      "/:id",
      useAuth(this.jwtService),
      useBranch(),
      validateHandler({ params: CashFlowParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.getCashFlowById(req, res),
      ),
    );

    this.router.post(
      "/",
      useAuth(this.jwtService),
      validateHandler({ body: CashFlowBodySchema }),
      asyncHandler(
        async (req, res) => await this.controller.createCashFlow(req, res),
      ),
    );

    this.router.put(
      "/:id",
      useAuth(this.jwtService),
      validateHandler({
        params: CashFlowParamsSchema,
        body: CashFlowBodySchema,
      }),
      asyncHandler(
        async (req, res) => await this.controller.updateCashFlow(req, res),
      ),
    );

    this.router.delete(
      "/:id",
      useAuth(this.jwtService),
      validateHandler({ params: CashFlowParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.deleteCashFlow(req, res),
      ),
    );
  }
}
