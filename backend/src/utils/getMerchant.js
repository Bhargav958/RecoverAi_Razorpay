import Merchant from "../models/Merchant.js";

/*
|--------------------------------------------------------------------------
| Get Merchant
|--------------------------------------------------------------------------
|
| During the hackathon development phase we don't have authentication
| wired in yet.
|
| Therefore:
|
| 1. If merchantId is provided, use it.
| 2. Otherwise use the Acme SaaS demo merchant.
|
| Later, authentication middleware will provide the merchant ID.
|
|--------------------------------------------------------------------------
*/

const getMerchant = async (merchantId = null) => {
  let merchant;

  if (merchantId) {
    merchant =
      await Merchant.findById(
        merchantId
      );
  } else {
    merchant =
      (await Merchant.findOne({
        businessName: "IIITT SaaS"
      })) ||
      (await Merchant.findOne({
        businessName: "Acme SaaS"
      })) ||
      (await Merchant.findOne());
  }

  if (!merchant) {
    throw new Error(
      "Merchant not found"
    );
  }

  return merchant;
};

export default getMerchant;