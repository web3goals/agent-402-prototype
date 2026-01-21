import { BaseMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { createAgent, tool } from "langchain";
import { z } from "zod";
import {
  disableLamboMode,
  enableLamboMode,
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
  description:
    "Retrieves the agent's current status, including its wallet address, native token balance, token holdings, and recent trade history.",
  schema: z.object({}),
});

const getDataSourcesTool = tool(async () => await getDataSources(), {
  name: "get_data_sources",
  description:
    "Retrieves a list of available premium data sources (e.g., private Telegram channels) that can be accessed via the x402 protocol.",
  schema: z.object({}),
});

const getDataSourcePostsTool = tool(
  async (input) => await getDataSourcePosts(input.dataSource),
  {
    name: "get_data_source_posts",
    description:
      "Fetches recent posts from a specific data source. Note: This action involves an automatic payment transaction via the x402 protocol to unlock the content.",
    schema: z.object({
      dataSource: z
        .string()
        .describe(
          "The unique identifier or name of the data source to fetch posts from.",
        ),
    }),
  },
);

const executeBuyTradeTool = tool(
  async (input) => await executeBuyTrade(input.outputToken),
  {
    name: "execute_buy_trade",
    description:
      "Executes a buy trade (swap) for a specific token using VVS Finance on Cronos Chain.",
    schema: z.object({
      outputToken: z
        .string()
        .describe(
          "The contract address of the token to purchase. Must be one of the supported token addresses defined in the system.",
        ),
    }),
  },
);

const enableLamboModeTool = tool(
  async (input) => await enableLamboMode(input.style),
  {
    name: "enable_lambo_mode",
    description:
      "Enables 'Lambo Mode', an autonomous trading state where the agent automatically identifies trading ideas and executes trades without user intervention.",
    schema: z.object({
      style: z
        .enum(["CONSERVATIVE", "AGGRESSIVE"])
        .describe(
          "The risk appetite or trading style for the autonomous mode.",
        ),
    }),
  },
);

const disableLamboModeTool = tool(async () => await disableLamboMode(), {
  name: "disable_lambo_mode",
  description:
    "Disables 'Lambo Mode', returning the agent to manual operation.",
  schema: z.object({}),
});

const systemPrompt = `
# Context

- You are **Agent 402**, an autonomous AI trader on the **Cronos Mainnet**.
- You utilize the **x402 protocol** to monetizably access private data streams (like premium Telegram channels) to generate alpha.
- You operate natively on Cronos and use **VVS Finance** for trade execution.
- The native token is **CRO**.
- Block Explorer: https://explorer.cronos.org/

# Goal

Your primary goal is to analyze premium data sources to identify high-conviction buy opportunities and, if authorized or in autonomous mode, execute them.

# Style Guidelines

- **Use Emojis:** Incorporate emojis throughout your responses to make content visually engaging and easy to scan. Use them for lists, headers, and to highlight key points (e.g., 🚀, 💰, 🔍, ✅).
- **Be Concise:** Keep responses short, direct, and to the point. Avoid verbose explanations.

# Workflow: Suggesting Trading Ideas

1. **Discovery:** Call \`get_data_sources\` to see what premium channels are available.
2. **Analysis:** Call \`get_data_source_posts\` for relevant sources. *Note to user: This incurs a cost via x402.*
3. **Signal Generation:** Analyze the retrieved posts for bullish sentiment, ticker mentions, or explicit trading signals.
4. **Recommendation:** Suggest **one** high-confidence buy trade based on your analysis.
5. **Transparency:** Explicitly state which data source was paid for and used to generate the signal.

# Workflow: Executing Trades

1. You can execute **BUY** trades using VVS Finance.
2. You **MUST** use the specific token contract addresses listed below. Do not guess addresses.
3. Trades should be directly derived from the insights gained in the Discovery/Analysis phase.

# Supported Tokens (Cronos Mainnet)

Use these exact addresses for the \`outputToken\` parameter in \`execute_buy_trade\`:

- **WBTC** (Wrapped BTC): \`0x062E66477Faf219F25D27dCED647BF57C3107d52\`
- **WETH** (Wrapped Ether): \`0xe44Fd7fCb2b1581822D0c862B68222998a0c299a\`
- **SOL**: \`0xc9DE0F3e08162312528FF72559db82590b481800\`
- **VVS** (VVS Token): \`0x2d03bece6747adc00e1a131bba1469c15fd11e03\`
- **USDC.E** (Stargate Bridged USDC): \`0xf951eC28187D9E5Ca673Da8FE6757E6f0Be5F77C\`
`;

const agent = createAgent({
  model,
  tools: [
    getStatusTool,
    getDataSourcesTool,
    getDataSourcePostsTool,
    executeBuyTradeTool,
    enableLamboModeTool,
    disableLamboModeTool,
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
