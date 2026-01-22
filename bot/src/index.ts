import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import express, { Request, Response } from "express";
import { Server } from "http";
import * as cron from "node-cron";
import TelegramBot from "node-telegram-bot-api";
import { getDataSourcePosts, getDataSources } from "./utils/data-source";
import { logger } from "./utils/logger";

const app = express();

const APP_PORT = process.env.PORT || 8000;

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const X402_FACILITATOR_URL = "https://facilitator.cronoslabs.org/v2/x402";
const X402_SELLER_WALLET = "0x4306D7a79265D2cb85Db0c5a55ea5F4f6F73C4B1";
const X402_SELLER_TELEGRAM_CHAT_ID = 67916468;
// const X402_NETWORK = "cronos-testnet";
const X402_NETWORK = "cronos-mainnet";
// const X402_USDCE_CONTRACT = "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0"; // Cronos Testnet
const X402_USDCE_CONTRACT = "0xf951eC28187D9E5Ca673Da8FE6757E6f0Be5F77C"; // Cronos Mainnet
const X402_MAX_AMOUNT_REQUIRED = "1000"; // 0.001 USDC.e (6 decimals)

let server: Server | undefined;
let greetingTask: cron.ScheduledTask | undefined;
let bot: TelegramBot | undefined;

// Middleware
app.use(express.json());

// API endpoint to check server health
app.get("/api/health", (_req: Request, res: Response) => {
  logger.info("[API] Received get request for /api/health");
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// API endpoint to get data sources
app.get("/api/data-sources", async (_req: Request, res: Response) => {
  logger.info("[API] Received get request for /api/data-sources");

  const dataSources = await getDataSources();

  res.status(200).json({ dataSources });
});

// API endpoint to get data source posts with payment verification
app.get("/api/data-sources/posts", async (req: Request, res: Response) => {
  logger.info("[API] Received request for /api/data-sources/posts");

  const dataSource = req.query.dataSource as string;

  const paymentHeader =
    req.headers["X-PAYMENT"] ||
    req.headers["x-payment"] ||
    req.body?.paymentHeader;

  // Step 1: Check if payment is provided
  if (!paymentHeader) {
    return res.status(402).json({
      error: "Payment Required",
      x402Version: 1,
      paymentRequirements: {
        scheme: "exact",
        network: X402_NETWORK,
        payTo: X402_SELLER_WALLET,
        asset: X402_USDCE_CONTRACT,
        description: "Premium API data access",
        mimeType: "application/json",
        maxAmountRequired: X402_MAX_AMOUNT_REQUIRED,
        maxTimeoutSeconds: 300,
      },
    });
  }

  try {
    const requestBody = {
      x402Version: 1,
      paymentHeader: paymentHeader,
      paymentRequirements: {
        scheme: "exact",
        network: X402_NETWORK,
        payTo: X402_SELLER_WALLET,
        asset: X402_USDCE_CONTRACT,
        description: "Premium API data access",
        mimeType: "application/json",
        maxAmountRequired: X402_MAX_AMOUNT_REQUIRED,
        maxTimeoutSeconds: 300,
      },
    };

    // Step 2: Verify payment
    const verifyResponse = await axios.post(
      `${X402_FACILITATOR_URL}/verify`,
      requestBody,
      {
        headers: { "Content-Type": "application/json", "X402-Version": "1" },
      },
    );

    if (!verifyResponse.data.isValid) {
      return res.status(402).json({
        error: "Invalid payment",
        reason: verifyResponse.data.invalidReason,
      });
    }

    // Step 3: Settle payment
    const settleResponse = await axios.post(
      `${X402_FACILITATOR_URL}/settle`,
      requestBody,
      {
        headers: { "Content-Type": "application/json", "X402-Version": "1" },
      },
    );

    // Step 4: Check settlement, notify seller and return content
    if (settleResponse.data.event === "payment.settled") {
      if (bot) {
        const text = `New purchase 💸\n\nhttps://explorer.cronos.org/tx/${settleResponse.data.txHash}`;
        await bot.sendMessage(X402_SELLER_TELEGRAM_CHAT_ID, text);
      }

      const posts = await getDataSourcePosts(dataSource);

      return res.status(200).json({
        posts,
        payment: {
          txHash: settleResponse.data.txHash,
          from: settleResponse.data.from,
          to: settleResponse.data.to,
          value: settleResponse.data.value,
          blockNumber: settleResponse.data.blockNumber,
          timestamp: settleResponse.data.timestamp,
        },
      });
    } else {
      return res.status(402).json({
        error: "Payment settlement failed",
        reason: settleResponse.data.error,
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: "Server error processing payment",
      details: axios.isAxiosError(error)
        ? error.response?.data || error.message
        : error instanceof Error
          ? error.message
          : String(error),
    });
  }
});

async function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      server = app.listen(APP_PORT, () => {
        logger.info(`[Server] Express server is running on port ${APP_PORT}`);
        resolve();
      });

      server.on("error", (error) => {
        logger.error("[Server] Failed to start server, error:", error);
        reject(error);
      });
    } catch (error) {
      logger.error("[Server] Error setting up server, error:", error);
      reject(error);
    }
  });
}

