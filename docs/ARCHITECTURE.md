# System Architecture

## High-Level Overview

RavGateway follows a modern serverless architecture with clear separation of concerns between frontend, backend, and blockchain layers.

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend Layer                       │
│  (React + TypeScript + Tailwind CSS - Deployed on Vercel)  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS/REST API
                     │
┌────────────────────▼────────────────────────────────────────┐
│                       Backend Layer                          │
│         (Supabase - PostgreSQL + Auth + Storage)            │
│  • Row Level Security (RLS)                                 │
│  • API Rate Limiting                                        │
│  • Email Service (Resend)                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Web3 RPC
                     │
┌────────────────────▼────────────────────────────────────────┐
│                     Blockchain Layer                         │
│       • Base (EVM)    • Celo (EVM)    • Solana             │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 1. Frontend Application

**Technology**: React 18, TypeScript, Vite

**Key Components**:
- **Authentication Module**: User signup, login, session management
- **Dashboard**: Transaction overview, analytics, quick actions
- **Invoice Manager**: Create, edit, view, and track invoices
- **Product Catalog**: Create, manage products with payment links
- **Payment Interface**: Multi-chain payment processing
- **Profile Management**: User settings, wallet configuration
- **Admin Panel**: Merchant management, system analytics

**State Management**:
- React Query (TanStack Query) for server state management
- Context API for global state (auth, theme, notifications)
- Local state for component-specific data
- Supabase real-time subscriptions for live updates

**UI Libraries**:
- Shadcn/ui components
- Tailwind CSS for styling
- Radix UI primitives
- Lucide icons
- React Hook Form for forms
- Sonner & React Hot Toast for notifications

**Routing**:
```
/                         → Landing page
/auth                     → Authentication (login/signup)
/forgot-password          → Password recovery
/reset-password           → Password reset
/dashboard                → Main dashboard
/invoices                 → Invoice list
/invoice/:invoiceId       → Invoice payment page (public)
/invoice-preview/:invoiceId → Invoice preview/edit
/products                 → Product catalog
/pay/:merchantId          → Customer payment page (public)
/success                  → Payment success page
/settings                 → User settings
/apikeys                  → API key management
/api-docs                 → API documentation
/admin                    → Admin dashboard
```

---

### 2. Backend Services

**Infrastructure**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)

#### Database Layer

**PostgreSQL with Row Level Security (RLS)**:
- Multi-tenant data isolation
- Automatic policy enforcement
- Real-time subscriptions
- ACID compliance

**Key Tables**:
- `users` - User accounts and profiles
- `invoices` - Invoice records
- `products` - Product catalog
- `product_purchases` - Product payment records
- `transactions` - Payment transactions
- `api_keys` - Developer API credentials
- `webhooks` - Webhook configurations
- `merchant_settings` - Business configurations

#### Authentication Service

**Supabase Auth**:
- Email/password authentication
- JWT-based sessions
- Password reset flows
- Email verification
- API key generation

**Security Features**:
- Bcrypt password hashing
- Token-based API authentication
- Rate limiting per user/IP
- Session expiration

#### Email Service

**Resend Integration**:
- Transactional emails (receipts, notifications)
- Template-based rendering
- Delivery tracking
- Bounce handling

**Email Types**:
- Invoice created
- Payment received
- Payment confirmation
- Failed transaction alerts
- Weekly summaries

---

### 3. Blockchain Integration Layer

#### EVM Chains (Base, Celo)

**Library**: Ethers.js v6

**Features**:
- Wallet connection (MetaMask, WalletConnect)
- Transaction signing
- Gas estimation
- Contract interaction
- Event listening

**Token Standards**:
- ERC-20 (USDC, USDT, cUSD)
- Native tokens (ETH, CELO)

