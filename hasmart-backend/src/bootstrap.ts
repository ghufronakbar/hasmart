import express from "express";

// Branch Module
import { BranchRouter } from "./modules/app/branch/branch.route";
import { BranchController } from "./modules/app/branch/branch.controller";
import { BranchService } from "./modules/app/branch/branch.service";

// User Module
import { UserRouter } from "./modules/app/user/user.route";
import { UserController } from "./modules/app/user/user.controller";
import { UserService } from "./modules/app/user/user.service";

// Item Category Module
import { ItemCategoryRouter } from "./modules/master/item-category/item-category.route";
import { ItemCategoryController } from "./modules/master/item-category/item-category.controller";
import { ItemCategoryService } from "./modules/master/item-category/item-category.service";

// Item Module
import { ItemRouter } from "./modules/master/item/item.route";
import { ItemController } from "./modules/master/item/item.controller";
import { ItemService } from "./modules/master/item/item.service";

// Supplier Module
import { SupplierRouter } from "./modules/master/supplier/supplier.route";
import { SupplierController } from "./modules/master/supplier/supplier.controller";
import { SupplierService } from "./modules/master/supplier/supplier.service";

// Unit Module
import { UnitRouter } from "./modules/master/unit/unit.route";
import { UnitController } from "./modules/master/unit/unit.controller";
import { UnitService } from "./modules/master/unit/unit.service";

// Member Category Module
import { MemberCategoryRouter } from "./modules/master/member-category/member-category.route";
import { MemberCategoryController } from "./modules/master/member-category/member-category.controller";
import { MemberCategoryService } from "./modules/master/member-category/member-category.service";

// Member Module
import { MemberRouter } from "./modules/master/member/member.route";
import { MemberController } from "./modules/master/member/member.controller";
import { MemberService } from "./modules/master/member/member.service";

// Transaction Common Services
import { RefreshStockService } from "./modules/transaction/refresh-stock/refresh-stock.service";
import { RefreshBuyPriceService } from "./modules/transaction/refresh-buy-price/refresh-buy-price.service";

// Purchase Module
import { PurchaseRouter } from "./modules/transaction/purchase/purchase.route";
import { PurchaseController } from "./modules/transaction/purchase/purchase.controller";
import { PurchaseService } from "./modules/transaction/purchase/purchase.service";

// Purchase Return Module
import { PurchaseReturnRouter } from "./modules/transaction/purchase-return/purchase-return.route";
import { PurchaseReturnController } from "./modules/transaction/purchase-return/purchase-return.controller";
import { PurchaseReturnService } from "./modules/transaction/purchase-return/purchase-return.service";

// Sales Module
import { SalesRouter } from "./modules/transaction/sales/sales.route";
import { SalesController } from "./modules/transaction/sales/sales.controller";
import { SalesService } from "./modules/transaction/sales/sales.service";

// Sales Return Module
import { SalesReturnRouter } from "./modules/transaction/sales-return/sales-return.route";
import { SalesReturnController } from "./modules/transaction/sales-return/sales-return.controller";
import { SalesReturnService } from "./modules/transaction/sales-return/sales-return.service";

// Sell Module
import { SellRouter } from "./modules/transaction/sell/sell.route";
import { SellController } from "./modules/transaction/sell/sell.controller";
import { SellService } from "./modules/transaction/sell/sell.service";

// Sell Return Module
import { SellReturnRouter } from "./modules/transaction/sell-return/sell-return.route";
import { SellReturnController } from "./modules/transaction/sell-return/sell-return.controller";
import { SellReturnService } from "./modules/transaction/sell-return/sell-return.service";

// Transfer Module
import { TransferRouter } from "./modules/transaction/transfer/transfer.route";
import { TransferController } from "./modules/transaction/transfer/transfer.controller";
import { TransferService } from "./modules/transaction/transfer/transfer.service";

// Adjust Stock Module
import { AdjustStockRouter } from "./modules/transaction/adjust-stock/adjust-stock.route";
import { AdjustStockController } from "./modules/transaction/adjust-stock/adjust-stock.controller";
import { AdjustStockService } from "./modules/transaction/adjust-stock/adjust-stock.service";

// Overview Module
import { OverviewRouter } from "./modules/overview/overview/overview.route";
import { OverviewController } from "./modules/overview/overview/overview.controller";
import { OverviewService } from "./modules/overview/overview/overview.service";

