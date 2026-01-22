import { PaymentRequirements } from "@/types/x402";
import axios from "axios";
import { ethers, Wallet } from "ethers";

export async function getPaidData(url: string, wallet: Wallet) {
  // Step 1: Initial request to get paid data (expect 402)
  const initialResponse = await axios.get(url).catch((error) => error.response);

  // Step 2: Check for 402 Payment Required
  if (initialResponse.status !== 402) {
    return initialResponse.data;
  }

  const paymentRequirements: PaymentRequirements =
    initialResponse.data.paymentRequirements;

  // Step 3: Generate payment header (sign EIP-3009 authorization)
  const paymentHeaderBase64 = await createPaymentHeader(
    wallet,
    paymentRequirements,
  );

  // Step 4: Retry request with payment header
  const paidResponse = await axios.get(url, {
    headers: { "X-PAYMENT": paymentHeaderBase64 },
  });

  return paidResponse.data;
}

/**
 * Generates a random 32-byte nonce for EIP-3009 authorization
 */
function generateNonce() {
  return ethers.hexlify(ethers.randomBytes(32));
}

/**
 * Creates a signed payment header for x402 payments
 */
async function createPaymentHeader(
  wallet: Wallet,
  paymentRequirements: PaymentRequirements,
) {
  // Generate unique nonce
  const nonce = generateNonce();

  // Calculate validity window
  const validAfter = 0; // Valid immediately
  const validBefore =
    Math.floor(Date.now() / 1000) + paymentRequirements.maxTimeoutSeconds;

  // Set up EIP-712 domain
  // const domain = {
  //   name: "Bridged USDC (Stargate)",
  //   version: "1",
  //   chainId: "338",
  //   verifyingContract: paymentRequirements.asset,
  // };
  const domain = {
    name: "Bridged USDC (Stargate)",
    version: "2",
    chainId: "25",
    verifyingContract: paymentRequirements.asset,
  };

  // Define EIP-712 typed data structure
  const types = {
    TransferWithAuthorization: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
    ],
  };

  // Create the message to sign
  const message = {
    from: wallet.address,
    to: paymentRequirements.payTo,
    value: paymentRequirements.maxAmountRequired,
    validAfter: validAfter,
    validBefore: validBefore,
    nonce: nonce,
  };

  // Sign using EIP-712
  const signature = await wallet.signTypedData(domain, types, message);

  // Construct payment header
  const paymentHeader = {
    x402Version: 1,
    scheme: paymentRequirements.scheme,
    network: paymentRequirements.network,
    payload: {
      from: wallet.address,
      to: paymentRequirements.payTo,
      value: paymentRequirements.maxAmountRequired,
      validAfter: validAfter,
      validBefore: validBefore,
      nonce: nonce,
      signature: signature,
      asset: paymentRequirements.asset,
    },
  };

  // Base64-encode
  return Buffer.from(JSON.stringify(paymentHeader)).toString("base64");
}
