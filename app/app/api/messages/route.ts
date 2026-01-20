import { processMessage } from "@/lib/agent";
import { createFailedApiResponse, createSuccessApiResponse } from "@/lib/api";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import axios from "axios";
import { NextRequest } from "next/server";
import z from "zod";

export async function POST(request: NextRequest) {
  try {
    console.log("[API] Post message...");

    // Define the schema for request body validation
    const bodySchema = z.object({
      messages: z.array(
        z.object({
          type: z.enum(["human", "ai"]),
          content: z.string(),
        }),
      ),
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
    const { messages: rawMessages } = bodyParseResult.data;

    // Convert to LangChain messages
    const chatMessages: BaseMessage[] = rawMessages.map((m) => {
      if (m.type === "ai") {
        return new AIMessage(m.content);
      } else {
        return new HumanMessage(m.content);
      }
    });

    // Process the message history
    const responseMessage = await processMessage(chatMessages);

    // Return the result
    return createSuccessApiResponse({
      type: responseMessage.type,
      content: responseMessage.content,
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
