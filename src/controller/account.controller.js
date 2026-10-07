const accountModel = require("../models/account.model");
const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const crypto = require("crypto");
const mongoose = require("mongoose");
async function accountController(req, res) {
  const user = req.user;

  const account = await accountModel.create({
    user: user.id,
  });

  res.status(200).json({
    message: "Account created successfully",
    account,
  });
}
async function deposit(req, res) {
  const session = await mongoose.startSession();
  const { amount } = req.body;

  try {
    const account = await accountModel
      .findOne({
        user: req.user._id,
      })
      .session(session);

    if (!account) {
      return res.status(404).json({
        message: "Account does not exist",
      });
    }

    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({
        message: "Deposit amount should be greater than zero",
      });
    }

    session.startTransaction();

    account.balance += amount;

    await account.save({ session });

    const transaction = await transactionModel.create(
      [
        {
          type: "DEPOSIT",
          amount: amount,
          toAccount: account._id,
          status: "COMPLETED",
          reference: crypto.randomUUID(),
        },
      ],
      { session },
    );

    const ledger = await ledgerModel.create(
      [
        {
          account: account._id,
          transaction: transaction[0]._id,
          type: "CREDIT",
          amount: amount,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return res.status(200).json({
      message: "Amount deposited",
      account,
      transaction: transaction[0],
      ledger: ledger[0],
    });
  } catch (error) {
    console.error(error);

    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    return res.status(500).json({
      message: "Deposit failed",
    });
  } finally {
    await session.endSession();
  }
}

async function withdraw(req, res) {
  const session = await mongoose.startSession();
  const { amount } = req.body;

  try {
    const account = await accountModel
      .findOne({
        user: req.user._id,
      })
      .session(session);
    if (!account) {
      return res.status(404).json({
        message: "Account not exists",
      });
    }
    if (amount > account.balance) {
      return res.status(400).json({
        message: "Npt enough balance",
      });
    }
    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({
        message: "Amount should be more than zero",
      });
    }
    session.startTransaction();

    account.balance -= amount;
    await account.save({ session });

    const transaction = await transactionModel.create(
      [
        {
          type: "WITHDRAW",
          amount: amount,
          fromAccount: account._id,
          status: "COMPLETED",
          reference: crypto.randomUUID(),
        },
      ],
      { session },
    );

    const ledger = await ledgerModel.create(
      [
        {
          account: account._id,
          transaction: transaction[0]._id,
          type: "DEBIT",
          amount: amount,
        },
      ],
      { session },
    );
    await session.commitTransaction();
    res.status(201).json({
      message: "Amount debited successfully",
      transaction: transaction[0],
      ledger: ledger[0],
    });
  } catch (error) {
    console.error(error);

    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    return res.status(500).json({
      message: "Withdrawal failed",
    });
  } finally {
    await session.endSession();
  }
}

async function transfer(req, res) {
  const { amount, toAccount } = req.body;
  const session = await mongoose.startSession();
 

 
  try {
 if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ message: "Invalid amount" });
  }
  const sender = await accountModel.findOne({
    user: req.user._id,
  }).session(session);

  const receiver = await accountModel.findById(toAccount).session(session);
  if (!sender) {
    return res.status(404).json({ message: "Account does not exists" });
  }
  if (!receiver) {
    return res.status(404).json({ message: "Account does not exists" });
  }

  if (sender.balance < amount) {
    return res.status(400).json({ message: "Not enough balance" });
  }
  if (sender.status != "ACTIVE" || receiver.status != "ACTIVE") {
    return res.status(400).json({ message: "One of user is no active" });
  }
  if (sender._id.equals(receiver._id)) {
    return res.status(400).json({
      message: "Cannot transfer to the same account",
    });
  }
   session.startTransaction();

    sender.balance -= amount;
    await sender.save({ session });

    receiver.balance += amount;
    await receiver.save({ session });
    throw new Error("Testing transfer rollback");

    const transaction = await transactionModel.create([{
        type:"TRANSFER",
        amount:amount,
        fromAccount:sender._id,
        toAccount:receiver._id,
        status:"COMPLETED",
        reference:crypto.randomUUID()


    }],{session});

    const senderLedger=await ledgerModel.create([{
        account:sender._id,
        transaction:transaction[0]._id,
        type:"DEBIT",
        amount:amount
    }],{session})

    const receiverLedger=await ledgerModel.create([{
        account:receiver._id,
        transaction:transaction[0]._id,
        type:"CREDIT",
        amount:amount
    }],{session})

    await session.commitTransaction();
    res.status(200).json({
        message:"Transfer completed successfully",
        transaction:transaction[0]
    })

  } catch (error) {

    console.log(error);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    return res.status(500).json({
        message:"Transfer failed"
    })

  }
  finally{
   await session.endSession();
  }
}

module.exports = { accountController, deposit, withdraw,transfer };
