import { UserController } from "./user.controller";
import { asyncHandler } from "../../../middleware/error-handler";
import { validateHandler } from "../../../middleware/validate-handler";
import { BaseRouter } from "../../../base/base-router";
import {
  FirstTimeSetupBodySchema,
  LoginBodySchema,
  CreateUserBodySchema,
  EditProfileBodySchema,
  ChangePasswordBodySchema,
  ResetPasswordBodySchema,
  UpdateUserAccessBodySchema,
} from "./user.validator";
import { useAuth } from "../../../middleware/use-auth";
import { JwtService } from "../../common/jwt/jwt.service";
import { useFilter } from "../../../middleware/use-filter";

export class UserRouter extends BaseRouter {
  constructor(
    private controller: UserController,
    private jwtService: JwtService,
  ) {
    super();
    this.registerRoutes();
  }

  private registerRoutes() {
    // GET /api/app/user/status
    this.router.get(
      "/status",
      asyncHandler(
        async (req, res) => await this.controller.getStatus(req, res),
      ),
    );

    // POST /api/app/user/first-time-setup
    this.router.post(
      "/first-time-setup",
      validateHandler({ body: FirstTimeSetupBodySchema }),
      asyncHandler(
        async (req, res) => await this.controller.firstTimeSetup(req, res),
      ),
    );

    // POST /api/app/user/login
    this.router.post(
      "/login",
      validateHandler({ body: LoginBodySchema }),
      asyncHandler(async (req, res) => await this.controller.login(req, res)),
    );

    // POST /api/app/user/refresh
    this.router.post(
      "/refresh",
      asyncHandler(async (req, res) => await this.controller.refresh(req, res)),
    );

    // GET /api/app/user (Bearer Token Required)
    this.router.get(
      "/",
      useAuth(this.jwtService),
      useFilter(["name", "isActive", "isSuperUser"], false),
      asyncHandler(
        async (req, res) => await this.controller.getAllUsers(req, res),
      ),
    );

    // POST /api/app/user (Bearer Token Required)
    this.router.post(
      "/",
      useAuth(this.jwtService),
      validateHandler({ body: CreateUserBodySchema }),
      asyncHandler(
        async (req, res) => await this.controller.createUser(req, res),
      ),
    );

    // GET /api/app/user/whoami (Bearer Token Required)
    this.router.get(
      "/whoami",
      useAuth(this.jwtService),
      asyncHandler(async (req, res) => await this.controller.whoami(req, res)),
    );

    // PUT /api/app/user (Bearer Token Required)
    this.router.put(
      "/",
      useAuth(this.jwtService),
      validateHandler({ body: EditProfileBodySchema }),
      asyncHandler(
        async (req, res) => await this.controller.editProfile(req, res),
      ),
    );

    // POST /api/app/user/change-password (Bearer Token Required)
    this.router.post(
      "/change-password",
      useAuth(this.jwtService),
      validateHandler({ body: ChangePasswordBodySchema }),
      asyncHandler(
        async (req, res) => await this.controller.changePassword(req, res),
      ),
    );

    // DELETE /api/app/user/:id (Bearer Token Required)
    this.router.delete(
      "/:id",
      useAuth(this.jwtService),
      asyncHandler(
        async (req, res) => await this.controller.deleteUser(req, res),
      ),
    );

    // POST /api/app/user/:id/reset-password (Bearer Token Required)
    this.router.post(
      "/:id/reset-password",
      useAuth(this.jwtService),
      validateHandler({ body: ResetPasswordBodySchema }),
      asyncHandler(
        async (req, res) => await this.controller.resetPassword(req, res),
      ),
    );

    // PUT /api/app/user/:id/access (Bearer Token Required)
    this.router.put(
      "/:id/access",
      useAuth(this.jwtService),
      validateHandler({ body: UpdateUserAccessBodySchema }),
      asyncHandler(
        async (req, res) => await this.controller.updateUserAccess(req, res),
      ),
    );
  }
}
