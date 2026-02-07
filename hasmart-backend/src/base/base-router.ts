import { Router, type Express } from "express";

export abstract class BaseRouter {
  public readonly router: Router;

  constructor() {
    this.router = Router();
  }

  public mount(app: Express) {
    app.use(this.router);
  }
}
