import { TransferController } from "./transfer.controller";
import { asyncHandler } from "../../../middleware/error-handler";
import { validateHandler } from "../../../middleware/validate-handler";
import { BaseRouter } from "../../../base/base-router";
import { TransferBodySchema, TransferParamsSchema } from "./transfer.validator";
import { useFilter } from "../../../middleware/use-filter";
import { useAuth } from "../../../middleware/use-auth";
import { JwtService } from "../../common/jwt/jwt.service";
import { useBranch } from "../../../middleware/use-branch";

export class TransferRouter extends BaseRouter {
  constructor(
    private controller: TransferController,
    private jwtService: JwtService,
  ) {
    super();
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.get(
      "/",
      useAuth(this.jwtService),
      useFilter(["transactionDate"], true),
      useBranch(),
      asyncHandler(
        async (req, res) => await this.controller.getAllTransfers(req, res),
      ),
    );

    this.router.get(
      "/:transferId",
      useAuth(this.jwtService),
      validateHandler({ params: TransferParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.getTransferById(req, res),
      ),
    );

    this.router.post(
      "/",
      useAuth(this.jwtService),
      validateHandler({ body: TransferBodySchema }),
      asyncHandler(
        async (req, res) => await this.controller.createTransfer(req, res),
      ),
    );

    this.router.put(
      "/:transferId",
      useAuth(this.jwtService),
      validateHandler({
        params: TransferParamsSchema,
        body: TransferBodySchema,
      }),
      asyncHandler(
        async (req, res) => await this.controller.updateTransfer(req, res),
      ),
    );

    this.router.delete(
      "/:transferId",
      useAuth(this.jwtService),
      validateHandler({ params: TransferParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.deleteTransfer(req, res),
      ),
    );
  }
}
