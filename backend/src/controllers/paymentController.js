import mongoose from "mongoose";

import Customer from "../models/Customer.js";
import Payment from "../models/Payment.js";
import RecoveryAction from "../models/RecoveryAction.js";
import RecoveryCase from "../models/RecoveryCase.js";
import getMerchant from "../utils/getMerchant.js";

const getPayments = async (req, res) => {
  try {
    const merchant =
      await getMerchant(req.query.merchantId);

    const {
      page = 1,
      limit = 25,
      search = "",
      status = "ALL"
    } = req.query;

    const parsedPage =
      Math.max(Number(page) || 1, 1);

    const parsedLimit =
      Math.min(Math.max(Number(limit) || 25, 1), 100);

    const filter = {
      merchantId: merchant._id
    };

    if (status && status !== "ALL") {
      filter.status = status;
    }

    if (search.trim()) {
      const matchingCustomers =
        await Customer.find({
          merchantId: merchant._id,
          $or: [
            {
              name: {
                $regex: search.trim(),
                $options: "i"
              }
            },
            {
              email: {
                $regex: search.trim(),
                $options: "i"
              }
            }
          ]
        }).select("_id");

      filter.$or = [
        {
          customerId: {
            $in:
              matchingCustomers.map((item) => item._id)
          }
        },
        {
          razorpayPaymentId: {
            $regex: search.trim(),
            $options: "i"
          }
        },
        {
          failureCode: {
            $regex: search.trim(),
            $options: "i"
          }
        },
        {
          failureReason: {
            $regex: search.trim(),
            $options: "i"
          }
        }
      ];
    }

    const [
      total,
      payments
    ] = await Promise.all([
      Payment.countDocuments(filter),
      Payment.find(filter)
        .populate("customerId", "name email")
        .sort({ createdAt: -1 })
        .skip((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit)
        .lean()
    ]);

    const paymentIds =
      payments.map((payment) => payment._id);

    const cases =
      await RecoveryCase.find({
        paymentId: {
          $in: paymentIds
        }
      })
        .select("_id paymentId status amountRecovered")
        .lean();

    const caseMap =
      new Map(
        cases.map((item) => [
          item.paymentId.toString(),
          item
        ])
      );

    res.status(200).json({
      success: true,
      data: {
        payments:
          payments.map((payment) => ({
            ...payment,
            recoveryCase:
              caseMap.get(payment._id.toString()) || null
          })),
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total,
          totalPages:
            Math.max(Math.ceil(total / parsedLimit), 1)
        }
      }
    });
  } catch (error) {
    console.error("Get payments error:", error.message);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getPayment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID"
      });
    }

    const payment =
      await Payment.findById(id)
        .populate("customerId")
        .lean();

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    const recoveryCase =
      await RecoveryCase.findOne({
        paymentId: payment._id
      }).lean();

    const actions =
      recoveryCase
        ? await RecoveryAction.find({
            recoveryCaseId: recoveryCase._id
          })
            .sort({ createdAt: -1 })
            .lean()
        : [];

    res.status(200).json({
      success: true,
      data: {
        payment,
        recoveryCase,
        actions
      }
    });
  } catch (error) {
    console.error("Get payment error:", error.message);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export {
  getPayments,
  getPayment
};
