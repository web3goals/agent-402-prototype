import { BaseMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { createAgent, tool } from "langchain";
import { z } from "zod";
import { getDataSourcePosts, getDataSources } from "./tools";

const model = new ChatOpenAI({
  model: "google/gemini-3-flash-preview",
  apiKey: process.env.OPEN_ROUTER_API_KEY,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
  temperature: 0,
});

const getDataSourcesTool = tool(async () => await getDataSources(), {
  name: "get_data_sources",
  description: "Gets a list of available data sources.",
  schema: z.object({}),
});

const getDataSourcePostsTool = tool(
  async (input) => await getDataSourcePosts(input.dataSource),
  {
    name: "get_data_source_posts",
    description: "Gets posts from a specific data source.",
    schema: z.object({
      dataSource: z.string().describe("The name of the data source"),
    }),
  },
);

const agent = createAgent({
  model,
  tools: [getDataSourcesTool, getDataSourcePostsTool],
  systemPrompt: "You are a helpful assistant.",
});

export async function processMessage(
  messages: BaseMessage[],
): Promise<BaseMessage> {
  const result = await agent.invoke({ messages });
  const lastMessage = result.messages[result.messages.length - 1];
  return lastMessage;
}
