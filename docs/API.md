# API Documentation

RavGateway provides a REST API for creating and managing crypto invoices programmatically.

---

## Quick Start

1. **Get your API key** - Visit [ravgateway.com/apikeys](https://ravgateway.com/apikeys) and create a new key
2. **Make your first request** - Use the examples below to create an invoice
3. **Share the payment URL** - Send the generated payment link to your customer

---

## Base URL

```
https://ravgateway.com/api/v1
```

---

## Authentication

All API requests require authentication using your API key in the `X-API-Key` header.

```bash
X-API-Key: rav_live_your_api_key_here
```

### API Key Format

- **Live keys**: `rav_live_...` (for production)
- **Test keys**: `rav_test_...` (for testing)

### Example Request

```bash
curl -X POST https://ravgateway.com/api/v1/invoices/create \
  -H "X-API-Key: rav_live_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

---

## Endpoints

### POST /invoices/create

Create a new invoice and get a payment URL for your customer.

**Endpoint:**
```
POST https://ravgateway.com/api/v1/invoices/create
```

**Request Body:**

```json
{
  "client_name": "John Doe",
  "client_email": "john@example.com",
  "items": [
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
  ],
  "description": "Website redesign project",
  "network": "base",
  "due_days": 7
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `client_email` | string | **Yes** | Customer's email address |
| `items` | array | **Yes** | Array of items with name, price, quantity |
| `client_name` | string | No | Customer's name |
| `description` | string | No | Invoice description |
| `network` | string | No | Blockchain network (base, celo, solana). Default: base |
| `due_days` | number | No | Days until invoice expires. Default: 7 |

**Response:** `201 Created`

```json
{
  "invoice_id": "550e8400-e29b-41d4-a716-446655440000",
  "invoice_number": "INV-1704451234567-ABC123XYZ",
  "payment_url": "https://ravgateway.com/invoice/550e8400-e29b-41d4-a716-446655440000",
  "client_email": "john@example.com",
  "amount": 800,
  "network": "base",
  "status": "sent",
  "created_at": "2026-01-04T12:00:00.000Z"
}
```

**💡 Tip:** Send the `payment_url` to your customer via email or redirect them to complete payment.

---

### GET /invoices/get

Retrieve details and payment status of a specific invoice.

**Endpoint:**
```
GET https://ravgateway.com/api/v1/invoices/get?id=INVOICE_ID
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | **Yes** | The invoice ID |

**Example Request:**

```bash
curl -X GET \
  'https://ravgateway.com/api/v1/invoices/get?id=550e8400-e29b-41d4-a716-446655440000' \
  -H 'X-API-Key: rav_live_your_api_key_here'
```

**Response:** `200 OK`

```json
{
  "invoice_id": "550e8400-e29b-41d4-a716-446655440000",
  "invoice_number": "INV-1704451234567-ABC123XYZ",
  "client_name": "John Doe",
  "client_email": "john@example.com",
  "items": [
    {
      "name": "Web Development",
      "price": 500,
      "quantity": 1
    }
  ],
  "amount": 800,
  "network": "base",
  "status": "paid",
  "payment_url": "https://ravgateway.com/invoice/550e8400-...",
  "tx_hash": "0x1234567890abcdef...",
  "created_at": "2026-01-04T12:00:00.000Z",
  "paid_at": "2026-01-04T13:30:00.000Z",
  "due_date": "2026-01-11T12:00:00.000Z"
}
```

---

### GET /invoices/list

Get a list of all your invoices with optional filtering.

**Endpoint:**
```
GET https://ravgateway.com/api/v1/invoices/list
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Max results (1-100). Default: 50 |
| `status` | string | Filter by status: `draft`, `sent`, `viewed`, `paid`, `overdue` |

**Example Request:**

```bash
curl -X GET \
  'https://ravgateway.com/api/v1/invoices/list?status=paid&limit=20' \
  -H 'X-API-Key: rav_live_your_api_key_here'
```

**Response:** `200 OK`

```json
{
  "invoices": [
    {
      "invoice_id": "550e8400-e29b-41d4-a716-446655440000",
      "invoice_number": "INV-1704451234567-ABC123XYZ",
      "client_email": "john@example.com",
      "amount": 800,
      "network": "base",
      "status": "paid",
      "created_at": "2026-01-04T12:00:00.000Z",
      "paid_at": "2026-01-04T13:30:00.000Z"
    }
  ],
  "total": 1,
  "limit": 20
}
```

---

## Invoice Status

| Status | Description |
|--------|-------------|
| `draft` | Invoice created but not sent |
| `sent` | Invoice sent to customer |
| `viewed` | Customer viewed the invoice |
| `paid` | Payment received and confirmed |
| `overdue` | Invoice past due date without payment |

---

## Supported Networks

| Network | Chain ID | Supported Tokens |
|---------|----------|------------------|
| Base | 8453 | USDC, USDT |
| Celo | 42220 | cUSD, USDC, USDT |
| Solana | mainnet-beta | USDC |

**Default network:** Base

---

## Rate Limits

| Tier | Rate Limit |
|------|-----------|
| Starter | 1,000 requests/month |
| Growth | 10,000 requests/month |
| Enterprise | 100,000 requests/month |

Rate limits reset on the 1st of each month.

**Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1640995200
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `400` | Bad Request - Invalid parameters |
| `401` | Unauthorized - Invalid or missing API key |
| `404` | Not Found - Invoice doesn't exist |
| `429` | Rate Limit Exceeded |
| `500` | Internal Server Error |

**Error Response Format:**

```json
{
  "error": {
    "code": "invalid_request",
    "message": "client_email is required",
    "details": {
      "field": "client_email"
    }
  }
}
```

---

## Code Examples

### Node.js / JavaScript

```javascript
const axios = require('axios');

async function createInvoice() {
  try {
    const response = await axios.post(
      'https://ravgateway.com/api/v1/invoices/create',
      {
        client_name: 'John Doe',
        client_email: 'john@example.com',
        items: [
          { name: 'Web Development', price: 500, quantity: 1 },
          { name: 'Logo Design', price: 150, quantity: 2 }
        ],
        description: 'Website redesign project',
        network: 'base',
        due_days: 7
      },
      {
        headers: {
          'X-API-Key': 'rav_live_your_api_key_here',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Invoice created:', response.data);
    console.log('Payment URL:', response.data.payment_url);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

createInvoice();
```

### Python

```python
import requests

def create_invoice():
    url = "https://ravgateway.com/api/v1/invoices/create"
    
    headers = {
        "X-API-Key": "rav_live_your_api_key_here",
        "Content-Type": "application/json"
    }
    
    payload = {
        "client_name": "John Doe",
        "client_email": "john@example.com",
        "items": [
            {"name": "Web Development", "price": 500, "quantity": 1},
            {"name": "Logo Design", "price": 150, "quantity": 2}
        ],
        "description": "Website redesign project",
        "network": "base",
        "due_days": 7
    }
    
    response = requests.post(url, json=payload, headers=headers)
    
    if response.status_code == 201:
        data = response.json()
        print(f"Invoice created: {data['invoice_id']}")
        print(f"Payment URL: {data['payment_url']}")
    else:
        print(f"Error: {response.status_code}")
        print(response.json())

create_invoice()
```

### PHP

```php
<?php

function createInvoice() {
    $url = "https://ravgateway.com/api/v1/invoices/create";
    
    $data = [
        "client_name" => "John Doe",
        "client_email" => "john@example.com",
        "items" => [
            ["name" => "Web Development", "price" => 500, "quantity" => 1],
            ["name" => "Logo Design", "price" => 150, "quantity" => 2]
        ],
        "description" => "Website redesign project",
        "network" => "base",
        "due_days" => 7
    ];
    
    $options = [
        'http' => [
            'header' => [
                "X-API-Key: rav_live_your_api_key_here",
                "Content-Type: application/json"
            ],
            'method' => 'POST',
            'content' => json_encode($data)
        ]
    ];
    
    $context = stream_context_create($options);
    $response = file_get_contents($url, false, $context);
    
    if ($response !== false) {
        $result = json_decode($response, true);
        echo "Invoice created: " . $result['invoice_id'] . "\n";
        echo "Payment URL: " . $result['payment_url'] . "\n";
    } else {
        echo "Error creating invoice\n";
    }
}

createInvoice();
?>
```

### cURL

```bash
curl -X POST https://ravgateway.com/api/v1/invoices/create \
  -H "X-API-Key: rav_live_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "John Doe",
    "client_email": "john@example.com",
    "items": [
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
    ],
    "description": "Website redesign project",
    "network": "base",
    "due_days": 7
  }'
```

---

## Best Practices

### Security

1. **Never expose your API key** in client-side code
2. **Use environment variables** to store API keys
3. **Rotate keys regularly** for security
4. **Use test keys** during development

### Error Handling

```javascript
try {
  const response = await createInvoice(invoiceData);
  // Handle success
} catch (error) {
  if (error.response?.status === 401) {
    console.error('Invalid API key');
  } else if (error.response?.status === 429) {
    console.error('Rate limit exceeded');
  } else {
    console.error('Error creating invoice:', error.message);
  }
}
```

### Idempotency

To safely retry requests, store the invoice data and check if an invoice was already created:

```javascript
async function createInvoiceIdempotent(invoiceData) {
  // Check if invoice already exists
  const existingInvoice = await checkExistingInvoice(
    invoiceData.client_email,
    invoiceData.amount
  );
  
  if (existingInvoice) {
    return existingInvoice;
  }
  
  // Create new invoice
  return await createInvoice(invoiceData);
}
```

---

## Webhooks (Coming Soon)

Webhook support is planned for future releases. This will allow you to receive real-time notifications when:
- Invoice is viewed
- Payment is received
- Payment is confirmed on blockchain
- Invoice expires

---

## Support

- **API Documentation**: [ravgateway.com/api-docs](https://ravgateway.com/api-docs)
- **Dashboard**: [ravgateway.com/dashboard](https://ravgateway.com/dashboard)
- **API Keys**: [ravgateway.com/apikeys](https://ravgateway.com/apikeys)
- **Email Support**: support@ravgateway.com

---

## Changelog

### v1.0.0 (Current)
- Invoice creation API
- Invoice retrieval
- Invoice listing with filters
- API key authentication
- Rate limiting
- Multi-chain support (Base, Celo, Solana)
