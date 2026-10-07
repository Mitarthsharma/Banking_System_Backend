const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const accountController = require("../controller/account.controller");

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

router.post("/transfer",authMiddleware.authMiddleware,accountController.transfer)
module.exports = router;