export type DataSource = {
  id: string;
  name: string;
  description: string;
  type: "TELEGRAM_CHANNEL";
  price: string;
};

export type DataSourcePost = { created: string; content: string };
