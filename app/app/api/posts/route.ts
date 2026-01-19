import { createFailedApiResponse, createSuccessApiResponse } from "@/lib/api";
import { getPaidData } from "@/lib/x402";
import axios from "axios";
import { ethers } from "ethers";

export async function GET() {
  try {
    console.log("[API] Getting posts...");

    // Prepare wallet
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("PRIVATE_KEY is not defined in environment variables");
    }
    const provider = new ethers.JsonRpcProvider("https://evm-t3.cronos.org");
    const wallet = new ethers.Wallet(privateKey, provider);

    // Get paid data
    const url = "http://localhost:8000/api/posts";
    const data = await getPaidData(url, wallet);

    // Extract posts from response
    const posts: string[] = data.data.posts;

    return createSuccessApiResponse({ posts });
  } catch (error) {
    console.error(
      "[API] Failed to get posts, error:",
      axios.isAxiosError(error)
        ? error.response?.data || error.message
        : error instanceof Error
          ? error.message
          : String(error),
    );
    return createFailedApiResponse(
      { message: "Internal server error, try again later" },
      500,
    );
  }
}
