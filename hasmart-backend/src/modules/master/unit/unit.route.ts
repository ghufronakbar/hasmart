import { UnitController } from "./unit.controller";
import { asyncHandler } from "../../../middleware/error-handler";
import { validateHandler } from "../../../middleware/validate-handler";
import { BaseRouter } from "../../../base/base-router";
import { UnitBodySchema, UnitParamsSchema } from "./unit.validator";
import { useFilter } from "../../../middleware/use-filter";
import { useAuth } from "../../../middleware/use-auth";
import { JwtService } from "../../common/jwt/jwt.service";

export class UnitRouter extends BaseRouter {
  constructor(
    private controller: UnitController,
    private jwtService: JwtService,
  ) {
    super();
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.get(
      "/",
      useAuth(this.jwtService),
      useFilter(["unit", "name"]),
      asyncHandler(
        async (req, res) => await this.controller.getAllUnits(req, res),
      ),
    );

    this.router.get(
      "/:unitId",
      useAuth(this.jwtService),
      validateHandler({ params: UnitParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.getUnitById(req, res),
      ),
    );

    this.router.post(
      "/",
      useAuth(this.jwtService),
      validateHandler({ body: UnitBodySchema }),
      asyncHandler(
        async (req, res) => await this.controller.createUnit(req, res),
      ),
    );

    this.router.put(
      "/:unitId",
      useAuth(this.jwtService),
      validateHandler({ params: UnitParamsSchema, body: UnitBodySchema }),
      asyncHandler(
        async (req, res) => await this.controller.updateUnit(req, res),
      ),
    );

    this.router.delete(
      "/:unitId",
      useAuth(this.jwtService),
      validateHandler({ params: UnitParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.deleteUnit(req, res),
      ),
    );
  }
}
