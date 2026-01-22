import { createFailedApiResponse, createSuccessApiResponse } from "@/lib/api";
import { getErrorString } from "@/lib/error";
import { executeBuyTrade } from "@/lib/tools";

export async function POST() {
  try {
    console.log("[API] Executing buy trade...");

    const outputToken = "0xf951eC28187D9E5Ca673Da8FE6757E6f0Be5F77C"; // USDC.E
    const result = await executeBuyTrade(outputToken);

    return createSuccessApiResponse(result);
  } catch (error) {
    console.error(
      `[API] Failed to execute buy trade, error: ${getErrorString(error)}`,
    );
    return createFailedApiResponse(
      { message: "Internal server error, try again later" },
      500,
    );
  }
}
