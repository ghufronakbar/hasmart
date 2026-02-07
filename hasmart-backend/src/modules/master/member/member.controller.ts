import { BaseController } from "../../../base/base-controller";
import { MemberService } from "./member.service";
import { Request, Response } from "express";
import {
  MemberBodyType,
  MemberParamsType,
  MemberCodeParamsType,
} from "./member.validator";

export class MemberController extends BaseController {
  constructor(private service: MemberService) {
    super();
  }

  getAllMembers = async (req: Request, res: Response) => {
    const filter = req.filterQuery;
    const { rows, pagination } = await this.service.getAllMembers(filter);
    return this.sendList(req, res, rows, pagination, filter);
  };

  getMemberById = async (req: Request, res: Response) => {
    const params = req.params as unknown as MemberParamsType;
    const data = await this.service.getMemberById(params.memberId);
    return this.sendOk(req, res, data);
  };

  getMemberByCode = async (req: Request, res: Response) => {
    const params = req.params as unknown as MemberCodeParamsType;
    const data = await this.service.getMemberByCode(params.code);
    return this.sendOk(req, res, data);
  };

  createMember = async (req: Request, res: Response) => {
    const data = req.body as MemberBodyType;
    const result = await this.service.createMember(data);
    return this.sendOk(req, res, result);
  };

  updateMember = async (req: Request, res: Response) => {
    const params = req.params as unknown as MemberParamsType;
    const data = req.body as MemberBodyType;
    const result = await this.service.updateMember(params.memberId, data);
    return this.sendOk(req, res, result);
  };

  deleteMember = async (req: Request, res: Response) => {
    const params = req.params as unknown as MemberParamsType;
    const result = await this.service.deleteMember(params.memberId);
    return this.sendOk(req, res, result);
  };
}
