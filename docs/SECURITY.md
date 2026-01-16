# Security Model

RavGateway prioritizes security at every layer of the platform. This document outlines our comprehensive security architecture.

---

## Core Security Principles

1. **Non-Custodial Architecture**: No private keys or funds ever touch our servers
2. **Defense in Depth**: Multiple layers of security controls
3. **Least Privilege**: Minimal permissions by default (RLS policies)
4. **Zero Trust**: Verify every request and transaction
5. **Transparency**: Open about security practices

---

## Authentication & Authorization

### Supabase Authentication

RavGateway uses Supabase's built-in authentication system.

**Features:**
- Email/password authentication
- JWT-based sessions
- Secure password hashing (bcrypt)
- Email verification
- Password reset flows

**Implementation:**
```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'merchant@example.com',
  password: 'secure_password',
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'merchant@example.com',
  password: 'secure_password',
});

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

### API Key Security

API keys for programmatic access are stored securely.

**Generation:**
```typescript
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

// Generate unique API key
const apiKey = `rav_live_${randomBytes(16).toString('hex')}`;

// Hash before storing
const keyHash = await bcrypt.hash(apiKey, 10);

// Store in database
await supabase.from('api_keys').insert({
  profile_id: userId,
  key_prefix: apiKey.substring(0, 7), // For identification
  key_hash: keyHash, // Never store plaintext
  tier: 'starter',
  rate_limit: 1000,
});

// Return to user ONCE (never shown again)
return apiKey;
```

**Validation:**
```typescript
async function validateApiKey(providedKey: string) {
  // Extract prefix
  const prefix = providedKey.substring(0, 7);
  
  // Find potential keys with this prefix
  const { data: keys } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_prefix', prefix)
    .eq('is_active', true);
  
  // Compare hashes (timing-safe)
  for (const key of keys) {
    const isValid = await bcrypt.compare(providedKey, key.key_hash);
    if (isValid) {
      // Update last used
      await supabase
        .from('api_keys')
        .update({ last_used_at: new Date() })
        .eq('id', key.id);
      
      return key.profile_id;
    }
  }
  
  return null;
}
```

**Best Practices:**
- Keys are hashed with bcrypt before storage
- Only shown once at creation
- Prefix stored for fast lookup
- Never logged or displayed in UI after creation

---

## Row Level Security (RLS)

All tables use PostgreSQL Row Level Security to enforce data isolation.

### Profile Policies

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only access their own profile
CREATE POLICY user_own_profile ON profiles
  FOR ALL
  USING (id = auth.uid());
```

### Product Policies

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Merchants can only manage their own products
CREATE POLICY merchant_own_products ON products
  FOR ALL
  USING (merchant_id = auth.uid());

-- Public can view active products (for payment pages)
CREATE POLICY public_view_products ON products
  FOR SELECT
  USING (is_active = true);
```

### Invoice Policies

```sql
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Merchants can only manage their own invoices
CREATE POLICY merchant_own_invoices ON invoices
  FOR ALL
  USING (merchant_id = auth.uid());

-- Public can view any invoice (for payment)
CREATE POLICY public_view_invoices ON invoices
  FOR SELECT
  USING (true);
```

### Transaction Policies

```sql
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Merchants can only view their own transactions
CREATE POLICY merchant_own_transactions ON transactions
  FOR ALL
  USING (merchant_id = auth.uid());
```

### API Key Policies

```sql
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own API keys
CREATE POLICY user_own_api_keys ON api_keys
  FOR ALL
  USING (profile_id = auth.uid());
```

**Benefits:**
- Enforced at database level (can't bypass with code bugs)
- Works with Supabase client automatically
- Multi-tenant data isolation
- No accidental data leaks

---

## Network Security

### HTTPS/TLS

- **Enforced HTTPS**: All traffic encrypted with TLS 1.3
- **Automatic HTTPS**: Vercel provides automatic SSL certificates
- **No HTTP**: All HTTP requests redirect to HTTPS

**Security Headers:**
```typescript
// Vercel automatically adds these headers
{
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}
```

### Rate Limiting

**API Rate Limits:**
| Tier | Monthly Limit |
|------|---------------|
| Starter | 1,000 requests |
| Growth | 10,000 requests |
| Enterprise | 100,000 requests |

**Implementation:**
```typescript
// Check rate limit before processing request
const { data: apiKey } = await supabase
  .from('api_keys')
  .select('*')
  .eq('id', keyId)
  .single();

