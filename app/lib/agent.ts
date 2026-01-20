import { BaseMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { createAgent, tool } from "langchain";
import { z } from "zod";

const model = new ChatOpenAI({
  model: "google/gemini-3-flash-preview",
  apiKey: process.env.OPEN_ROUTER_API_KEY,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
  temperature: 0,
});

const getWeather = tool(
  (input) => {
    return `The weather in ${input.location} is sunny.`;
  },
  {
    name: "get_weather",
    description: "Gets the weather for a given location.",
    schema: z.object({
      location: z
        .string()
        .describe("The city and state, e.g. San Francisco, CA"),
    }),
  },
);

const getDataSources = tool(
  () => {
    const dataSources = [
      {
        name: "Alice The Trader",
        description: "Expert in cryptocurrency trading and market analysis.",
        type: "TELEGRAM_CHANNEL",
        price: "0.01 USD",
      },
    ];
    return JSON.stringify(dataSources);
  },
  {
    name: "get_data_sources",
    description: "Gets a list of available data sources.",
    schema: z.object({}),
  },
);

const agent = createAgent({
  model,
  tools: [getWeather, getDataSources],
  systemPrompt: "You are a helpful assistant.",
});

export async function processMessage(
  messages: BaseMessage[],
): Promise<BaseMessage> {
  const result = await agent.invoke({ messages });
  const lastMessage = result.messages[result.messages.length - 1];
  return lastMessage;
}
