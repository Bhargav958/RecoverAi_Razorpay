import processRazorpayWebhook
  from "../services/razorpayWebhookService.js";

/*
|--------------------------------------------------------------------------
| Razorpay Webhook Controller
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| The Razorpay webhook request must reach this controller with
| the RAW request body.
|
| Signature verification is performed inside
| razorpayWebhookService.js BEFORE the body is parsed.
|
|--------------------------------------------------------------------------
*/

const handleRazorpayWebhook = async (
  req,
  res
) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | Get raw request body
    |--------------------------------------------------------------------------
    |
    | express.raw() gives us a Buffer.
    |
    */

    const rawBody =
      Buffer.isBuffer(req.body)
        ? req.body.toString("utf8")
        : typeof req.body === "string"
          ? req.body
          : null;

    if (!rawBody) {
      return res.status(400).json({
        success: false,
        message:
          "Raw Razorpay webhook body is missing."
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Razorpay headers
    |--------------------------------------------------------------------------
    */

    const signature =
      req.get(
        "X-Razorpay-Signature"
      );

    const eventId =
      req.get(
        "x-razorpay-event-id"
      );

    if (!signature) {
      return res.status(400).json({
        success: false,
        message:
          "Razorpay webhook signature is missing."
      });
    }

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message:
          "Razorpay webhook event ID is missing."
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Process webhook
    |--------------------------------------------------------------------------
    |
    | The service:
    |
    | 1. Verifies signature using rawBody
    | 2. Parses the payload
    | 3. Resolves merchant
    | 4. Handles idempotency
    | 5. Processes the event
    |
    |--------------------------------------------------------------------------
    */

    const result =
      await processRazorpayWebhook({
        rawBody,

        signature,

        eventId,

        secret:
          process.env
            .RAZORPAY_WEBHOOK_SECRET
      });

    /*
    |--------------------------------------------------------------------------
    | Successful webhook
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,

      data: result
    });

  } catch (error) {
    console.error(
      "\n========== RAZORPAY WEBHOOK ERROR =========="
    );

    console.error(
      error.message
    );

    console.error(
      "============================================\n"
    );

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    |
    | Return non-2xx for genuine processing failures.
    |
    | This allows Razorpay to retry the webhook.
    |
    |--------------------------------------------------------------------------
    */

    return res.status(500).json({
      success: false,

      message:
        error.message
    });
  }
};

export {
  handleRazorpayWebhook
};

export default handleRazorpayWebhook;