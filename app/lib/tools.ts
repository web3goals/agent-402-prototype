import { chainConfig } from "@/config/chain";
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
import { botConfig } from "@/config/bot";

export async function getStatus(
  tokenAddresses: string[] = [],
): Promise<string> {
  // Get wallet
  const provider = getProvider();
  const wallet = getWallet(provider);

  // Get address
  const address = wallet.address;

  // Get balance
  const balance = await provider.getBalance(address);

  // Get token balances
  const tokens = [];
  for (const tokenAddress of tokenAddresses) {
    try {
      const contract = new ethers.Contract(
        tokenAddress,
        [
          "function balanceOf(address owner) view returns (uint256)",
          "function decimals() view returns (uint8)",
        ],
        provider,
      );
      const tokenBalance = await contract.balanceOf(address);
      const decimals = await contract.decimals();
      tokens.push({
        address: tokenAddress,
        amount: ethers.formatUnits(tokenBalance, decimals),
      });
    } catch (error) {
      console.warn(
        `[Tools] Failed to get balance for token ${tokenAddress}`,
        error,
      );
    }
  }

  const result = {
    address,
    balance: ethers.formatEther(balance),
    tokens,
  };

  return JSON.stringify(result);
}

export async function getDataSources(): Promise<string> {
  try {
    console.log(`[Tools] Getting data sources...`);
    const url = new URL("/api/data-sources", botConfig.url).toString();
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

    // Get wallet
    const provider = getProvider();
    const wallet = getWallet(provider);

    // Get paid data
    const url = new URL("/api/data-sources/posts", botConfig.url);
    url.searchParams.append("dataSource", dataSource);

    const data = await getPaidData(url.toString(), wallet);

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
    const provider = getProvider();
    const wallet = getWallet(provider);

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
  const result = { enabled: true, style };

  return JSON.stringify(result);
}

export async function disableDemoLamboMode(): Promise<string> {
  const result = { enabled: false };

  return JSON.stringify(result);
}

function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(chainConfig.rpc);
}

function getWallet(provider: ethers.JsonRpcProvider): ethers.Wallet {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY is not defined in environment variables");
  }

  const wallet = new ethers.Wallet(privateKey, provider);

  return wallet;
}
