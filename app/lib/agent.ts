import { BaseMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { createAgent, tool } from "langchain";
import { z } from "zod";
import { getDataSources, getWeather } from "./tools";

const model = new ChatOpenAI({
  model: "google/gemini-3-flash-preview",
  apiKey: process.env.OPEN_ROUTER_API_KEY,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
  temperature: 0,
});

const getWeatherTool = tool(async (input) => await getWeather(input.location), {
  name: "get_weather",
  description: "Gets the weather for a given location.",
  schema: z.object({
    location: z.string().describe("The city and state, e.g. San Francisco, CA"),
  }),
});

const getDataSourcesTool = tool(async () => await getDataSources(), {
  name: "get_data_sources",
  description: "Gets a list of available data sources.",
  schema: z.object({}),
});

const agent = createAgent({
  model,
  tools: [getWeatherTool, getDataSourcesTool],
  systemPrompt: "You are a helpful assistant.",
});

export async function processMessage(
  messages: BaseMessage[],
): Promise<BaseMessage> {
  const result = await agent.invoke({ messages });
  const lastMessage = result.messages[result.messages.length - 1];
  return lastMessage;
}