if (apiKey.calls_used >= apiKey.rate_limit) {
  return res.status(429).json({
    error: 'Rate limit exceeded',
    limit: apiKey.rate_limit,
    reset_at: getResetDate()
  });
}

// Increment counter
await supabase
  .from('api_keys')
  .update({ 
    calls_used: apiKey.calls_used + 1,
    last_used_at: new Date()
  })
  .eq('id', keyId);
```

---

## Input Validation & Sanitization

### API Request Validation

Using Zod for type-safe validation:

```typescript
import { z } from 'zod';

const CreateInvoiceSchema = z.object({
  client_email: z.string().email('Invalid email'),
  client_name: z.string().min(1).max(100).optional(),
  items: z.array(z.object({
    name: z.string().min(1).max(200),
    price: z.number().positive(),
    quantity: z.number().int().positive().max(1000),
  })).min(1),
  description: z.string().max(500).optional(),
  network: z.enum(['base', 'celo', 'solana']).default('base'),
  due_days: z.number().int().positive().max(365).default(7),
});

// Validate request
try {
  const validated = CreateInvoiceSchema.parse(req.body);
  // Process invoice
} catch (error) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.errors
    });
  }
}
```

### SQL Injection Prevention

Supabase client uses parameterized queries automatically:

```typescript
// ✅ SAFE - Parameterized query
const { data } = await supabase
  .from('invoices')
  .select('*')
  .eq('id', invoiceId); // Automatically escaped

// ❌ DANGEROUS - Never do this (Supabase prevents it anyway)
const query = `SELECT * FROM invoices WHERE id = '${invoiceId}'`;
```

### XSS Protection

```typescript
// Sanitize user input before displaying
import DOMPurify from 'isomorphic-dompurify';

function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: []
  });
}

