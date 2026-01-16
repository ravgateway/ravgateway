# Integration Guide

This guide shows you how to integrate RavGateway into your application to accept cryptocurrency payments.

---

## Prerequisites

- A RavGateway account ([sign up here](https://ravgateway.com/auth))
- API key from your [API Keys page](https://ravgateway.com/apikeys)
- Test wallet (MetaMask for Base/Celo)
- Node.js 16+ (for JavaScript examples)

---

## Quick Start (5 minutes)

### 1. Get Your API Key

1. Sign up at [ravgateway.com](https://ravgateway.com)
2. Go to [API Keys page](https://ravgateway.com/apikeys)
3. Click "Generate New Key"
4. Save your API key securely (starts with `rav_live_` or `rav_test_`)

### 2. Create Your First Invoice

```bash
curl -X POST https://ravgateway.com/api/v1/invoices/create \
  -H "X-API-Key: rav_live_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "client_email": "customer@example.com",
    "client_name": "John Doe",
    "items": [
      {
        "name": "Premium Plan",
        "price": 50,
        "quantity": 1
      }
    ],
    "description": "Monthly subscription",
    "network": "base",
    "due_days": 7
  }'
```

**Response:**
```json
{
  "invoice_id": "550e8400-e29b-41d4-a716-446655440000",
  "invoice_number": "INV-1704451234567-ABC123XYZ",
  "payment_url": "https://ravgateway.com/invoice/550e8400-...",
  "client_email": "customer@example.com",
  "amount": 50,
  "network": "base",
  "status": "sent",
  "created_at": "2026-01-16T12:00:00.000Z"
}
```

### 3. Share Payment Link

Send the `payment_url` to your customer:
- Via email
- On your website
- In your app
- Via SMS

---

## Integration Methods

### Method 1: API Integration (Programmatic)

Use the REST API to create invoices programmatically.

**Node.js Example:**

```javascript
const axios = require('axios');

async function createInvoice(customerEmail, items) {
  try {
    const response = await axios.post(
      'https://ravgateway.com/api/v1/invoices/create',
      {
        client_email: customerEmail,
        items: items,
        network: 'base',
        due_days: 7
      },
      {
        headers: {
          'X-API-Key': process.env.RAVGATEWAY_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Invoice created:', response.data.invoice_id);
    console.log('Payment URL:', response.data.payment_url);
    
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
const invoice = await createInvoice('customer@example.com', [
  { name: 'Product A', price: 25, quantity: 2 },
  { name: 'Product B', price: 15, quantity: 1 }
]);
```

**Python Example:**

```python
import requests
import os

def create_invoice(customer_email, items):
    url = "https://ravgateway.com/api/v1/invoices/create"
    
    headers = {
        "X-API-Key": os.environ['RAVGATEWAY_API_KEY'],
        "Content-Type": "application/json"
    }
    
    payload = {
        "client_email": customer_email,
        "items": items,
        "network": "base",
        "due_days": 7
    }
    
    response = requests.post(url, json=payload, headers=headers)
    
    if response.status_code == 201:
        data = response.json()
        print(f"Invoice created: {data['invoice_id']}")
        print(f"Payment URL: {data['payment_url']}")
        return data
    else:
        print(f"Error: {response.status_code}")
        print(response.json())
        raise Exception("Failed to create invoice")

# Usage
invoice = create_invoice("customer@example.com", [
    {"name": "Product A", "price": 25, "quantity": 2},
    {"name": "Product B", "price": 15, "quantity": 1}
])
```

---

### Method 2: Product Payment Links (No Code)

Create products in your dashboard and share direct payment links.

**Steps:**

1. Go to [Products page](https://ravgateway.com/products)
2. Click "Add Product"
3. Fill in product details (name, price, description)
4. Get your payment link: `https://ravgateway.com/pay/{your-merchant-id}?product={product-id}`

**Example:**
```
https://ravgateway.com/pay/550e8400-e29b-41d4-a716-446655440000?product=prod_abc123
```

**Use Cases:**
- Share on social media
- Add to bio links
- Email to customers
- QR codes for physical stores

---

### Method 3: Embedded Payment Button

Add a payment button to your website.

**HTML + JavaScript:**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Buy Product</title>
  <style>
    .crypto-pay-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 30px;
      border: none;
      border-radius: 8px;
      font-size: 18px;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .crypto-pay-btn:hover {
      transform: scale(1.05);
    }
  </style>
</head>
<body>
  <h1>Premium Plan - $50/month</h1>
  <button class="crypto-pay-btn" onclick="payWithCrypto()">
    💳 Pay with Crypto
  </button>

  <script>
    async function payWithCrypto() {
      try {
        // Create invoice via your backend
        const response = await fetch('/api/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product: 'Premium Plan',
            amount: 50,
            customerEmail: 'customer@example.com'
          })
        });

        const data = await response.json();
        
        // Redirect to payment page
        window.location.href = data.payment_url;
      } catch (error) {
        alert('Failed to create payment');
        console.error(error);
      }
    }
  </script>
</body>
</html>
```

**Backend (Express.js):**

```javascript
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

app.post('/api/create-payment', async (req, res) => {
  try {
    const { product, amount, customerEmail } = req.body;

    // Create invoice with RavGateway API
    const response = await axios.post(
      'https://ravgateway.com/api/v1/invoices/create',
      {
        client_email: customerEmail,
        items: [
          { name: product, price: amount, quantity: 1 }
        ],
        network: 'base',
        due_days: 7
      },
      {
        headers: {
          'X-API-Key': process.env.RAVGATEWAY_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      payment_url: response.data.payment_url,
      invoice_id: response.data.invoice_id
    });
  } catch (error) {
    console.error('Payment creation failed:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

---

### Method 4: E-commerce Integration

Full checkout integration example.

**React Component:**

```tsx
import { useState } from 'react';

export function CheckoutButton({ product, amount, customerEmail }: Props) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);

    try {
      // Call your backend to create invoice
      const response = await fetch('/api/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail,
          items: [
            { name: product.name, price: product.price, quantity: 1 }
          ]
        })
      });

      const data = await response.json();

      // Redirect to payment page
      window.location.href = data.payment_url;
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Failed to process checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="crypto-checkout-btn"
    >
      {loading ? 'Processing...' : `Pay $${amount} with Crypto`}
    </button>
  );
}
```

**Backend Handler:**

```javascript
app.post('/api/create-invoice', async (req, res) => {
  const { customerEmail, items } = req.body;

  try {
    const response = await axios.post(
      'https://ravgateway.com/api/v1/invoices/create',
      {
        client_email: customerEmail,
        items: items,
        network: 'base',
        due_days: 7
      },
      {
        headers: {
          'X-API-Key': process.env.RAVGATEWAY_API_KEY
        }
      }
    );

    // Store invoice ID in your database
    await db.orders.create({
      customer_email: customerEmail,
      invoice_id: response.data.invoice_id,
      amount: response.data.amount,
      status: 'pending'
    });

    res.json({
      payment_url: response.data.payment_url,
      invoice_id: response.data.invoice_id
    });
  } catch (error) {
    console.error('Invoice creation failed:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});
```

---

## Checking Payment Status

### Method 1: Polling (Simple)

Poll the API to check if payment is received:

```javascript
async function checkPaymentStatus(invoiceId) {
  const response = await axios.get(
    `https://ravgateway.com/api/v1/invoices/get?id=${invoiceId}`,
    {
      headers: {
        'X-API-Key': process.env.RAVGATEWAY_API_KEY
      }
    }
  );

  return response.data.status; // 'sent', 'viewed', 'paid', 'overdue'
}

// Poll every 5 seconds
const pollInterval = setInterval(async () => {
  const status = await checkPaymentStatus(invoiceId);
  
  if (status === 'paid') {
    console.log('Payment received!');
    clearInterval(pollInterval);
    // Grant access to product/service
  }
}, 5000);
```

### Method 2: Webhooks (Coming Soon)

Webhook support is planned for future releases. You'll be able to receive real-time notifications when:
- Invoice is viewed
- Payment is received  
- Payment is confirmed on blockchain

---

## Network Selection

RavGateway supports multiple networks:

```javascript
// Create invoice on Base (default - recommended)
const baseInvoice = await createInvoice({
  network: 'base', // USDC on Base (fast, cheap)
  // ...other params
});

// Create invoice on Celo
const celoInvoice = await createInvoice({
  network: 'celo', // cUSD on Celo (mobile-friendly)
  // ...other params
});
```

**Network Comparison:**

| Network | Token | Speed | Gas Cost | Best For |
|---------|-------|-------|----------|----------|
| Base | USDC | ~2s | < $0.01 | General use, crypto-native users |
| Celo | cUSD | ~5s | < $0.01 | Mobile payments, emerging markets |
| Solana | USDC | ~400ms | < $0.001 | Coming Q1 2026 |

---

## Testing

### Using Testnet

Switch to testnet for development:

```bash
# Testnet invoice creation (coming soon)
curl -X POST https://ravgateway.com/api/v1/invoices/create \
  -H "X-API-Key: rav_test_your_test_key_here" \
  ...
```

### Test Wallets

Get testnet tokens:
- **Base Sepolia**: https://bridge.base.org
- **Celo Alfajores**: https://faucet.celo.org

---

## Error Handling

Always handle API errors gracefully:

```javascript
async function createInvoiceWithErrorHandling(data) {
  try {
    const response = await axios.post(
      'https://ravgateway.com/api/v1/invoices/create',
      data,
      {
        headers: { 'X-API-Key': process.env.RAVGATEWAY_API_KEY }
      }
    );
    return response.data;
  } catch (error) {
    // Handle specific errors
    if (error.response?.status === 401) {
      console.error('Invalid API key');
    } else if (error.response?.status === 429) {
      console.error('Rate limit exceeded');
    } else if (error.response?.status === 400) {
      console.error('Invalid request:', error.response.data);
    } else {
      console.error('Unexpected error:', error.message);
    }
    throw error;
  }
}
```

---

## Best Practices

### Security

1. **Never expose API keys** in client-side code
2. **Store keys in environment variables**
```bash
# .env
RAVGATEWAY_API_KEY=rav_live_abc123...
```
3. **Use HTTPS only** for API calls
4. **Validate customer email** before creating invoices

### User Experience

1. **Show loading states** while creating invoices
2. **Provide clear error messages** to users
3. **Redirect users** to payment page automatically
4. **Send email notifications** after payment

### Production Checklist

- [ ] API key stored securely in environment variables
- [ ] Error handling implemented
- [ ] Loading states added to UI
- [ ] Test payments work on testnet
- [ ] Customer email validation added
- [ ] Invoice status checking implemented
- [ ] Production API key generated
- [ ] Payment flow tested end-to-end

---

## Example Use Cases

### SaaS Subscription

```javascript
// When user upgrades to premium
async function upgradeToPremium(userId, userEmail) {
  const invoice = await createInvoice({
    client_email: userEmail,
    items: [
      { name: 'Premium Subscription', price: 29, quantity: 1 }
    ],
    description: 'Monthly Premium Plan',
    network: 'base',
    due_days: 3
  });

  // Save invoice to database
  await db.subscriptions.create({
    user_id: userId,
    invoice_id: invoice.invoice_id,
    status: 'pending'
  });

  // Email user the payment link
  await sendEmail(userEmail, {
    subject: 'Complete Your Premium Upgrade',
    payment_url: invoice.payment_url
  });

  return invoice;
}
```

### Digital Product Sale

```javascript
// When customer clicks "Buy Now"
async function sellDigitalProduct(productId, customerEmail) {
  const product = await db.products.findById(productId);

  const invoice = await createInvoice({
    client_email: customerEmail,
    items: [
      { name: product.name, price: product.price, quantity: 1 }
    ],
    description: product.description,
    network: 'base',
    due_days: 1
  });

  // Redirect to payment
  return invoice.payment_url;
}
```

### Service Payment

```javascript
// Freelancer invoicing client
async function invoiceClient(clientEmail, services) {
  const items = services.map(service => ({
    name: service.name,
    price: service.rate,
    quantity: service.hours
  }));

  const invoice = await createInvoice({
    client_email: clientEmail,
    client_name: client.name,
    items: items,
    description: 'Professional Services - January 2026',
    network: 'base',
    due_days: 30
  });

  return invoice;
}
```

---

## Support

- **API Documentation**: [ravgateway.com/api-docs](https://ravgateway.com/api-docs)
- **Dashboard**: [ravgateway.com/dashboard](https://ravgateway.com/dashboard)
- **Email Support**: support@ravgateway.com

---

## Next Steps

1. Create your account at [ravgateway.com](https://ravgateway.com)
2. Generate your API key
3. Test invoice creation with the examples above
4. Integrate into your application
5. Go live and start accepting crypto payments!
