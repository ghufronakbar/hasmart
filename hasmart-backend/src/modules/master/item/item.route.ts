import { ItemController } from "./item.controller";
import { asyncHandler } from "../../../middleware/error-handler";
import { validateHandler } from "../../../middleware/validate-handler";
import { BaseRouter } from "../../../base/base-router";
import {
  ItemBodySchema,
  ItemUpdateBodySchema,
  ItemParamsSchema,
  GetItemByCodeParamsSchema,
  ItemQuerySchema,
  ItemBulkUpdateVariantPriceBodySchema,
} from "./item.validator";
import { useFilter } from "../../../middleware/use-filter";
import { useAuth } from "../../../middleware/use-auth";
import { JwtService } from "../../common/jwt/jwt.service";
import { useBranch } from "../../../middleware/use-branch";

export class ItemRouter extends BaseRouter {
  constructor(
    private controller: ItemController,
    private jwtService: JwtService,
  ) {
    super();
    this.registerRoutes();
  }

  private registerRoutes() {
    // GET /api/master/item (paginated, with optional branchId)
    this.router.get(
      "/",
      useAuth(this.jwtService),
      useFilter(["name", "code", "supplier", "category"]),
      useBranch(),
      validateHandler({ query: ItemQuerySchema }),
      asyncHandler(
        async (req, res) => await this.controller.getAllItems(req, res),
      ),
    );

    // GET /api/master/item/:masterItemId
    this.router.get(
      "/:masterItemId",
      useAuth(this.jwtService),
      useBranch(),
      validateHandler({ params: ItemParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.getItemById(req, res),
      ),
    );

    // POST /api/master/item
    this.router.post(
      "/",
      useAuth(this.jwtService),
      validateHandler({ body: ItemBodySchema }),
      asyncHandler(
        async (req, res) => await this.controller.createItem(req, res),
      ),
    );

    // PUT /api/master/item/:masterItemId
    this.router.put(
      "/:masterItemId",
      useAuth(this.jwtService),
      validateHandler({ params: ItemParamsSchema, body: ItemUpdateBodySchema }),
      asyncHandler(
        async (req, res) => await this.controller.updateItem(req, res),
      ),
    );

    // DELETE /api/master/item/:masterItemId
    this.router.delete(
      "/:masterItemId",
      useAuth(this.jwtService),
      validateHandler({ params: ItemParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.deleteItem(req, res),
      ),
    );

    // GET /api/master/item/code/:code
    this.router.get(
      "/code/:code",
      useAuth(this.jwtService),
      validateHandler({ params: GetItemByCodeParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.getItemByCode(req, res),
      ),
    );

    // PATCH /api/master/item/bulk-variant-price
    this.router.patch(
      "/bulk-variant-price",
      useAuth(this.jwtService),
      validateHandler({ body: ItemBulkUpdateVariantPriceBodySchema }),
      asyncHandler(
        async (req, res) =>
          await this.controller.bulkUpdateVariantPrice(req, res),
      ),
    );
  }
}
