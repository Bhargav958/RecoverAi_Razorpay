import mongoose from "mongoose";

import Customer from "../models/Customer.js";
import Payment from "../models/Payment.js";
import RecoveryCase from "../models/RecoveryCase.js";
import RecoveryAction from "../models/RecoveryAction.js";
import getMerchant from "../utils/getMerchant.js";

const getCustomers = async (req, res) => {
  try {
    const merchant =
      await getMerchant(req.query.merchantId);

    const {
      page = 1,
      limit = 25,
      search = "",
      sort = "ltv"
    } = req.query;

    const parsedPage =
      Math.max(Number(page) || 1, 1);

    const parsedLimit =
      Math.min(Math.max(Number(limit) || 25, 1), 100);

    const filter = {
      merchantId: merchant._id
    };

    if (search.trim()) {
      filter.$or = [
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
        },
        {
          segment: {
            $regex: search.trim(),
            $options: "i"
          }
        }
      ];
    }

    const sortQuery =
      sort === "failed"
        ? { failedPayments: -1, updatedAt: -1 }
        : sort === "recoveries"
          ? { previousRecoveries: -1, updatedAt: -1 }
          : sort === "newest"
            ? { createdAt: -1 }
            : { lifetimeValue: -1, updatedAt: -1 };

    const [
      total,
      customers
    ] = await Promise.all([
      Customer.countDocuments(filter),
      Customer.find(filter)
        .sort(sortQuery)
        .skip((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit)
        .lean()
    ]);

    const customerIds =
      customers.map((customer) => customer._id);

    const activeCounts =
      await RecoveryCase.aggregate([
        {
          $match: {
            merchantId: merchant._id,
            customerId: {
              $in: customerIds
            },
            status: {
              $nin: [
                "RECOVERED",
                "FAILED",
                "STOPPED"
              ]
            }
          }
        },
        {
          $group: {
            _id: "$customerId",
            activeRecoveryCases: {
              $sum: 1
            }
          }
        }
      ]);

    const activeMap =
      new Map(
        activeCounts.map((item) => [
          item._id.toString(),
          item.activeRecoveryCases
        ])
      );

    res.status(200).json({
      success: true,
      data: {
        customers:
          customers.map((customer) => ({
            ...customer,
            activeRecoveryCases:
              activeMap.get(customer._id.toString()) || 0
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
    console.error("Get customers error:", error.message);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID"
      });
    }

    const customer =
      await Customer.findById(id).lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    const [
      payments,
      recoveryCases
    ] = await Promise.all([
      Payment.find({
        customerId: customer._id
      })
        .sort({ createdAt: -1 })
        .limit(25)
        .lean(),

      RecoveryCase.find({
        customerId: customer._id
      })
        .populate(
          "paymentId",
          "amount status method failureCode failureReason razorpayPaymentId isSimulation"
        )
        .sort({ createdAt: -1 })
        .limit(25)
        .lean()
    ]);

    const actions =
      await RecoveryAction.find({
        recoveryCaseId: {
          $in:
            recoveryCases.map((item) => item._id)
        }
      })
        .sort({ createdAt: -1 })
        .limit(25)
        .lean();

    res.status(200).json({
      success: true,
      data: {
        customer,
        payments,
        recoveryCases,
        actions
      }
    });
  } catch (error) {
    console.error("Get customer error:", error.message);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export {
  getCustomers,
  getCustomer
};
