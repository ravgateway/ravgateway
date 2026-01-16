# Blockchain Integration Details

RavGateway supports multiple blockchain networks for cryptocurrency payments. This document provides technical details about each supported blockchain based on the actual implementation.

---

## Supported Networks

| Network | Type | Chain ID | Native Currency | Stablecoin | Block Time |
|---------|------|----------|-----------------|------------|------------|
| Base | EVM (Layer 2) | 8453 (0x2105) | ETH | USDC | ~2s |
| Celo | EVM | 42220 (0xa4ec) | CELO | cUSD | ~5s |
| Solana | Non-EVM | mainnet-beta | SOL | USDC | ~400ms |

**Note:** Solana support is coming soon (Q1 2026). Currently only Base and Celo are fully operational.

---

## EVM Networks (Base & Celo)

### Technology Stack

- **Library**: Ethers.js v6
- **Wallet Support**: MetaMask, WalletConnect (for mobile wallets)
- **Token Standard**: ERC-20
- **RPC Providers**: Public RPC endpoints

### Network Configurations

#### Base (Ethereum Layer 2)

```typescript
const baseConfig = {
  name: "Base Mainnet",
  chainId: "0x2105", // 8453 in decimal
  rpcUrl: "https://mainnet.base.org",
  explorer: "https://basescan.org",
  stablecoin: {
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
    symbol: "USDC",
    decimals: 6,
  },
};
```

**Supported Tokens:**
- **USDC**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (Primary payment token)
- **USDT**: `0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2` (Alternative)

**Why Base?**
- Low gas fees (Layer 2 on Ethereum)
- Fast confirmation times (~2 seconds)
- Wide USDC adoption
- Backed by Coinbase
- Strong ecosystem

---

#### Celo

```typescript
const celoConfig = {
  name: "Celo Mainnet",
  chainId: "0xa4ec", // 42220 in decimal
  rpcUrl: "https://forno.celo.org",
  explorer: "https://explorer.celo.org",
  stablecoin: {
    address: "0x765DE816845861e75A25fCA122bb6898B8B1282a", // cUSD on Celo
    symbol: "cUSD",
    decimals: 18,
  },
};
```

**Supported Tokens:**
- **cUSD**: `0x765DE816845861e75A25fCA122bb6898B8B1282a` (Primary - Celo Dollar)
- **USDC**: `0xcebA9300f2b948710d2653dD7B07f33A8B32118C` (Alternative)
- **USDT**: `0x617f3112bf5397D0467D315cC709EF968D9ba546` (Alternative)

**Why Celo?**
- Mobile-first blockchain
- Low gas fees (often < $0.01)
- Native stablecoins (cUSD)
- Carbon negative
- Focus on emerging markets

---

### ERC-20 Token Transfer Flow

This is how RavGateway processes payments on EVM chains:

```typescript
import { ethers } from 'ethers';
import EthereumProvider from '@walletconnect/ethereum-provider';

// 1. Connect wallet (MetaMask or WalletConnect)
const provider = new ethers.BrowserProvider(window.ethereum);
const accounts = await provider.send("eth_requestAccounts", []);
const signer = await provider.getSigner();

// 2. Switch to correct network
await provider.send("wallet_switchEthereumChain", [
  { chainId: "0x2105" } // Base
]);

// 3. Create ERC-20 token contract instance
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

const tokenContract = new ethers.Contract(
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
  ERC20_ABI,
  signer
);

// 4. Check user balance
const balance = await tokenContract.balanceOf(accounts[0]);
const balanceFormatted = ethers.formatUnits(balance, 6); // USDC has 6 decimals

if (balance < tokenAmount) {
  throw new Error("Insufficient USDC balance");
}

// 5. Send payment to merchant
const amount = 100; // $100 USD
const tokenAmount = ethers.parseUnits(amount.toString(), 6); // Convert to wei

const tx = await tokenContract.transfer(
  merchantWalletAddress,
  tokenAmount
);

// 6. Wait for confirmation
const receipt = await tx.wait();

if (receipt.status === 1) {
  console.log("Payment successful:", receipt.hash);
  // Update invoice status in database
}
```

---

### Wallet Integration

#### MetaMask (Browser Extension)

```typescript
async function connectMetaMask(network: "base" | "celo") {
  // Check if MetaMask is installed
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask not installed");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  
  // Request account access
  const accounts = await provider.send("eth_requestAccounts", []);
  
  // Switch to selected network
  const networkConfig = NETWORKS[network];
  try {
    await provider.send("wallet_switchEthereumChain", [
      { chainId: networkConfig.chainId }
    ]);
  } catch (switchError: any) {
    // Network not added to MetaMask, add it
    if (switchError.code === 4902) {
      await provider.send("wallet_addEthereumChain", [{
        chainId: networkConfig.chainId,
        chainName: networkConfig.name,
        nativeCurrency: {
          name: networkConfig.stablecoin.symbol,
          symbol: networkConfig.stablecoin.symbol,
          decimals: networkConfig.stablecoin.decimals,
        },
        rpcUrls: [networkConfig.rpcUrl],
        blockExplorerUrls: [networkConfig.explorer],
      }]);
    }
  }

  return accounts[0];
}
```

