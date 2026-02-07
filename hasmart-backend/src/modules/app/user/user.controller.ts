import { BaseController } from "../../../base/base-controller";
import { UserService } from "./user.service";
import { Request, Response } from "express";
import {
  FirstTimeSetupBodyType,
  LoginBodyType,
  CreateUserBodyType,
  EditProfileBodyType,
  ChangePasswordBodyType,
  ResetPasswordBodyType,
  UpdateUserAccessBodyType,
} from "./user.validator";

export class UserController extends BaseController {
  constructor(private service: UserService) {
    super();
  }

  getStatus = async (req: Request, res: Response) => {
    const status = await this.service.getStatus();
    return this.sendOk(req, res, status);
  };

  firstTimeSetup = async (req: Request, res: Response) => {
    const data = req.body as FirstTimeSetupBodyType;
    const result = await this.service.firstTimeSetup(data);
    return this.sendOk(req, res, result);
  };

  login = async (req: Request, res: Response) => {
    const data = req.body as LoginBodyType;
    const result = await this.service.login(data);
    return this.sendOk(req, res, result);
  };

  refresh = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new Error("Refresh token required");
    }
    const result = await this.service.refresh(refreshToken);
    return this.sendOk(req, res, result);
  };

  getAllUsers = async (req: Request, res: Response) => {
    const filter = req.filterQuery;
    const { pagination, rows } = await this.service.getAllUsers(filter);
    return this.sendList(req, res, rows, pagination, filter);
  };

  createUser = async (req: Request, res: Response) => {
    const data = req.body as CreateUserBodyType;
    const result = await this.service.createUser(data);
    return this.sendOk(req, res, result);
  };

  whoami = async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const result = await this.service.whoami(userId);
    return this.sendOk(req, res, result);
  };

  editProfile = async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const data = req.body as EditProfileBodyType;
    const result = await this.service.editProfile(userId, data);
    return this.sendOk(req, res, result);
  };

  changePassword = async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const data = req.body as ChangePasswordBodyType;
    const result = await this.service.changePassword(userId, data);
    return this.sendOk(req, res, result);
  };

  deleteUser = async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    const result = await this.service.deleteUser(userId);
    return this.sendOk(req, res, result);
  };

  resetPassword = async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    const data = req.body as ResetPasswordBodyType;
    const result = await this.service.resetPassword(userId, data);
    return this.sendOk(req, res, result);
  };

  updateUserAccess = async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    const data = req.body as UpdateUserAccessBodyType;
    const result = await this.service.updateUserAccess(userId, data);
    return this.sendOk(req, res, result);
  };
}
