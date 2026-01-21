import { BaseMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { createAgent, tool } from "langchain";
import { z } from "zod";
import {
  executeBuyTrade,
  getDataSourcePosts,
  getDataSources,
  getStatus,
} from "./tools";

const model = new ChatOpenAI({
  model: "google/gemini-3-flash-preview",
  apiKey: process.env.OPEN_ROUTER_API_KEY,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
  temperature: 0,
});

const getStatusTool = tool(async () => await getStatus(), {
  name: "get_status",
  description: "Gets the current status of the agent.",
  schema: z.object({}),
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
    description:
      "Gets posts from a specific data source by paying for data using the x402 protocol.",
    schema: z.object({
      dataSource: z.string().describe("The name of the data source"),
    }),
  },
);

const executeBuyTradeTool = tool(
  async (input) => await executeBuyTrade(input.outputToken),
  {
    name: "execute_buy_trade",
    description: "Executes a buy trade for a specific token using VVS Finance.",
    schema: z.object({
      outputToken: z.string().describe("The address of the token to buy"),
    }),
  },
);

const systemPrompt = `
# Context

- You are an AI agent for Cronos that utilizes the x402 protocol to execute trades powered by private Telegram channels and other premium data sources.
- Your name is Agent 402.
- You work on Cronos Mainnet.
- The native token of Cronos is CRO.
- The link of the Cronos block explorer is https://explorer.cronos.org/.

# How to suggest trading ideas

1. Get a list of available data sources.
2. Get posts for each data source.
3. Analyze the posts to identify potential buy trading opportunities.
4. Suggest only one buy trade based on your analysis.
5. Explain, what payments you did via the x402 protocol to get the data source posts.
6. Make your answer short and concise.

# How to execute trades

1. You can execute only buy trades using VVS Finance for now.
2. You support only the following tokens to buy.
3. Your buy trades should be based on trading ideas you identified from the data source posts.

# Tokens addresses, names and symbols

- 0x062E66477Faf219F25D27dCED647BF57C3107d52 - Wrapped BTC (WBTC)
- 0xe44Fd7fCb2b1581822D0c862B68222998a0c299a - Wrapped Ether (WETH)
- 0xc9DE0F3e08162312528FF72559db82590b481800 - SOL (SOL)
- 0x2d03bece6747adc00e1a131bba1469c15fd11e03 - VVSToken (VVS)
- 0xf951eC28187D9E5Ca673Da8FE6757E6f0Be5F77C - Stargate Bridged USDC (USDC.E)
`;

const agent = createAgent({
  model,
  tools: [
    getStatusTool,
    getDataSourcesTool,
    getDataSourcePostsTool,
    executeBuyTradeTool,
  ],
  systemPrompt,
});

export async function processMessage(
  messages: BaseMessage[],
): Promise<BaseMessage> {
  const result = await agent.invoke({ messages });
  const lastMessage = result.messages[result.messages.length - 1];
  return lastMessage;
}
