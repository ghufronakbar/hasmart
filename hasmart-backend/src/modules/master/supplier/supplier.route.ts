import { SupplierController } from "./supplier.controller";
import { asyncHandler } from "../../../middleware/error-handler";
import { validateHandler } from "../../../middleware/validate-handler";
import { BaseRouter } from "../../../base/base-router";
import { SupplierBodySchema, SupplierParamsSchema } from "./supplier.validator";
import { useFilter } from "../../../middleware/use-filter";
import { useAuth } from "../../../middleware/use-auth";
import { JwtService } from "../../common/jwt/jwt.service";

export class SupplierRouter extends BaseRouter {
  constructor(
    private controller: SupplierController,
    private jwtService: JwtService,
  ) {
    super();
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.get(
      "/",
      useAuth(this.jwtService),
      useFilter(["name", "code"]),
      asyncHandler(
        async (req, res) => await this.controller.getAllSuppliers(req, res),
      ),
    );

    this.router.get(
      "/:supplierId",
      useAuth(this.jwtService),
      validateHandler({ params: SupplierParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.getSupplierById(req, res),
      ),
    );

    this.router.post(
      "/",
      useAuth(this.jwtService),
      validateHandler({ body: SupplierBodySchema }),
      asyncHandler(
        async (req, res) => await this.controller.createSupplier(req, res),
      ),
    );

    this.router.put(
      "/:supplierId",
      useAuth(this.jwtService),
      validateHandler({
        params: SupplierParamsSchema,
        body: SupplierBodySchema,
      }),
      asyncHandler(
        async (req, res) => await this.controller.updateSupplier(req, res),
      ),
    );

    this.router.delete(
      "/:supplierId",
      useAuth(this.jwtService),
      validateHandler({ params: SupplierParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.deleteSupplier(req, res),
      ),
    );
  }
}
