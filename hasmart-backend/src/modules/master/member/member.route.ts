import { MemberController } from "./member.controller";
import { asyncHandler } from "../../../middleware/error-handler";
import { validateHandler } from "../../../middleware/validate-handler";
import { BaseRouter } from "../../../base/base-router";
import {
  MemberBodySchema,
  MemberParamsSchema,
  MemberCodeParamsSchema,
} from "./member.validator";
import { useFilter } from "../../../middleware/use-filter";
import { useAuth } from "../../../middleware/use-auth";
import { JwtService } from "../../common/jwt/jwt.service";

export class MemberRouter extends BaseRouter {
  constructor(
    private controller: MemberController,
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
        async (req, res) => await this.controller.getAllMembers(req, res),
      ),
    );

    this.router.get(
      "/:memberId",
      useAuth(this.jwtService),
      validateHandler({ params: MemberParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.getMemberById(req, res),
      ),
    );

    this.router.get(
      "/:code/code",
      useAuth(this.jwtService),
      validateHandler({ params: MemberCodeParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.getMemberByCode(req, res),
      ),
    );

    this.router.post(
      "/",
      useAuth(this.jwtService),
      validateHandler({ body: MemberBodySchema }),
      asyncHandler(
        async (req, res) => await this.controller.createMember(req, res),
      ),
    );

    this.router.put(
      "/:memberId",
      useAuth(this.jwtService),
      validateHandler({ params: MemberParamsSchema, body: MemberBodySchema }),
      asyncHandler(
        async (req, res) => await this.controller.updateMember(req, res),
      ),
    );

    this.router.delete(
      "/:memberId",
      useAuth(this.jwtService),
      validateHandler({ params: MemberParamsSchema }),
      asyncHandler(
        async (req, res) => await this.controller.deleteMember(req, res),
      ),
    );
  }
}
