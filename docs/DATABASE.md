# Database Schema

RavGateway uses PostgreSQL (via Supabase) with Row Level Security (RLS) for data isolation and multi-tenancy.

---

## Database Overview

**Database**: PostgreSQL 15 (Supabase)
**Extensions**: 
- `uuid-ossp` - UUID generation
- `pgcrypto` - Password hashing

---

## Tables Overview

| Table | Purpose | Rows (est.) |
|-------|---------|-------------|
| `profiles` | Merchant accounts | ~100s |
| `products` | Product catalog | ~1000s |
| `invoices` | Invoice records | ~10,000s |
| `transactions` | Payment records | ~10,000s |
| `api_keys` | API authentication | ~100s |

---

## Core Tables

### profiles

Merchant account information and settings.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  merchant_name TEXT NOT NULL,
  email TEXT,
  business_address TEXT,
  wallet_address TEXT,
  default_chain TEXT DEFAULT 'base',
  default_stablecoin TEXT DEFAULT 'usdc',
  theme TEXT DEFAULT 'system',
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Columns:**
- `id` - UUID, primary key (linked to Supabase auth.users)
- `merchant_name` - Business/merchant display name (required)
- `email` - Merchant email address
- `business_address` - Physical business address (optional)
- `wallet_address` - Blockchain wallet for receiving payments
- `default_chain` - Preferred network (base, celo, solana)
- `default_stablecoin` - Preferred token (usdc, cusd)
- `theme` - UI theme preference (system, light, dark)
- `logo_url` - Merchant logo for invoices
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

**Indexes:**
```sql
CREATE INDEX idx_profiles_wallet ON profiles(wallet_address);
CREATE INDEX idx_profiles_email ON profiles(email);
```

---

### products

Product catalog for merchants.

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Columns:**
- `id` - UUID, primary key
- `merchant_id` - Foreign key to profiles (CASCADE delete)
- `name` - Product name (required)
- `description` - Product description
- `price` - Product price in USD (NUMERIC for precision)
- `is_active` - Whether product is available for sale
- `created_at` - Product creation timestamp
- `updated_at` - Last update timestamp

**Indexes:**
```sql
CREATE INDEX idx_products_merchant ON products(merchant_id);
CREATE INDEX idx_products_active ON products(merchant_id, is_active);
```

**RLS Policies:**
```sql
-- Merchants can only see/manage their own products
CREATE POLICY merchant_products ON products
  FOR ALL
  USING (merchant_id = auth.uid());

-- Public can view active products
CREATE POLICY public_view_products ON products
  FOR SELECT
  USING (is_active = true);
```

---

### invoices

Invoice records for crypto payments.

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  description TEXT,
  items JSONB,
  issue_date TIMESTAMP NOT NULL DEFAULT NOW(),
  due_date TIMESTAMP NOT NULL,
  paid_at TIMESTAMP,
  tx_hash TEXT,
  network TEXT,
  last_reminded_at TIMESTAMP,
  reminder_count INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Columns:**
- `id` - UUID, primary key
- `merchant_id` - Foreign key to profiles (CASCADE delete)
- `invoice_number` - Human-readable invoice number (e.g., INV-1704451234567-ABC123XYZ)
- `client_name` - Customer name (required)
- `client_email` - Customer email (required)
- `amount` - Total invoice amount in USD
- `status` - Invoice status: `draft`, `sent`, `viewed`, `paid`, `overdue`
- `description` - Invoice description/notes
- `items` - JSONB array of line items `[{name, price, quantity}]`
- `issue_date` - When invoice was created
- `due_date` - Payment due date
- `paid_at` - When payment was confirmed
- `tx_hash` - Blockchain transaction hash
- `network` - Blockchain network used (base, celo, solana)
- `last_reminded_at` - Last reminder email sent
- `reminder_count` - Number of reminders sent
- `created_at` - Record creation timestamp
- `updated_at` - Last update timestamp

**Invoice Status Flow:**
```
draft → sent → viewed → paid
           ↓
       overdue (if past due_date)
```