// Escape for display
function escapeHTML(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

---

## Blockchain Security

### Non-Custodial Architecture

**Benefits:**
- No private keys stored on servers
- Users control their funds
- No central point of failure
- Regulatory compliance (not a custodian)

**How it Works:**
```typescript
// 1. User connects their own wallet (MetaMask, WalletConnect)
const provider = new ethers.BrowserProvider(window.ethereum);
const accounts = await provider.send("eth_requestAccounts", []);

// 2. Transaction is signed by USER's wallet (not our backend)
const signer = await provider.getSigner();
const tx = await tokenContract.transfer(merchantAddress, amount);

// 3. We only store the transaction hash (public info)
await supabase.from('invoices').update({
  tx_hash: tx.hash,
  status: 'paid'
}).eq('id', invoiceId);
```

### Address Validation

Always validate wallet addresses before transactions:

```typescript
function validateAddress(address: string, network: string): boolean {
  // EVM address validation (Base, Celo)
  if (network === 'base' || network === 'celo') {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
  
  // Solana address validation
  if (network === 'solana') {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  }
  
  return false;
}

// Validate before payment
if (!validateAddress(merchantWalletAddress, selectedNetwork)) {
  throw new Error('Invalid merchant wallet address');
}
```

### Transaction Verification

Verify payments on-chain before marking as paid:

```typescript
async function verifyPayment(
  txHash: string,
  expectedRecipient: string,
  expectedAmount: bigint,
  network: string
) {
  const provider = new ethers.JsonRpcProvider(NETWORKS[network].rpcUrl);
  
  // Get transaction receipt
  const receipt = await provider.getTransactionReceipt(txHash);
  
  if (!receipt || receipt.status === 0) {
    throw new Error('Transaction failed');
  }
  
  // Parse Transfer event
  const transferLog = receipt.logs.find(log => 
    log.topics[0] === ethers.id("Transfer(address,address,uint256)")
  );
  
  if (!transferLog) {
    throw new Error('Transfer event not found');
  }
  
  // Verify recipient and amount
  const recipient = ethers.getAddress('0x' + transferLog.topics[2].slice(26));
  const amount = BigInt(transferLog.data);
  
  if (recipient.toLowerCase() !== expectedRecipient.toLowerCase()) {
    throw new Error('Recipient mismatch');
  }
  
  if (amount < expectedAmount) {
    throw new Error('Amount mismatch');
  }
  
  return true;
}
```

### Merchant Wallet Security

Before accepting payment, verify merchant wallet hasn't changed:

```typescript
// Fetch merchant profile
const { data: merchant } = await supabase
  .from('profiles')
  .select('wallet_address')
  .eq('id', merchantId)
  .single();

// Verify wallet address matches what we expect
if (merchant.wallet_address !== expectedWalletAddress) {
  throw new Error('Merchant wallet address has changed - please refresh');
}
```

---

## Data Security

### Encryption at Rest

- **Database**: PostgreSQL with encryption enabled (Supabase)
- **Backups**: Encrypted with AES-256
- **API Keys**: Hashed with bcrypt (not encrypted, hashed)

### Encryption in Transit

- **API Calls**: TLS 1.3
- **Database Connections**: SSL/TLS required
- **Blockchain RPC**: HTTPS only

### Sensitive Data Handling

**Never Stored:**
- ❌ Private keys
- ❌ Seed phrases
- ❌ Plain text passwords
- ❌ Plain text API keys

**Stored Securely:**
- ✅ Password hashes (bcrypt)
- ✅ API key hashes (bcrypt)
- ✅ Public wallet addresses (not sensitive)
- ✅ Transaction hashes (public blockchain data)

---

## Email Security

### Resend Integration

Email notifications are sent via Resend:

```typescript
await supabase.functions.invoke('send-receipt-email', {
  body: {
    customerEmail: 'customer@example.com',
    merchantEmail: 'merchant@example.com',
    // ... payment details
  }
});
```

**Security Measures:**
- SPF/DKIM configured
- TLS for email transmission
- No sensitive data in emails (only payment references)
- Unsubscribe links included

---

## Frontend Security

### Environment Variables

Never expose secrets in frontend:

```typescript
// ✅ SAFE - Backend only
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// ✅ SAFE - Public Supabase anon key (protected by RLS)
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ❌ NEVER - API keys in frontend
const API_KEY = 'rav_live_abc123...'; // BAD!
```

### Content Security Policy

Vercel automatically applies CSP headers:

```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://*.supabase.co;
```

---

## Incident Response

### Security Incident Plan

1. **Detection**: Monitor logs and alerts
2. **Assessment**: Evaluate severity and scope
3. **Containment**: Isolate affected systems
4. **Eradication**: Remove threat
5. **Recovery**: Restore normal operations
6. **Post-Mortem**: Document and improve

### Contact

**Security Issues**: security@ravgateway.com
**Response Time**: Within 24 hours
**Responsible Disclosure**: Encouraged

---

## Compliance & Privacy

### Data Minimization

Only collect what's necessary:
- Merchant: email, name, wallet address
- Customer: email, name (for receipts)
- Transactions: public blockchain data

### Data Retention

| Data Type | Retention |
|-----------|-----------|
| User accounts | Until deletion |
| Invoices | Permanent (accounting) |
| Transactions | Permanent (records) |
| API keys | Until revoked |
| Logs | 30 days |

### User Rights

Users can:
- Export their data
- Delete their account
- Revoke API keys
- Update information

---

## Security Best Practices for Users

### For Merchants

1. **Strong Passwords**: Use unique, complex passwords
2. **Secure Wallet**: Use hardware wallets for large amounts
3. **API Key Security**: Never commit API keys to version control
4. **Monitor Activity**: Check transaction history regularly
5. **Enable 2FA**: (Coming soon)

### For Customers

1. **Verify Merchant**: Check merchant name before paying
2. **Verify Amount**: Confirm payment amount in wallet
3. **Secure Wallet**: Keep wallet software updated
4. **Check Network**: Ensure correct blockchain network
5. **Transaction Receipts**: Save confirmation emails

---

## Security Checklist

### For Production Deployment

- [x] HTTPS enforced
- [x] RLS policies enabled on all tables
- [x] API keys hashed before storage
- [x] Rate limiting implemented
- [x] Input validation on all endpoints
- [x] Environment variables secured
- [x] No secrets in frontend code
- [x] Transaction verification on-chain
- [x] Address validation before payments
- [x] Error messages don't leak sensitive info
- [ ] 2FA (planned)
- [ ] Webhook signature verification (planned)

---

## Reporting Security Issues

**Email**: security@ravgateway.com

**What to Include**:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional)

**Response**:
- Acknowledgment within 24 hours
- Assessment within 3 business days
- Fix timeline provided
- Credit in security advisory (if desired)

We take security seriously and appreciate responsible disclosure.

---

## Security Updates

**Current Version**: 1.0
**Last Security Audit**: January 2025
**Next Audit**: July 2025

Stay updated on security improvements by following our changelog.