function startCronScheduler(): void {
  logger.info("[Cron] Setting up cron scheduler...");

  // Schedule the greeting task to run every hour
  greetingTask = cron.schedule(
    "0 * * * *",
    async () => {
      try {
        logger.info("[Cron] Hello! This is your scheduled greeting!");
      } catch (error) {
        logger.error("[Cron] Failed to greet, error:", error);
      }
    },
    {
      timezone: "UTC",
    },
  );

  logger.info("[Cron] Cron scheduler setup completed");
}

// @ts-ignore
function startTelegramBot(): void {
  if (!TELEGRAM_BOT_TOKEN) {
    logger.error(
      "[Telegram] TELEGRAM_BOT_TOKEN is not defined in environment variables",
    );
    return;
  }

  logger.info("[Telegram] Starting Telegram bot...");

  bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

  bot.on("message", (msg) => {
    const chat = msg.chat.id;
    const user = msg.from?.username || "Unknown user";
    const text = msg.text || msg.caption || "Undefined text";

    logger.info(
      `[Telegram] New message, chat: ${chat}, user: ${user}, text: ${text.slice(0, 32)}`,
    );

    let response = "👌";
    if (text === "/start") {
      response = `
Hey 👋

Ready to monetize your Telegram channel data with Agent 402?

To get started, please send me the following details:

- Channel link, name, and description
- Price per fetching your posts (in USDC)
- Your Cronos wallet address to receive payments

⚠️ Don't forget to add me as an admin to your channel so I can access the posts!
    `;
    }

    bot?.sendMessage(chat, response);
  });

  // Listen for posts in channels where the bot is an admin
  bot.on("channel_post", (msg) => {
    const channelName = msg.chat.title || "Undefined channel";
    const text = msg.text || msg.caption || "Undefined text";

    logger.info(
      `[Telegram] New post in channel, channel: ${channelName}, text: ${text}`,
    );
  });

  bot.on("polling_error", (error) => {
    logger.error("[Telegram] Polling error, error:", error);
  });

  logger.info("[Telegram] Telegram bot is now polling for channel posts");
}

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`[Shutdown] Received ${signal}, shutting down gracefully...`);

  // Stop accepting new requests
  if (server) {
    server.close((error) => {
      if (error) {
        logger.error("[Shutdown] Error closing server, error:", error);
      } else {
        logger.info("[Shutdown] Express server closed");
      }
    });
  }

  // Stop cron schedulers
  if (greetingTask) {
    greetingTask.stop();
    logger.info("[Shutdown] Greeting task stopped");
  }

  // Stop Telegram bot polling
  if (bot) {
    await bot.stopPolling();
    logger.info("[Shutdown] Telegram bot polling stopped");
  }

  // Force shutdown after 10 seconds if graceful shutdown takes too long
  setTimeout(() => {
    logger.info("[Shutdown] Forcing shutdown after timeout");
    process.exit(0);
  }, 10000);

  // Attempt graceful exit
  process.exit(0);
}

async function startApp(): Promise<void> {
  try {
    logger.info("[App] Starting application...");
    logger.info(`[App] NODE_ENV: ${process.env.NODE_ENV}`);

    // Start Express server
    await startServer();

    // Start cron scheduler
    startCronScheduler();

    // Start Telegram bot
    startTelegramBot();

    logger.info("[App] Application started successfully");

    // Setup graceful shutdown handlers
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  } catch (error) {
    logger.error("[App] Error starting application, error:", error);
    process.exit(1);
  }
}

// Start the application
startApp();
