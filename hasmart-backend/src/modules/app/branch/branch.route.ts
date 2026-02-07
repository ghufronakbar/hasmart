import { BranchController } from "./branch.controller";
import { asyncHandler } from "../../../middleware/error-handler";
import { validateHandler } from "../../../middleware/validate-handler";
import { BaseRouter } from "../../../base/base-router";
import { BranchBodySchema, BranchParamsSchema } from "./brach.validator";
import { useFilter } from "../../../middleware/use-filter";
import { useAuth } from "../../../middleware/use-auth";
import { JwtService } from "../../common/jwt/jwt.service";

export class BranchRouter extends BaseRouter {
  constructor(
    private controller: BranchController,
    private jwtService: JwtService,
  ) {
    super();
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.get(
      "/",
      useAuth(this.jwtService),
      useFilter(["code", "name"]),
      asyncHandler(
        async (req, res) => await this.controller.getAllBranches(req, res),
      ),
    );

    this.router.get(
      "/:branchId",
      useAuth(this.jwtService),
      validateHandler({ params: BranchParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.getBranchById(req, res),
      ),
    );

    this.router.post(
      "/",
      useAuth(this.jwtService),
      validateHandler({ body: BranchBodySchema }),
      asyncHandler(
        async (req, res) => await this.controller.createBranch(req, res),
      ),
    );

    this.router.put(
      "/:branchId",
      useAuth(this.jwtService),
      validateHandler({ params: BranchParamsSchema, body: BranchBodySchema }),
      asyncHandler(
        async (req, res) => await this.controller.updateBranch(req, res),
      ),
    );
    this.router.delete(
      "/:branchId",
      useAuth(this.jwtService),
      validateHandler({ params: BranchParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.deleteBranch(req, res),
      ),
    );
  }
}
