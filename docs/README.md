# RavGateway Technical Documentation

## Overview

RavGateway is a non-custodial, multi-chain cryptocurrency payment gateway that enables businesses to create professional invoices and accept stablecoin payments across multiple blockchain networks.

**Live Platform:** [ravgateway.com](https://ravgateway.com)

### Key Features

- **Multi-Chain Support**: Base, Celo & Solana
- **Non-Custodial**: Users maintain full control of their funds
- **Professional Invoicing**: Create, manage, and track invoices
- **Product Catalog**: Create products with shareable payment links
- **Real-Time Notifications**: Email receipts and payment confirmations
- **Developer API**: RESTful API for integration
- **Analytics Dashboard**: Transaction tracking and business insights
- **Mobile-First Design**: Fully responsive across all devices

### Use Cases

- E-commerce checkout integration
- Product catalog with payment links
- Freelancer invoice payments
- B2B cryptocurrency settlements
- Subscription billing in stablecoins
- Cross-border payments
- Digital product sales

---

## Table of Contents

1. [Architecture Overview](./ARCHITECTURE.md) - System design, tech stack, data flow
2. [API Documentation](./API.md) - REST API endpoints, authentication, rate limits
3. [Integration Guide](./INTEGRATION.md) - How to integrate RavGateway into your app
4. [Blockchain Details](./BLOCKCHAIN.md) - Multi-chain support (Base, Celo, Solana)
5. [Security Model](./SECURITY.md) - Authentication, RLS policies, non-custodial architecture
6. [Database Schema](./DATABASE.md) - Tables, relationships, queries

---

## Quick Start

### For Merchants

1. Sign up at [ravgateway.com](https://ravgateway.com)
2. Complete profile setup
3. Create your first invoice
4. Share invoice link with customers
5. Receive stablecoin payments directly to your wallet

### For Developers

```bash
# Get API credentials
curl https://api.ravgateway.com/v1/auth/register \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com", "password": "secure_password"}'

# Create an invoice
curl https://api.ravgateway.com/v1/invoices \
  -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "currency": "USDC",
    "network": "base",
    "description": "Service payment"
  }'
```

---

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Blockchain**: Ethers.js v6
- **Deployment**: Vercel

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Email**: Resend
- **API**: RESTful with rate limiting
- **Storage**: Supabase Storage

### Blockchain Integration
- **EVM Chains**: Base, Celo, Lisk (Ethers.js)
- **Solana**: @solana/web3.js
- **Aptos**: Aptos SDK
- **Wallet Support**: MetaMask, WalletConnect, Phantom, Petra

---

## System Requirements

### For Integration
- Node.js 18+ (for SDK usage)
- Web3 wallet for testing
- API credentials from RavGateway

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

---

## Support & Contact

- **Documentation Issues**: Open an issue on GitHub
- **Technical Support**: support@ravgateway.com
- **Business Inquiries**: hello@ravgateway.com
- **API Status**: status.ravgateway.com

---

## License

Proprietary - All rights reserved © 2024-2025 RavGateway

---

## Version History

- **v1.0.0** (Current) - Full production release
  - Multi-chain payment support
  - Invoice management system
  - API with authentication
  - Admin dashboard
  - Email notifications
  - Mobile-responsive design
