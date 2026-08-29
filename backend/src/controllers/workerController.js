import processDueActions
  from "../services/recoveryWorker.js";

const runRecoveryWorker = async (
  req,
  res
) => {
  try {
    const {
      merchantId = null,
      recoveryCaseId = null,
      ignoreSchedule = false,
      mode = "SIMULATION",
      limit = 20
    } = req.body || {};

    const result =
      await processDueActions({

        merchantId,

        recoveryCaseId,

        ignoreSchedule,

        mode,

        limit
      });

    res.status(200).json({

      success: true,

      data: result

    });

  } catch (error) {
    console.error(
      "Recovery worker error:",
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
  runRecoveryWorker
};
