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

    // Pagination
    const page = parseInt(req.query.page) || 1;

    const limit = Math.min(
        parseInt(req.query.limit) || 10,
        50
    );

    const skip = (page - 1) * limit;

    // Transaction type filter
    const type = req.query.type;

    const filter = {
        $or: [
            { fromAccount: account._id },
            { toAccount: account._id }
        ]
    };

    // Apply the filter only if a type is provided
    if (type) {
        filter.type = type;
    }

    // Fetch transactions
    const transactions = await transactionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    // Count matching transactions
    const totalTransactions =
        await transactionModel.countDocuments(filter);

    // Calculate total pages
    const totalPages = Math.ceil(
        totalTransactions / limit
    );

    return res.status(200).json({
        message: "Transactions fetched successfully",
        transactions,
        pagination: {
            page,
            limit,
            totalTransactions,
            totalPages
        }
    });
}
module.exports={getTransactions}