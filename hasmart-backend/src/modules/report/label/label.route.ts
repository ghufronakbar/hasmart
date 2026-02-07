import { LabelController } from "./label.controller";
import { asyncHandler } from "../../../middleware/error-handler";
import { validateHandler } from "../../../middleware/validate-handler";
import { BaseRouter } from "../../../base/base-router";
import { LabelQuerySchema } from "./label.validator";
import { useAuth } from "../../../middleware/use-auth";
import { JwtService } from "../../common/jwt/jwt.service";

export class LabelRouter extends BaseRouter {
  constructor(
    private controller: LabelController,
    private jwtService: JwtService,
  ) {
    super();
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.get(
      "/",
      useAuth(this.jwtService),
      validateHandler({ query: LabelQuerySchema }),
      asyncHandler(
        async (req, res) => await this.controller.getLabel(req, res),
      ),
    );
  }
}