**Network Configurations**:
```typescript
const networks = {
  base: {
    chainId: 8453,
    rpcUrl: "https://mainnet.base.org",
    blockExplorer: "https://basescan.org",
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 }
  },
  celo: {
    chainId: 42220,
    rpcUrl: "https://forno.celo.org",
    blockExplorer: "https://celoscan.io",
    nativeCurrency: { name: "Celo", symbol: "CELO", decimals: 18 }
  }
}
```

#### Solana

**Library**: @solana/web3.js

**Features**:
- Phantom wallet integration
- SPL token transfers
- Transaction confirmation
- Account monitoring

**Token Standards**:
- SPL tokens (USDC)
- Native SOL

---

## Data Flow

### Invoice Creation Flow

```
1. User creates invoice (frontend)
   │
   ▼
2. POST /api/invoices (authentication checked)
   │
   ▼
3. Validate invoice data (backend)
   │
   ▼
4. Generate unique invoice ID
   │
   ▼
5. Store in database with RLS policies
   │
   ▼
6. Send invoice created email (Resend)
   │
   ▼
7. Return invoice URL to user
```

### Payment Processing Flow

```
1. Customer opens invoice payment page
   │
   ▼
2. Selects network and connects wallet
   │
   ▼
3. Frontend initiates blockchain transaction
   │
   ▼
4. User signs transaction in wallet
   │
   ▼
5. Transaction submitted to blockchain
   │
   ▼
6. Frontend monitors transaction status
   │
   ▼
7. On confirmation:
   │
   ├─▶ Update invoice status (database)
   │
   ├─▶ Send payment receipt email
   │
   ├─▶ Trigger webhooks (if configured)
   │
   └─▶ Update merchant dashboard
```

---

## Scalability Considerations

### Current Architecture
- **Horizontal Scaling**: Vercel edge functions auto-scale
- **Database**: Supabase handles connection pooling
- **Caching**: Browser caching for static assets
- **CDN**: Vercel's global CDN for frontend

### Future Optimizations
- Redis caching for frequently accessed data
- Database read replicas for analytics
- Message queue for webhook processing
- CDN for invoice PDF generation

---

## Monitoring & Observability

### Logging
- Frontend: Browser console + error tracking
- Backend: Supabase logs
- Blockchain: Transaction hash tracking

### Metrics
- API response times
- Transaction success rates
- Payment confirmations
- User activity analytics

### Alerts
- Failed transactions
- API errors
- Database issues
- Email delivery failures

---

## Deployment Pipeline

### Development
```
Local → Git Push → GitHub
```

### Production
```
GitHub → Vercel (Auto Deploy) → Production
                  │
                  ▼
            Run Tests → Deploy
```

### Database Migrations
```
Supabase CLI → Migration Files → Apply to Production
```

---

## Security Architecture

See [SECURITY.md](./SECURITY.md) for detailed security documentation.

**Key Security Layers**:
1. HTTPS/TLS encryption
2. JWT authentication
3. Row Level Security (RLS)
4. API rate limiting
5. Input validation
6. SQL injection prevention
7. XSS protection
8. CSRF tokens
9. Non-custodial architecture (no private key storage)

---

## Performance Benchmarks

| Metric | Target | Current |
|--------|--------|---------|
| Page Load Time | < 2s | ~1.5s |
| API Response | < 500ms | ~200ms |
| Invoice Creation | < 1s | ~800ms |
| Payment Confirmation | < 30s | ~15s (depends on blockchain) |
| Database Query | < 100ms | ~50ms |

---

## Technology Decisions

### Why Supabase?
- PostgreSQL with RLS for multi-tenancy
- Built-in authentication
- Real-time subscriptions
- Generous free tier
- Easy to scale

### Why Ethers.js?
- Comprehensive EVM support
- TypeScript-first
- Active maintenance
- Excellent documentation
- Industry standard

### Why React + TypeScript?
- Component reusability
- Type safety
- Large ecosystem
- Developer experience
- Easy to hire for

### Why Vercel?
- Zero-config deployments
- Edge network
- Preview deployments
- Automatic HTTPS
- Analytics built-in
