const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const mongoose = require("mongoose");

async function getTransactions(req, res) {
    const account = await accountModel.findOne({
        user: req.user._id
    });

    if (!account) {
        return res.status(404).json({
            message: "Account does not exist"
        });
    }

    const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 10;
const skip = (page - 1) * limit;
const transaction=await transactionModel.find({
    $or:[
        {fromAccount:account._id},
        {toAccount:account._id}
    ]
}).sort({createdAt:-1}).skip(skip)
.limit(limit)
    return res.status(200).json({
        message:"All the transaction with current account",
        transaction
    });
}

module.exports={getTransactions}