import { Content, GoogleGenAI, Interactions } from "@google/genai";

const model: Interactions.Model = "gemini-2.5-flash";
const tools: Interactions.Tool[] = [
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
  {
    type: "function",
    name: "get_data_sources",
    description: "Gets a list of available data sources.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

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
    model: model,
    previous_interaction_id: interactionId,
    input: message,
    tools: tools,
  });

  // Handle the tool call
  for (const output of interaction.outputs!) {
    if (output.type === "function_call") {
      // Get the result from the tool
      const result = getToolResult(output);

      // Send result back to the model
      interaction = await ai.interactions.create({
        model: "gemini-2.5-flash",
        previous_interaction_id: interaction.id,
        input: [
          {
            type: "function_result",
            name: output.name,
            call_id: output.id,
            result: result,
          },
        ],
      });
    }
  }

  // Extract the final text response
  const textOutput = interaction.outputs?.find(
    (output) => output.type === "text",
  );

  return {
    content: {
      role: "model",
      parts: [{ text: textOutput?.text || "No response text found" }],
    },
    interactionId: interaction.id,
  };
}

function getToolResult(
  functionCallOutput: Interactions.FunctionCallContent,
): string {
  if (functionCallOutput.name === "get_weather") {
    return getWeather(JSON.stringify(functionCallOutput.arguments.location));
  }
  if (functionCallOutput.name === "get_data_sources") {
    return getDataSources();
  }
  return "Not found tool to get result";
}

function getWeather(location: string) {
  return `The weather in ${location} is sunny.`;
}

function getDataSources(): string {
  const dataSources = [
    {
      name: "Alice The Trader",
      description: "Expert in cryptocurrency trading and market analysis.",
      type: "TELEGRAM_CHANNEL",
      price: "0.01 USD",
    },
  ];
  return JSON.stringify(dataSources);
}
