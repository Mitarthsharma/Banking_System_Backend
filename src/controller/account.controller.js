const accountModel = require("../models/account.model");
const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const crypto = require("crypto");
const mongoose = require("mongoose");
async function accountController(req, res) {
  const user = req.user;

  const isAccount=await accountModel.findOne({
    user:user.id
  })
  if(isAccount){
    return res.status(409).json({
      message:"Account already exists"
    })
  }

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
        
        if (typeof amount !== "number" || amount <= 0) {
            return res.status(400).json({
                message: "Withdrawal amount should be greater than zero"
            });
        }

        
        session.startTransaction();

       
        const account = await accountModel.findOneAndUpdate(
            {
                user: req.user._id,
                status: "ACTIVE",
                balance: { $gte: amount }
            },
            {
                $inc: {
                    balance: -amount
                }
            },
            {
                new: true,
                session
            }
        );

        
        if (!account) {
            await session.abortTransaction();

            return res.status(400).json({
                message: "Account not found, inactive, or insufficient balance"
            });
        }

      
        const transaction = await transactionModel.create(
            [{
                type: "WITHDRAW",
                amount: amount,
                fromAccount: account._id,
                status: "COMPLETED",
                reference: crypto.randomUUID()
            }],
            { session }
        );

        
        const ledger = await ledgerModel.create(
            [{
                account: account._id,
                transaction: transaction[0]._id,
                type: "DEBIT",
                amount: amount
            }],
            { session }
        );

        
        await session.commitTransaction();

       
        return res.status(200).json({
            message: "Amount withdrawn successfully",
            account,
            transaction: transaction[0],
            ledger: ledger[0]
        });

    } catch (error) {
        console.error(error);

        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        return res.status(500).json({
            message: "Withdrawal failed"
        });

    } finally {
        await session.endSession();
    }
}

async function transfer(req, res) {
    const { amount, toAccount } = req.body;
    const idempotencyKey = req.headers["idempotency-key"];

    let session;

    try {
        
        if (!idempotencyKey) {
            return res.status(400).json({
                message: "Idempotency-Key header is required"
            });
        }

       
        if (typeof amount !== "number" || amount <= 0 || !Number.isFinite(amount)) {
            return res.status(400).json({
                message: "Invalid amount"
            });
        }

        
        const senderAccount = await accountModel.findOne({
            user: req.user._id
        });

        if (!senderAccount) {
            return res.status(404).json({
                message: "Sender account does not exist"
            });
        }

        
        const existingTransaction = await transactionModel.findOne({
            idempotencyKey
        });

        if (existingTransaction) {
            const sameAmount =
                existingTransaction.amount === amount;

            const sameReceiver =
                existingTransaction.toAccount?.toString() ===
                toAccount?.toString();

            const sameSender =
                existingTransaction.fromAccount?.toString() ===
                senderAccount._id.toString();

            if (!sameAmount || !sameReceiver || !sameSender) {
                return res.status(409).json({
                    message: "Idempotency key already used for a different request"
                });
            }

            return res.status(200).json({
                message: "Transaction already processed",
                transaction: existingTransaction
            });
        }

        
        const receiver = await accountModel.findById(toAccount);

        if (!receiver) {
            return res.status(404).json({
                message: "Receiver account does not exist"
            });
        }

        if (receiver.status !== "ACTIVE") {
            return res.status(400).json({
                message: "Receiver account is not active"
            });
        }

        
        if (senderAccount._id.equals(receiver._id)) {
            return res.status(400).json({
                message: "Cannot transfer to the same account"
            });
        }

      
        session = await mongoose.startSession();
        session.startTransaction();

        
        const sender = await accountModel.findOneAndUpdate(
            {
                _id: senderAccount._id,
                status: "ACTIVE",
                balance: { $gte: amount }
            },
            {
                $inc: {
                    balance: -amount
                }
            },
            {
                new: true,
                session
            }
        );

        if (!sender) {
            await session.abortTransaction();

            return res.status(400).json({
                message: "Insufficient balance or sender account is not active"
            });
        }

      
        const updatedReceiver = await accountModel.findOneAndUpdate(
            {
                _id: receiver._id,
                status: "ACTIVE"
            },
            {
                $inc: {
                    balance: amount
                }
            },
            {
                new: true,
                session
            }
        );

        if (!updatedReceiver) {
            throw new Error("Receiver account update failed");
        }

  
        const transaction = await transactionModel.create(
            [{
                type: "TRANSFER",
                amount,
                fromAccount: sender._id,
                toAccount: updatedReceiver._id,
                status: "COMPLETED",
                reference: crypto.randomUUID(),
                idempotencyKey
            }],
            { session }
        );

       
        const senderLedger = await ledgerModel.create(
            [{
                account: sender._id,
                transaction: transaction[0]._id,
                type: "DEBIT",
                amount
            }],
            { session }
        );

        const receiverLedger = await ledgerModel.create(
            [{
                account: updatedReceiver._id,
                transaction: transaction[0]._id,
                type: "CREDIT",
                amount
            }],
            { session }
        );

      
        await session.commitTransaction();

        return res.status(200).json({
            message: "Transfer completed successfully",
            transaction: transaction[0],
            senderLedger: senderLedger[0],
            receiverLedger: receiverLedger[0]
        });

    } catch (error) {
        console.error("Transfer error:", error);

        if (session?.inTransaction()) {
            await session.abortTransaction();
        }

        
        if (error.code === 11000 && error.keyPattern?.idempotencyKey) {
            return res.status(409).json({
                message: "This idempotency key has already been used. Retry the request to retrieve its result."
            });
        }

        return res.status(500).json({
            message: "Transfer failed"
        });

    } finally {
        if (session) {
            await session.endSession();
        }
    }
}
async function getAccount(req,res){
    const account=await accountModel.findOne({
        user:req.user._id
    })
    if(!account){
        return res.status(404).json({
            message:"Account does not exist"
        })
    }
   return res.status(200).json({
        message:"Account details fetched successfully",
        account
    })
   
}

async function reconsillation(req,res){
    const account=await accountModel.findOne({
        user:req.user._id
    })

    if(!account){
        return res.status(404).json({
            message:"Account does not exists"
        })
    }

    const ledgerBalace=await ledgerModel.aggregate([
        {
            $match:{account:account._id}
        },
        {
            $group:{
                _id:null,
                balance:{
                    $sum:{
                        $cond:[
                           { $eq:["$type","CREDIT"]},
                           "$amount",
                           {$multiply:["$amount",-1]}
                        ]
                    }

                }
            }

        }
    ])

    const calculatedBalance = ledgerBalance.length > 0
    ? ledgerBalance[0].balance
    : 0;
    const isReconciled=calculatedBalance===account.balance;
    
        return res.status(200).json({
    message: "Account reconciliation completed",
    reconciliation: {
        accountId: account._id,
        storedBalance: account.balance,
        calculatedBalance,
        difference: account.balance - calculatedBalance,
        status: isReconciled ? "MATCHED" : "MISMATCH"
    }
});
    }


module.exports = { accountController, deposit, withdraw,transfer,getAccount,reconsillation};
