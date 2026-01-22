import { createFailedApiResponse, createSuccessApiResponse } from "@/lib/api";
import { getErrorString } from "@/lib/error";
import {
  BuiltInChainId,
  fetchBestTrade,
  PoolType,
  utils as SwapSdkUtils,
} from "@vvs-finance/swap-sdk";

export async function POST() {
  try {
    console.log("[API] Executing trade...");

    const chainId = BuiltInChainId.CRONOS_MAINNET;
    const inputToken = "NATIVE"; // VVS
    const outputToken = "0x2D03bECE6747ADC00E1a131BBA1469C15fD11e03"; // VVS
    const amount = "0.1";
    const clientId = process.env.VVS_FINANCE_CLIENT_ID;

    const trade = await fetchBestTrade(
      chainId,
      inputToken,
      outputToken,
      amount,
      {
        poolTypes: [
          PoolType.V2,
          PoolType.V3_100,
          PoolType.V3_500,
          PoolType.V3_3000,
          PoolType.V3_10000,
        ],
        maxHops: 3,
        maxSplits: 2,
        quoteApiClientId: clientId,
      },
    );

    console.log(`trade: ${SwapSdkUtils.formatTrade(trade)}`);
    console.log(trade);

    return createSuccessApiResponse({ message: "Ok!" });
  } catch (error) {
    console.error(
      `[API] Failed to execute trade, error: ${getErrorString(error)}`,
    );
    return createFailedApiResponse(
      { message: "Internal server error, try again later" },
      500,
    );
  }
}
