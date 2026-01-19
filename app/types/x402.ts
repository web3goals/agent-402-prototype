export type PaymentRequirements = {
  scheme: string;
  network: string;
  payTo: string;
  asset: string;
  description: string;
  mimeType: string;
  maxAmountRequired: string;
  maxTimeoutSeconds: number;
};
