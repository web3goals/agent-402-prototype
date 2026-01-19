import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import { Server } from "http";
import * as cron from "node-cron";
import TelegramBot from "node-telegram-bot-api";
import { logger } from "./utils/logger";

const app = express();
const PORT = process.env.PORT || 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

let server: Server;
let greetingTask: cron.ScheduledTask;
let bot: TelegramBot;

// Middleware
app.use(express.json());

// API endpoint to check server health
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

async function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      server = app.listen(PORT, () => {
        logger.info(`[Server] Express server is running on port ${PORT}`);
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

  // Schedule the greeting task to run every 5 minutes
  greetingTask = cron.schedule(
    "*/5 * * * *",
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

function startTelegramBot(): void {
  if (!TELEGRAM_BOT_TOKEN) {
    logger.error(
      "[Telegram] TELEGRAM_BOT_TOKEN is not defined in environment variables",
    );
    return;
  }

  logger.info("[Telegram] Starting Telegram bot...");

  bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

  // Listen for posts in channels where the bot is an admin
  bot.on("channel_post", (msg) => {
    const channelName = msg.chat.title || "Unknown Channel";
    const text = msg.text || msg.caption || "Unknown text";

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
