import { createFailedApiResponse, createSuccessApiResponse } from "@/lib/api";
import { GoogleGenAI } from "@google/genai/node";
import axios from "axios";
import { NextRequest } from "next/server";
import z from "zod";

export async function POST(request: NextRequest) {
  try {
    console.log("[API] Post message...");

    // Define the schema for request body validation
    const bodySchema = z.object({
      message: z.string(),
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
    const { message } = bodyParseResult.data;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: message,
    });

    return createSuccessApiResponse({ message: response.text });
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
