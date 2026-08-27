import getMerchant from "../utils/getMerchant.js";

import runSimulation from "../services/simulationService.js";

const runBatchSimulation = async (
  req,
  res
) => {
  try {
    const merchant =
      await getMerchant(
        req.body?.merchantId
      );

    const batchSize =
      Number(
        req.body?.batchSize || 10
      );

    const mode =
      req.body?.mode ||
      "SIMULATION";

    const result =
      await runSimulation({
        merchantId:
          merchant._id,

        batchSize,

        mode
      });

    res.status(200).json({
      success: true,

      data: {
        merchant: {
          id: merchant._id,

          businessName:
            merchant.businessName
        },

        ...result
      }
    });
  } catch (error) {
    console.error(
      "Batch simulation error:",
      error.message
    );

    res.status(500).json({
      success: false,

      message:
        error.message
    });
  }
};

export {
  runBatchSimulation
};