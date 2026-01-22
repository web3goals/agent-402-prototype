import { createFailedApiResponse, createSuccessApiResponse } from "@/lib/api";
import { getErrorString } from "@/lib/error";
import { getDataSourcePosts } from "@/lib/tools";

export async function GET() {
  try {
    console.log("[API] Getting data source posts...");

    const dataSource = "697113179979539ef20d9c3a"; // Zero or Hero
    const result = await getDataSourcePosts(dataSource);

    return createSuccessApiResponse(result);
  } catch (error) {
    console.error(
      `[API] Failed to get data source posts, error: ${getErrorString(error)}`,
    );
    return createFailedApiResponse(
      { message: "Internal server error, try again later" },
      500,
    );
  }
}