// Report Module
import { ReportRouter } from "./modules/report/report/report.route";
import { ReportController } from "./modules/report/report/report.controller";
import { ReportService } from "./modules/report/report/report.service";
import { ReportPdfService } from "./modules/report/report-pdf/report-pdf.service";
import { ReportXlsxService } from "./modules/report/report-xlsx/report-xlsx.service";

// Common Services
import { PrismaService } from "./modules/common/prisma/prisma.service";
import { PasswordService } from "./modules/common/password/password.service";
import { JwtService } from "./modules/common/jwt/jwt.service";

import { Config } from "./config";
import { ReceiptService } from "./modules/report/receipt/receipt.service";
import { ReceiptController } from "./modules/report/receipt/receipt.controller";
import { ReceiptRouter } from "./modules/report/receipt/receipt.route";
import { LabelService } from "./modules/report/label/label.service";
import { LabelController } from "./modules/report/label/label.controller";
import { LabelRouter } from "./modules/report/label/label.route";

// Front Stock Module
import { FrontStockService } from "./modules/stock/front-stock/front-stock.service";
import { FrontStockController } from "./modules/stock/front-stock/front-stock.controller";
import { FrontStockRouter } from "./modules/stock/front-stock/front-stock.route";

// Cash Flow Module
import { CashFlowService } from "./modules/transaction/cash-flow/cash-flow.service";
import { CashFlowController } from "./modules/transaction/cash-flow/cash-flow.controller";
import { CashFlowRouter } from "./modules/transaction/cash-flow/cash-flow.route";

// Backup Restore Module
import { BackupRestoreRouter } from "./modules/data/backup-restore/backup-restore.route";
import { BackupRestoreService } from "./modules/data/backup-restore/backup-restore.service";
import { BackupRestoreController } from "./modules/data/backup-restore/backup-restore.controller";

const api = express.Router();

// init config
const cfg = new Config();

// init common services
const prismaService = new PrismaService();
const passwordService = new PasswordService();
const jwtService = new JwtService(cfg, prismaService);

// init transaction common services
const refreshStockService = new RefreshStockService(prismaService);
const refreshBuyPriceService = new RefreshBuyPriceService(prismaService);

// init branch module
const branchService = new BranchService(prismaService);
const branchController = new BranchController(branchService);
const branchRouter = new BranchRouter(branchController, jwtService);

// init user module
const userService = new UserService(prismaService, passwordService, jwtService);
const userController = new UserController(userService);
const userRouter = new UserRouter(userController, jwtService);

// init item-category module
const itemCategoryService = new ItemCategoryService(prismaService);
const itemCategoryController = new ItemCategoryController(itemCategoryService);
const itemCategoryRouter = new ItemCategoryRouter(
  itemCategoryController,
  jwtService,
);

// init item module
const itemService = new ItemService(prismaService, refreshBuyPriceService);
const itemController = new ItemController(itemService);
const itemRouter = new ItemRouter(itemController, jwtService);

// init supplier module
const supplierService = new SupplierService(prismaService);
const supplierController = new SupplierController(supplierService);
const supplierRouter = new SupplierRouter(supplierController, jwtService);

// init unit module
const unitService = new UnitService(prismaService);
const unitController = new UnitController(unitService);
const unitRouter = new UnitRouter(unitController, jwtService);

// init member-category module
const memberCategoryService = new MemberCategoryService(prismaService);
const memberCategoryController = new MemberCategoryController(
  memberCategoryService,
);
const memberCategoryRouter = new MemberCategoryRouter(
  memberCategoryController,
  jwtService,
);

// init member module
const memberService = new MemberService(prismaService);
const memberController = new MemberController(memberService);
const memberRouter = new MemberRouter(memberController, jwtService);

// init purchase module
const purchaseService = new PurchaseService(
  prismaService,
  refreshStockService,
  refreshBuyPriceService,
);
const purchaseController = new PurchaseController(purchaseService);
const purchaseRouter = new PurchaseRouter(purchaseController, jwtService);

// init purchase-return module
const purchaseReturnService = new PurchaseReturnService(
  prismaService,
  refreshStockService,
);
const purchaseReturnController = new PurchaseReturnController(
  purchaseReturnService,
);
const purchaseReturnRouter = new PurchaseReturnRouter(
  purchaseReturnController,
  jwtService,
);