**Indexes:**
```sql
CREATE INDEX idx_invoices_merchant ON invoices(merchant_id, created_at DESC);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_client_email ON invoices(client_email);
CREATE INDEX idx_invoices_due_date ON invoices(due_date) WHERE status != 'paid';
```

**RLS Policies:**
```sql
-- Merchants can only see their own invoices
CREATE POLICY merchant_invoices ON invoices
  FOR ALL
  USING (merchant_id = auth.uid());

-- Public can view any invoice (for payment)
CREATE POLICY public_view_invoices ON invoices
  FOR SELECT
  USING (true);
```

---

### transactions

Payment transaction records.

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  transaction_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reference_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Columns:**
- `id` - UUID, primary key
- `merchant_id` - Foreign key to profiles (CASCADE delete)
- `product_id` - Foreign key to products (SET NULL on delete)
- `customer_name` - Customer name
- `amount` - Transaction amount in USD
- `transaction_type` - Type: `product`, `invoice`, `subscription`
- `status` - Status: `pending`, `completed`, `failed`
- `reference_id` - Unique reference number for customer
- `created_at` - Transaction timestamp

**Indexes:**
```sql
CREATE INDEX idx_transactions_merchant ON transactions(merchant_id, created_at DESC);
CREATE INDEX idx_transactions_reference ON transactions(reference_id);
CREATE INDEX idx_transactions_product ON transactions(product_id);
```

**RLS Policies:**
```sql
-- Merchants can only see their own transactions
CREATE POLICY merchant_transactions ON transactions
  FOR ALL
  USING (merchant_id = auth.uid());
```

---

### api_keys

API key management for programmatic access.

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  name TEXT,
  tier TEXT DEFAULT 'starter',
  is_active BOOLEAN DEFAULT true,
  rate_limit INTEGER DEFAULT 1000,
  calls_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id` - UUID, primary key
- `profile_id` - Foreign key to profiles (CASCADE delete)
- `key_prefix` - First 7 chars of API key (e.g., `rav_liv`)
- `key_hash` - Bcrypt hash of full API key
- `name` - User-friendly name for the key
- `tier` - Rate limit tier: `starter`, `growth`, `enterprise`
- `is_active` - Whether key is currently active
- `rate_limit` - Monthly request limit
- `calls_used` - API calls used this month
- `last_used_at` - Last time key was used
- `created_at` - Key creation timestamp
- `updated_at` - Last update timestamp

**API Key Format:**
- Live: `rav_live_` + 32 random chars
- Test: `rav_test_` + 32 random chars

**Rate Limit Tiers:**
| Tier | Monthly Limit |
|------|---------------|
| Starter | 1,000 requests |
| Growth | 10,000 requests |
| Enterprise | 100,000 requests |

**Indexes:**
```sql
CREATE INDEX idx_api_keys_profile ON api_keys(profile_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix) WHERE is_active = true;
```

**RLS Policies:**
```sql
-- Users can only see their own API keys
CREATE POLICY user_api_keys ON api_keys
  FOR ALL
  USING (profile_id = auth.uid());
```

---

## Relationships

```
profiles (1) ──< (many) products
profiles (1) ──< (many) invoices
profiles (1) ──< (many) transactions
profiles (1) ──< (many) api_keys
products (1) ──< (many) transactions
```

**Foreign Key Constraints:**
- `products.merchant_id` → `profiles.id` (CASCADE)
- `invoices.merchant_id` → `profiles.id` (CASCADE)
- `transactions.merchant_id` → `profiles.id` (CASCADE)
- `transactions.product_id` → `products.id` (SET NULL)
- `api_keys.profile_id` → `profiles.id` (CASCADE)

---

## Data Types

### JSONB Examples

**Invoice Items:**
```json
[
  {
    "name": "Web Development",
    "price": 500,
    "quantity": 1
  },
  {
    "name": "Logo Design",
    "price": 150,
    "quantity": 2
  }
]
```

---

## Common Queries

### Get Merchant Dashboard Stats

```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'paid') AS total_paid_invoices,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_invoices,
  COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) AS total_revenue,
  COUNT(DISTINCT client_email) AS unique_customers
