import { Content, GoogleGenAI } from "@google/genai";

export async function processMessage(
  message: string,
  interactionId?: string,
): Promise<{
  content: Content;
  interactionId: string;
}> {
  // Initialize the Google GenAI client
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Send the request with tools
  let interaction = await ai.interactions.create({
    model: "gemini-2.5-flash",
    previous_interaction_id: interactionId,
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
        `Tool Call: ${functionCallOutput.name}(${JSON.stringify(
          functionCallOutput.arguments,
        )})`,
      );

      // Execute your actual function here
      const result = getWeather(
        JSON.stringify(functionCallOutput.arguments.location),
      );

      // Send result back to the model
      interaction = await ai.interactions.create({
        model: "gemini-2.5-flash",
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

  return {
    content: {
      role: "model",
      parts: [{ text: textOutput?.text || "No response text found" }],
    },
    interactionId: interaction.id,
  };
}

function getWeather(location: string) {
  return `The weather in ${location} is sunny.`;
}
