![Hero](/hero.png)

# 🤵 Agent 402

Drive your Lambo while Agent 402 extracts alpha and trades the market.

## ⚡ About

Agent 402 is an AI agent for Cronos that utilizes the x402 protocol to execute trades powered by private Telegram channels and other premium data sources.

## 💡 Motivation

There are thousands of Telegram channels providing paid crypto analytics.

Conversely, there are even more users paying for this information, trying to find trading insights across hundreds of posts every day.

This situation is a great opportunity for an agent to emerge that can help both sides.

## 🔗 Artifacts

- App - https://agent-402-beta.vercel.app/
- Bot - https://t.me/agent_402_bot

## ⚙️ How it works

### Telegram Channel Author

1. **Onboarding**: The author starts the bot and submits their channel details (link, username, description), sets a price per post fetch in USDC, and provides a Cronos wallet address for payments.

2. **Integration**: The author adds the bot to their channel.

3. **Monetization**: When the author publishes a post, the bot saves it and makes it available for purchase via x402.

4. **Earnings**: The bot notifies the author whenever their posts are purchased.

### Agent User

1. **Discovery**: The user opens the app and chats with the agent to view available data sources, including channel details and pricing.

2. **Trading Insights**: The agent fetches paid posts using x402, analyzes them, and generates trading ideas.

3. **Execution**: The user approves a trade based on the idea, and the agent executes the swap via VVS Finance.

4. **Portfolio Management**: The user can view the agent's address, balance, token holdings, and trade history.

5. **Lambo Mode**: The user can enable "Lambo Mode" to let the agent automatically fetch posts, analyze markets, and execute buy/sell decisions autonomously.

## 🛠️ Technologies

1. Cronos Mainnet is used to process all payments and trades.

2. Cronos x402 Facilitator is used to enable the agent to pay for premium data seamlessly.

3. VVS Finance is used as our primary exchange for executing trades.

4. LangChain is used to build and orchestrate the agent's logic.

5. OpenRouter is used as our provider of large language models.

## 📋 Plans

1. Enhance Lambo mode, improve data source management, and refine our trading analytics for public release.

2. Move into beta testing, partnering with Telegram channels and their audiences.

3. Expand our ecosystem by connecting more premium data sources and integrating additional exchanges.

4. All of this leads to our final goal: the full public release.