#### WalletConnect (Mobile Wallets)

```typescript
async function connectWalletConnect(network: "base" | "celo") {
  const networkConfig = NETWORKS[network];
  
  // Initialize WalletConnect provider
  const wcProvider = await EthereumProvider.init({
    projectId: "6f033f2737797ddd7f1907ba4c264474", // WalletConnect Cloud project ID
    chains: [parseInt(networkConfig.chainId, 16)],
    showQrModal: true,
    qrModalOptions: {
      themeMode: "light",
    },
    rpcMap: {
      [parseInt(networkConfig.chainId, 16)]: networkConfig.rpcUrl
    },
  });

  // Enable connection (shows QR code modal)
  await wcProvider.enable();
  
  // Get accounts
  const accounts = await wcProvider.request({ method: "eth_accounts" });
  
  return accounts[0];
}
```

---

### Token Decimal Handling

Different tokens use different decimal places:

```typescript
const TOKEN_DECIMALS = {
  // Base tokens
  'USDC': 6,  // Base USDC uses 6 decimals
  'USDT': 6,  // Base USDT uses 6 decimals
  
  // Celo tokens  
  'cUSD': 18, // Celo Dollar uses 18 decimals
  'CELO': 18, // Native CELO uses 18 decimals
};

// Convert USD amount to token amount
function parseAmount(usdAmount: number, tokenSymbol: string): bigint {
  const decimals = TOKEN_DECIMALS[tokenSymbol];
  return ethers.parseUnits(usdAmount.toString(), decimals);
}

// Example:
// $100 USDC (6 decimals) = 100000000 (100 * 10^6)
// $100 cUSD (18 decimals) = 100000000000000000000 (100 * 10^18)
```

---

### Gas Fee Handling

**Base:**
- Gas paid in ETH
- Typical transfer: ~50,000 gas
- Gas price: ~0.01 gwei
- Cost: < $0.01 per transaction

**Celo:**
- Gas paid in CELO (or fee currency tokens)
- Typical transfer: ~65,000 gas  
- Gas price: ~0.5 gwei
- Cost: < $0.01 per transaction

**Gas Estimation:**

```typescript
// Estimate gas for token transfer
const gasEstimate = await tokenContract.transfer.estimateGas(
  merchantAddress,
  tokenAmount
);

// Get current gas price
const feeData = await provider.getFeeData();
const gasPrice = feeData.gasPrice;

// Calculate total gas cost in native token (ETH/CELO)
const gasCost = gasEstimate * gasPrice;
const gasCostFormatted = ethers.formatEther(gasCost);

console.log(`Estimated gas cost: ${gasCostFormatted} ETH/CELO`);
```

---

### Transaction Verification

After payment, verify the transaction on-chain:

```typescript
async function verifyPayment(
  txHash: string,
  expectedRecipient: string,
  expectedAmount: bigint,
  network: "base" | "celo"
) {
  const networkConfig = NETWORKS[network];
  const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
  
  // Get transaction receipt
  const receipt = await provider.getTransactionReceipt(txHash);
  
  if (!receipt) {
    throw new Error("Transaction not found");
  }
  
  if (receipt.status === 0) {
    throw new Error("Transaction failed");
  }
  
  // Parse Transfer event from logs
  // ERC-20 Transfer event: Transfer(address indexed from, address indexed to, uint256 value)
  const transferTopic = ethers.id("Transfer(address,address,uint256)");
  
  const transferLog = receipt.logs.find(log => 
    log.topics[0] === transferTopic
  );
  
  if (!transferLog) {
    throw new Error("Transfer event not found");
  }
  
  // Decode recipient and amount from log
  const recipient = ethers.getAddress('0x' + transferLog.topics[2].slice(26));
  const amount = BigInt(transferLog.data);
  
  // Verify
  if (recipient.toLowerCase() !== expectedRecipient.toLowerCase()) {
    throw new Error("Recipient mismatch");
  }
  
  if (amount < expectedAmount) {
    throw new Error("Amount mismatch");
  }
  
  return {
    verified: true,
    txHash,
    recipient,
    amount: ethers.formatUnits(amount, networkConfig.stablecoin.decimals),
    blockNumber: receipt.blockNumber,
    confirmations: await provider.getBlockNumber() - receipt.blockNumber,
  };
}
```

---

### Error Handling

Common errors and how to handle them:

```typescript
try {
  const tx = await tokenContract.transfer(merchantAddress, tokenAmount);
  await tx.wait();
} catch (error: any) {
  // User rejected transaction
  if (error.code === "ACTION_REJECTED" || error.code === 4001) {
    console.error("Transaction rejected by user");
  }
  
  // Insufficient gas
  else if (error.code === "INSUFFICIENT_FUNDS") {
    console.error("Insufficient ETH/CELO for gas fees");
  }
  
  // Insufficient token balance
  else if (error.message?.includes("insufficient")) {
    console.error("Insufficient token balance");
  }
  
  // Network issue
  else if (error.code === "NETWORK_ERROR") {
    console.error("Network connection failed");
  }
  
  // Unknown error
  else {
    console.error("Transaction failed:", error.message);
  }
}
```

---

## Solana (Coming Soon)

Solana support is planned for Q1 2026.

### Why Solana?

- Ultra-fast transactions (400ms blocks)
- Very low fees (< $0.001)
- Native USDC support
- Growing DeFi ecosystem
- Popular in Web3 communities

### Planned Implementation

```typescript
// Solana configuration (not yet active)
const solanaConfig = {
  name: "Solana Mainnet",
  chainId: "0x65", // Not used (different architecture)
  rpcUrl: "https://api.mainnet-beta.solana.com",
  explorer: "https://explorer.solana.com",
  stablecoin: {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC on Solana
    symbol: "USDC",
    decimals: 6,
  },
};
```

**Wallet Support:**
- Phantom
- Solflare  
- Backpack

**Coming Soon Message:**
When users try to select Solana, they see:
> "Solana payments launching Q1 2026. For now, please use Base or Celo."

---

## Security Considerations

### Address Validation

Always validate addresses before sending:

```typescript
function validateAddress(address: string, network: "base" | "celo"): boolean {
  // EVM address validation
  if (network === "base" || network === "celo") {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
  return false;
}
```

### Amount Validation

Prevent errors with proper validation:

```typescript
function validateAmount(
  amount: bigint,
  balance: bigint,
  minAmount: bigint = 1n
): boolean {
  if (amount <= 0n) return false;
  if (amount < minAmount) return false;
  if (amount > balance) return false;
  return true;
}
```

### Merchant Wallet Verification

Before payment, verify merchant wallet hasn't changed:

```typescript
// Fetch merchant profile from database
const { data: merchantProfile } = await supabase
  .from("profiles")
  .select("wallet_address")
  .eq("id", merchantId)
  .single();

// Verify it matches what we expect
if (merchantProfile.wallet_address !== expectedWalletAddress) {
  throw new Error("Merchant wallet address has changed - please refresh");
}
```

---

## Block Explorers

View transactions on block explorers:

| Network | Explorer | Transaction URL Format |
|---------|----------|----------------------|
| Base | Basescan | `https://basescan.org/tx/{txHash}` |
| Celo | Celoscan | `https://explorer.celo.org/mainnet/tx/{txHash}` |

Example:
```typescript
const explorerUrl = selectedNetwork === "base" 
  ? `https://basescan.org/tx/${txHash}`
  : `https://explorer.celo.org/mainnet/tx/${txHash}`;

console.log(`View transaction: ${explorerUrl}`);
```

---

## Performance Optimization

### RPC Request Batching

```typescript
// Batch multiple read calls
const [balance, decimals, symbol] = await Promise.all([
  tokenContract.balanceOf(userAddress),
  tokenContract.decimals(),
  tokenContract.symbol(),
]);
```

### Caching Token Metadata

```typescript
// Cache token info to avoid repeated RPC calls
const tokenCache = new Map();

async function getTokenInfo(tokenAddress: string) {
  if (tokenCache.has(tokenAddress)) {
    return tokenCache.get(tokenAddress);
  }
  
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  const [decimals, symbol] = await Promise.all([
    contract.decimals(),
    contract.symbol(),
  ]);
  
  const info = { decimals, symbol };
  tokenCache.set(tokenAddress, info);
  return info;
}
```

---

## Testing

### Testnet Configuration

For development and testing:

```typescript
const testnetNetworks = {
  base: {
    name: "Base Sepolia",
    chainId: "0x14a34", // 84532
    rpcUrl: "https://sepolia.base.org",
    explorer: "https://sepolia.basescan.org",
  },
  celo: {
    name: "Celo Alfajores",
    chainId: "0xaef3", // 44787
    rpcUrl: "https://alfajores-forno.celo-testnet.org",
    explorer: "https://alfajores.celoscan.io",
  },
};
```

### Faucets

Get testnet tokens:
- **Base Sepolia**: https://bridge.base.org
- **Celo Alfajores**: https://faucet.celo.org

---

## Future Enhancements

Planned additions:
- ✅ Base (Live)
- ✅ Celo (Live)
- 🔜 Solana (Q1 2026)
- 🔮 Polygon
- 🔮 Arbitrum
- 🔮 Optimism
- 🔮 Avalanche

---

## Support

For blockchain integration questions:
- **Technical Docs**: [ravgateway.com/api-docs](https://ravgateway.com/api-docs)
- **Email Support**: support@ravgateway.com
