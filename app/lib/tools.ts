import {
  approveIfNeeded,
  BuiltInChainId,
  executeTrade,
  fetchBestTrade,
  PoolType,
} from "@vvs-finance/swap-sdk";
import axios from "axios";
import { ethers } from "ethers";
import { getErrorString } from "./error";
import { getPaidData } from "./x402";

// TODO: Implement
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

export async function getDataSources(): Promise<string> {
  try {
    console.log(`[Tools] Getting data sources...`);
    const url = `http://localhost:8000/api/data-sources`;
    const { data } = await axios.get(url);

    const result = { dataSources: data.dataSources };

    return JSON.stringify(result);
  } catch (error) {
    console.error(
      `[Tools] Failed to get data sources, error: ${getErrorString(error)}`,
    );
    return `Failed to get data sources, error: ${getErrorString(error)}`;
  }
}

export async function getDataSourcePosts(dataSource: string): Promise<string> {
  try {
    console.log(
      `[Tools] Getting data source posts, data source: ${dataSource}...`,
    );

    // Prepare wallet
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("PRIVATE_KEY is not defined in environment variables");
    }
    const rpc = "https://evm.cronos.org";
    // const rpc = "https://evm-t3.cronos.org";
    const provider = new ethers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(privateKey, provider);

    // Get paid data
    const url = `http://localhost:8000/api/data-sources/posts?dataSource=${dataSource}`;
    const data = await getPaidData(url, wallet);

    const result = { posts: data.posts };

    return JSON.stringify(result);
  } catch (error) {
    console.error(
      `[Tools] Failed to get data source posts, error: ${getErrorString(
        error,
      )}`,
    );
    return `Failed to get data source posts, error: ${getErrorString(error)}`;
  }
}

export async function executeBuyTrade(outputToken: string): Promise<string> {
  try {
    console.log(`[Tools] Executing buy trade, output token: ${outputToken}...`);

    // Fetch the best trade from VVS Finance SDK
    const chainId = BuiltInChainId.CRONOS_MAINNET;
    const inputToken = "NATIVE";
    const amount = "0.01";
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

    // Execute the trade
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("PRIVATE_KEY is not defined in environment variables");
    }
    const rpc = "https://evm.cronos.org";
    // const rpc = "https://evm-t3.cronos.org";
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
