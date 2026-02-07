import { BackupRestoreController } from "./backup-restore.controller";
import { asyncHandler } from "../../../middleware/error-handler";
import { BaseRouter } from "../../../base/base-router";
import { JwtService } from "../../common/jwt/jwt.service";
import { useFileDisk } from "../../../middleware/use-file-disk";
import { useAuth } from "../../../middleware/use-auth";

export class BackupRestoreRouter extends BaseRouter {
  constructor(
    private controller: BackupRestoreController,
    private jwtService: JwtService,
  ) {
    super();
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.get(
      "/backup",
      useAuth(this.jwtService),
      asyncHandler(
        async (req, res) => await this.controller.getBackupFile(req, res),
      ),
    );

    this.router.post(
      "/restore",
      // useAuth(this.jwtService),
      useFileDisk("file", ["application/octet-stream"]),
      asyncHandler(
        async (req, res) => await this.controller.restoreBackupFile(req, res),
      ),
    );
  }
}
