import { createFailedApiResponse, createSuccessApiResponse } from "@/lib/api";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import { NextRequest } from "next/server";
import z from "zod";

function getWeather(location: string) {
  return `The weather in ${location} is sunny.`;
}

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

    // 2. Send the request with tools
    let interaction = await ai.interactions.create({
      model: "gemini-3-flash-preview",
      input: message,
      tools: [
        {
          type: "function",
          name: "get_weather",
          description: "Gets the weather for a given location.",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "The city and state, e.g. San Francisco, CA",
              },
            },
            required: ["location"],
          },
        },
      ],
    });

    // Handle tool calls in a loop
    let hasToolCalls = true;
    while (hasToolCalls) {
      hasToolCalls = false;

      const functionCallOutput = interaction.outputs?.find(
        (o) => o.type === "function_call",
      );

      if (functionCallOutput) {
        hasToolCalls = true; // Continue loop if we find a tool call
        console.log(
          `Tool Call: ${functionCallOutput.name}(${JSON.stringify(functionCallOutput.arguments)})`,
        );

        // Execute your actual function here
        const result = getWeather(
          JSON.stringify(functionCallOutput.arguments.location),
        );

        // Send result back to the model
        interaction = await ai.interactions.create({
          model: "gemini-3-flash-preview",
          previous_interaction_id: interaction.id,
          input: [
            {
              type: "function_result",
              name: functionCallOutput.name,
              call_id: functionCallOutput.id,
              result: result,
            },
          ],
        });
      }
    }

    // Extract the final text response
    const textOutput = interaction.outputs?.find((o) => o.type === "text");
    const content = textOutput?.text || "No response text found";

    return createSuccessApiResponse({
      role: "model",
      parts: [{ text: content }],
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