FROM invoices
WHERE merchant_id = '...'
  AND created_at >= NOW() - INTERVAL '30 days';
```

### Get Recent Transactions

```sql
SELECT
  t.id,
  t.customer_name,
  t.amount,
  t.transaction_type,
  t.status,
  t.reference_id,
  t.created_at,
  p.name AS product_name
FROM transactions t
LEFT JOIN products p ON t.product_id = p.id
WHERE t.merchant_id = '...'
ORDER BY t.created_at DESC
LIMIT 20;
```

### Check Invoice Status

```sql
SELECT
  id,
  invoice_number,
  client_name,
  amount,
  status,
  due_date,
  paid_at,
  tx_hash
FROM invoices
WHERE id = '...'
  AND (merchant_id = '...' OR TRUE); -- Public can view any invoice
```

### List Active Products

```sql
SELECT
  id,
  name,
  description,
  price,
  created_at
FROM products
WHERE merchant_id = '...'
  AND is_active = true
ORDER BY created_at DESC;
```

---

## Triggers & Functions

### Auto-update `updated_at` timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Security

### Row Level Security (RLS)

All tables have RLS enabled to ensure data isolation:

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
```

### Password Hashing

API keys are hashed using bcrypt before storage:

```typescript
import bcrypt from 'bcrypt';

// Generate API key
const apiKey = `rav_live_${randomString(32)}`;

// Hash for storage
const keyHash = await bcrypt.hash(apiKey, 10);

// Store in database
await supabase.from('api_keys').insert({
  key_prefix: apiKey.substring(0, 7),
  key_hash: keyHash,
  // ...other fields
});
```

---

## Backup & Recovery

- **Automated Backups**: Daily backups via Supabase
- **Point-in-Time Recovery**: Available up to 7 days
- **Retention**: 30 days for production data
- **Storage**: Encrypted at rest

---

## Performance Optimization

### Indexes Created

All foreign keys and frequently queried columns are indexed:
- Merchant relationships (`merchant_id`)
- Invoice status and numbers
- Transaction references
- API key lookups
- Date ranges for filtering

### Query Optimization

```sql
-- Use indexes for date range queries
SELECT * FROM invoices
WHERE merchant_id = '...'
  AND created_at >= '2025-01-01'
  AND created_at < '2025-02-01';

-- Use status index for filtering
SELECT * FROM invoices
WHERE status = 'paid'
ORDER BY paid_at DESC;
```

---

## Data Retention

| Table | Retention Policy |
|-------|------------------|
| profiles | Permanent (until account deletion) |
| products | Permanent (soft delete via `is_active`) |
| invoices | Permanent (for accounting) |
| transactions | Permanent (for records) |
| api_keys | Until revoked/deleted |

---

## Migrations

Database migrations are managed through Supabase CLI:

```bash
# Create new migration
supabase migration new add_column_to_invoices

# Apply migrations
supabase db push
```

---

## Monitoring

### Key Metrics to Track

- Total merchants (profiles)
- Active products per merchant
- Invoice conversion rate (created → paid)
- Average transaction value
- API key usage
- Database size and growth

### Example Monitoring Query

```sql
SELECT
  COUNT(DISTINCT p.id) AS total_merchants,
  COUNT(pr.id) AS total_products,
  COUNT(i.id) AS total_invoices,
  COUNT(i.id) FILTER (WHERE i.status = 'paid') AS paid_invoices,
  SUM(i.amount) FILTER (WHERE i.status = 'paid') AS total_revenue
FROM profiles p
LEFT JOIN products pr ON p.id = pr.merchant_id
LEFT JOIN invoices i ON p.id = i.merchant_id;
```

---

## Support

For database questions:
- **Supabase Dashboard**: https://app.supabase.com
- **Email Support**: support@ravgateway.com
