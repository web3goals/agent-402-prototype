export async function getStatus(): Promise<string> {
  const status = {
    address: "0x758190cE14e736A93C88063b5325B72b8e159C51",
    balance: "42",
    tokens: [
      {
        address: "0x2d03bece6747adc00e1a131bba1469c15fd11e03",
        amount: "0.13",
      },
    ],
    buyTrades: [
      {
        executed: new Date().toISOString(),
      },
    ],
  };

  return JSON.stringify(status);
}

export async function getDataSources(): Promise<string> {
  const dataSources: {
    name: string;
    description: string;
    type: string;
    price: string;
  }[] = [
    {
      name: "Alice The Trader",
      description: "Expert in cryptocurrency trading and market analysis.",
      type: "TELEGRAM_CHANNEL",
      price: "0.01 USD",
    },
  ];

  return JSON.stringify(dataSources);
}

export async function getDataSourcePosts(dataSource: string): Promise<string> {
  const dataSourcePosts: { created: string; content: string }[] = [
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

export async function executeBuyTrade(outputToken: string): Promise<string> {
  const trade = {
    inputToken: "NATIVE",
    outputToken: outputToken,
    amount: "0.1",
    tx: "0x7a3db07bb6b0d298a83896b41619dfe12b86233933c35df3e8250b64aa5f22da",
  };

  return JSON.stringify(trade);
}

export async function enableLamboMode(
  style: "CONSERVATIVE" | "AGGRESSIVE",
): Promise<string> {
  const status = { enabled: true, style };

  return JSON.stringify(status);
}

export async function disableLamboMode(): Promise<string> {
  const status = { enabled: false };

  return JSON.stringify(status);
}
