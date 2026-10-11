const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const accountController = require("../controller/account.controller");
const transactionController=require("../controller/transaction.controller")

router.post(
    "/",
    authMiddleware.authMiddleware,
    accountController.accountController
);

router.post(
    "/deposit",
    authMiddleware.authMiddleware,
    accountController.deposit
);
router.post(
    "/withdraw",
    authMiddleware.authMiddleware,
    accountController.withdraw
);

router.get("/transactions",authMiddleware.authMiddleware,transactionController.getTransactions)
router.get("/account",authMiddleware.authMiddleware,accountController.getAccount);

router.post("/transfer",authMiddleware.authMiddleware,accountController.transfer)

router.get("/reconsillation",authMiddleware.authMiddleware,accountController.reconsillation)
module.exports = router;