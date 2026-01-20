import { processMessage } from "@/lib/agent";
import { createFailedApiResponse, createSuccessApiResponse } from "@/lib/api";
import axios from "axios";
import { NextRequest } from "next/server";
import z from "zod";

export async function POST(request: NextRequest) {
  try {
    console.log("[API] Post message...");

    // Define the schema for request body validation
    const bodySchema = z.object({
      message: z.string(),
      interactionId: z.string().optional(),
    });

    // Extract request body
    const body = await request.json();

    // Validate request body using schema
    const bodyParseResult = bodySchema.safeParse(body);
    if (!bodyParseResult.success) {
      return createFailedApiResponse(
        {
          message: `Invalid request body: ${bodyParseResult.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join(", ")}`,
        },
        400,
      );
    }

    // Extract validated data
    const { message, interactionId } = bodyParseResult.data;

    // Process the message
    const { content: responseContent, interactionId: responseInteractionId } =
      await processMessage(message, interactionId);

    return createSuccessApiResponse({
      role: responseContent.role,
      parts: responseContent.parts,
      interactionId: responseInteractionId,
    });
  } catch (error) {
    console.error(
      "[API] Failed to post message, error:",
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
