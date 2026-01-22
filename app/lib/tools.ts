import { DataSource, DataSourcePost } from "@/types/data-source";
import axios from "axios";
import { getErrorString } from "./error";
import {
  approveIfNeeded,
  BuiltInChainId,
  executeTrade,
  fetchBestTrade,
  PoolType,
} from "@vvs-finance/swap-sdk";
import { ethers } from "ethers";

export async function getDemoStatus(): Promise<string> {
  const status = {
    address: "0x758190cE14e736A93C88063b5325B72b8e159C51",
    balance: "32.877",
    tokens: [
      {
        address: "0x062E66477Faf219F25D27dCED647BF57C3107d52",
        amount: "0.0000001",
      },
    ],
    buyTrades: [
      {
        executed: new Date().toISOString(),
        inputToken: "NATIVE",
        outputToken: "0x062E66477Faf219F25D27dCED647BF57C3107d52",
        amount: "0.1",
        tx: "0x7a3db07bb6b0d298a83896b41619dfe12b86233933c35df3e8250b64aa5f22da",
      },
    ],
  };

  return JSON.stringify(status);
}

export async function getDemoDataSources(): Promise<string> {
  const dataSources: DataSource[] = [
    {
      id: "697113179979539ef20d9c3a",
      name: "Zero or Hero",
      description: "100x signals for the financially reckless 🚀",
      type: "TELEGRAM_CHANNEL",
      price: "0.01 USD",
    },
  ];

  return JSON.stringify(dataSources);
}

export async function getDemoDataSourcePosts(
  dataSource: string,
): Promise<string> {
  await axios.get("http://localhost:8000/api/data-sources/free-posts");

  const dataSourcePosts: DataSourcePost[] = [
    {
      created: new Date().toISOString(),
      content: `Bitcoin is currently facing a significant test of sentiment as it slips toward the $89,000 mark, driven largely by global "risk-off" movements and trade-related tensions. After a four-day losing streak—the longest since early January—all eyes are on the $88,000 short-term support level; a sustained hold here could pave the way for a recovery toward $92k, but a break lower risks a deeper retest of the $84k zone. With nearly $1 billion in leveraged positions liquidated across the market in the last 24 hours, volatility remains high, making this a critical "wait-and-see" zone for spot buyers.`,
    },
    {
      created: new Date().toISOString(),
      content: `Ethereum has taken a steeper hit than the market leader, losing over 6% in the last 24 hours to trade right at the $2,990 threshold. The technical setup is fragile as ETH sits below its 100-hour SMA, with immediate bearish resistance capped at $3,020. While long-term fundamentals like record-high active addresses and "mini app" growth on Layer 2s remain strong, the short-term price is being pinned down by whale distribution and a lack of aggressive breakout buying. Keep a close watch on the $2,880 line; if this support fails, we may see a rapid slide toward the $2,650 region.`,
    },
    {
      created: new Date().toISOString(),
      content: `Solana is currently mimicking Bitcoin's breakdown, shedding roughly 5% to hover near the $126 support level. Despite a thriving ecosystem and record staking ratios, the token has sliced through its 200-day EMA, signaling that the current correction may have more room to run if the $110 "make-or-break" zone is challenged. Traders should look for a stabilization of capital flows back into the network to reclaim the $135 range; otherwise, the market remains in a defensive posture until global trade anxieties cool and the Alpenglow upgrade provides a fresh narrative catalyst.`,
    },
  ];

  const payment = {
    token: "0xf951eC28187D9E5Ca673Da8FE6757E6f0Be5F77C",
    amount: "100000",
  };

  return JSON.stringify({ dataSource, dataSourcePosts, payment });
}

// TODO: Delete
export async function executeDemoBuyTrade(
  outputToken: string,
): Promise<string> {
  const trade = {
    executed: new Date().toISOString(),
    inputToken: "NATIVE",
    outputToken: outputToken,
    amount: "0.1",
    tx: "0x7a3db07bb6b0d298a83896b41619dfe12b86233933c35df3e8250b64aa5f22da",
  };

  return JSON.stringify(trade);
}

export async function executeBuyTrade(outputToken: string): Promise<string> {
  try {
    console.log(`[Tools] Executing buy trade, output token: ${outputToken}...`);

    // Fetch the best trade from VVS Finance SDK
    const chainId = BuiltInChainId.CRONOS_MAINNET;
    const inputToken = "NATIVE";
    const amount = "0.1";
    const clientId = process.env.VVS_FINANCE_CLIENT_ID;

    const trade = await fetchBestTrade(
      chainId,
      inputToken,
      outputToken,
      amount,
      {
        poolTypes: [
          PoolType.V2,
          PoolType.V3_100,
          PoolType.V3_500,
          PoolType.V3_3000,
          PoolType.V3_10000,
        ],
        maxHops: 3,
        maxSplits: 2,
        quoteApiClientId: clientId,
      },
    );
    console.log(
      `[Tools] Trade: ${JSON.stringify(trade, (_, value) =>
        typeof value === "bigint" ? value.toString() : value,
      )}`,
    );

    // Execute the trade
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("PRIVATE_KEY is not defined in environment variables");
    }
    const rpc = "https://evm-dev.cronos.org";
    const provider = new ethers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(privateKey, provider);

    const approveTx = await approveIfNeeded(chainId, trade, wallet);
    if (approveTx) {
      await approveTx.wait();
    }

    const executeTx = await executeTrade(chainId, trade, wallet);

    const result = {
      chainId,
      inputToken,
      outputToken,
      amount,
      tx: executeTx.hash,
    };

    return JSON.stringify(result);
  } catch (error) {
    console.error(
      `[Tools] Failed to execute buy trade, error: ${getErrorString(error)}`,
    );
    return `Failed to execute buy trade, error: ${getErrorString(error)}`;
  }
}

export async function enableDemoLamboMode(
  style: "CONSERVATIVE" | "AGGRESSIVE",
): Promise<string> {
  const status = { enabled: true, style };

  return JSON.stringify(status);
}

export async function disableDemoLamboMode(): Promise<string> {
  const status = { enabled: false };

  return JSON.stringify(status);
}
