import { ItemCategoryController } from "./item-category.controller";
import { asyncHandler } from "../../../middleware/error-handler";
import { validateHandler } from "../../../middleware/validate-handler";
import { BaseRouter } from "../../../base/base-router";
import {
  ItemCategoryBodySchema,
  ItemCategoryParamsSchema,
} from "./item-category.validator";
import { useFilter } from "../../../middleware/use-filter";
import { useAuth } from "../../../middleware/use-auth";
import { JwtService } from "../../../modules/common/jwt/jwt.service";

export class ItemCategoryRouter extends BaseRouter {
  constructor(
    private controller: ItemCategoryController,
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
        async (req, res) =>
          await this.controller.getAllItemCategories(req, res),
      ),
    );

    this.router.get(
      "/:itemCategoryId",
      useAuth(this.jwtService),
      validateHandler({ params: ItemCategoryParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.getItemCategoryById(req, res),
      ),
    );

    this.router.post(
      "/",
      useAuth(this.jwtService),
      validateHandler({ body: ItemCategoryBodySchema }),
      asyncHandler(
        async (req, res) => await this.controller.createItemCategory(req, res),
      ),
    );

    this.router.put(
      "/:itemCategoryId",
      useAuth(this.jwtService),
      validateHandler({
        params: ItemCategoryParamsSchema,
        body: ItemCategoryBodySchema,
      }),
      asyncHandler(
        async (req, res) => await this.controller.updateItemCategory(req, res),
      ),
    );

    this.router.delete(
      "/:itemCategoryId",
      useAuth(this.jwtService),
      validateHandler({ params: ItemCategoryParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.deleteItemCategory(req, res),
      ),
    );
  }
}
