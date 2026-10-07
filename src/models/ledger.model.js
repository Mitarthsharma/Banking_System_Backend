const mongoose = require("mongoose");

const ledgerSchema = new mongoose.Schema({

    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: true
    },

    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "transaction",
        required: true
    },

    type: {
        type: String,
        enum: ["CREDIT", "DEBIT"],
        required: true
    },

    amount: {
        type: Number,
        required: true
    }

}, {
    timestamps: true
});

const ledgerModel = mongoose.model("ledger", ledgerSchema);

module.exports = ledgerModel;