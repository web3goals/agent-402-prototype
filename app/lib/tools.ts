export async function getWeather(location: string): Promise<string> {
  return `The weather in ${location} is sunny.`;
}

export async function getDataSources(): Promise<string> {
  const dataSources = [
    {
      name: "Alice The Trader",
      description: "Expert in cryptocurrency trading and market analysis.",
      type: "TELEGRAM_CHANNEL",
      price: "0.01 USD",
    },
  ];
  return JSON.stringify(dataSources);
}
