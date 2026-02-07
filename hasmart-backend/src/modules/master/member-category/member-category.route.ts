import { MemberCategoryController } from "./member-category.controller";
import { asyncHandler } from "../../../middleware/error-handler";
import { validateHandler } from "../../../middleware/validate-handler";
import { BaseRouter } from "../../../base/base-router";
import {
  MemberCategoryBodySchema,
  MemberCategoryParamsSchema,
  MemberCategoryCodeParamsSchema,
} from "./member-category.validator";
import { useFilter } from "../../../middleware/use-filter";
import { useAuth } from "../../../middleware/use-auth";
import { JwtService } from "../../common/jwt/jwt.service";

export class MemberCategoryRouter extends BaseRouter {
  constructor(
    private controller: MemberCategoryController,
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
        async (req, res) =>
          await this.controller.getAllMemberCategories(req, res),
      ),
    );

    this.router.get(
      "/:memberCategoryId",
      useAuth(this.jwtService),
      validateHandler({ params: MemberCategoryParamsSchema }),
      asyncHandler(
        async (req, res) =>
          await this.controller.getMemberCategoryById(req, res),
      ),
    );

    this.router.get(
      "/:code/code",
      useAuth(this.jwtService),
      validateHandler({ params: MemberCategoryCodeParamsSchema }),
      asyncHandler(
        async (req, res) =>
          await this.controller.getMemberCategoryByCode(req, res),
      ),
    );

    this.router.post(
      "/",
      useAuth(this.jwtService),
      validateHandler({ body: MemberCategoryBodySchema }),
      asyncHandler(
        async (req, res) =>
          await this.controller.createMemberCategory(req, res),
      ),
    );

    this.router.put(
      "/:memberCategoryId",
      useAuth(this.jwtService),
      validateHandler({
        params: MemberCategoryParamsSchema,
        body: MemberCategoryBodySchema,
      }),
      asyncHandler(
        async (req, res) =>
          await this.controller.updateMemberCategory(req, res),
      ),
    );

    this.router.delete(
      "/:memberCategoryId",
      useAuth(this.jwtService),
      validateHandler({ params: MemberCategoryParamsSchema }),
      asyncHandler(
        async (req, res) =>
          await this.controller.deleteMemberCategory(req, res),
      ),
    );
  }
}