// init sales module
const salesService = new SalesService(prismaService, refreshStockService);
const salesController = new SalesController(salesService);
const salesRouter = new SalesRouter(salesController, jwtService);

// init sales-return module
const salesReturnService = new SalesReturnService(
  prismaService,
  refreshStockService,
);
const salesReturnController = new SalesReturnController(salesReturnService);
const salesReturnRouter = new SalesReturnRouter(
  salesReturnController,
  jwtService,
);

// init sell module
const sellService = new SellService(prismaService, refreshStockService);
const sellController = new SellController(sellService);
const sellRouter = new SellRouter(sellController, jwtService);

// init sell-return module
const sellReturnService = new SellReturnService(
  prismaService,
  refreshStockService,
);
const sellReturnController = new SellReturnController(sellReturnService);
const sellReturnRouter = new SellReturnRouter(sellReturnController, jwtService);

// init transfer module
const transferService = new TransferService(prismaService, refreshStockService);
const transferController = new TransferController(transferService);
const transferRouter = new TransferRouter(transferController, jwtService);

// init adjust-stock module
const adjustStockService = new AdjustStockService(
  prismaService,
  refreshStockService,
);
const adjustStockController = new AdjustStockController(adjustStockService);
const adjustStockRouter = new AdjustStockRouter(
  adjustStockController,
  jwtService,
);

// init overview module
const overviewService = new OverviewService(prismaService);
const overviewController = new OverviewController(overviewService);
const overviewRouter = new OverviewRouter(overviewController, jwtService);

// init report module
const reportPdfService = new ReportPdfService();
const reportXlsxService = new ReportXlsxService();
const reportService = new ReportService(
  prismaService,
  reportPdfService,
  reportXlsxService,
);
const reportController = new ReportController(reportService);
const reportRouter = new ReportRouter(reportController, jwtService);

// init receipt module
const receiptService = new ReceiptService(prismaService);
const receiptController = new ReceiptController(receiptService);
const receiptRouter = new ReceiptRouter(receiptController, jwtService);

// init label module
const labelService = new LabelService(prismaService);
const labelController = new LabelController(labelService);
const labelRouter = new LabelRouter(labelController, jwtService);

// init front-stock module
const frontStockService = new FrontStockService(
  prismaService,
  refreshStockService,
);
const frontStockController = new FrontStockController(frontStockService);
const frontStockRouter = new FrontStockRouter(frontStockController, jwtService);

// init cash-flow module
const cashFlowService = new CashFlowService(prismaService);
const cashFlowController = new CashFlowController(cashFlowService);
const cashFlowRouter = new CashFlowRouter(cashFlowController, jwtService);

// init backup-restore module
const backupRestoreService = new BackupRestoreService(
  cfg,
  prismaService,
  jwtService,
  passwordService,
);
const backupRestoreController = new BackupRestoreController(
  backupRestoreService,
);
const backupRestoreRouter = new BackupRestoreRouter(
  backupRestoreController,
  jwtService,
);

// use routers
api.use("/app/branch", branchRouter.router);
api.use("/app/user", userRouter.router);
api.use("/master/item-category", itemCategoryRouter.router);
api.use("/master/item", itemRouter.router);
api.use("/master/supplier", supplierRouter.router);
api.use("/master/unit", unitRouter.router);
api.use("/master/member-category", memberCategoryRouter.router);
api.use("/master/member", memberRouter.router);
api.use("/transaction/purchase", purchaseRouter.router);
api.use("/transaction/purchase-return", purchaseReturnRouter.router);
api.use("/transaction/sales", salesRouter.router);
api.use("/transaction/sales-return", salesReturnRouter.router);
api.use("/transaction/sell", sellRouter.router);
api.use("/transaction/sell-return", sellReturnRouter.router);
api.use("/transaction/transfer", transferRouter.router);
api.use("/transaction/adjust-stock", adjustStockRouter.router);
api.use("/overview", overviewRouter.router);
api.use("/report", reportRouter.router);
api.use("/report/receipt", receiptRouter.router);
api.use("/report/label", labelRouter.router);
api.use("/stock/front-stock", frontStockRouter.router);
api.use("/transaction/cash-flow", cashFlowRouter.router);
api.use("/data", backupRestoreRouter.router);

export default api;
