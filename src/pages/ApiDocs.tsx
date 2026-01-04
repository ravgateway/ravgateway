import { Copy } from 'lucide-react';
import { useState } from 'react';

export default function ApiDocs() {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const copyToClipboard = (text: string, endpoint: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(endpoint);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const baseUrl = 'https://ravgateway.com/api/v1';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            RavGateway API Documentation
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Accept crypto payments programmatically with our simple REST API
          </p>
        </div>

        {/* Quick Start */}
        <section className="mb-12 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Quick Start</h2>
          <ol className="space-y-3 text-gray-700 dark:text-gray-300">
            <li>
              <strong className="text-gray-900 dark:text-white">1. Get your API key</strong> - 
              Visit your <a href="/apikeys" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">API Keys page</a> and create a new key
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">2. Make your first request</strong> - 
              Use the examples below to create an invoice
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">3. Share the payment URL</strong> - 
              Send the generated payment link to your customer
            </li>
          </ol>
        </section>

        {/* Authentication */}
        <section className="mb-12 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Authentication</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            All API requests require authentication using your API key in the <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">X-API-Key</code> header.
          </p>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <code className="text-sm text-gray-800 dark:text-gray-200">
              X-API-Key: rav_live_your_api_key_here
            </code>
          </div>
        </section>

        {/* Base URL */}
        <section className="mb-12 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Base URL</h2>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <code className="text-sm text-blue-600 dark:text-blue-400">
              {baseUrl}
            </code>
          </div>
        </section>

        {/* Endpoints */}
        <div className="space-y-8">
          {/* Create Invoice */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-3 py-1 rounded font-semibold text-sm">
                POST
              </span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create Invoice</h3>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Create a new invoice and get a payment URL for your customer.
            </p>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Endpoint</h4>
              <code className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded block">
                POST {baseUrl}/invoices/create
              </code>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Request Body</h4>
              <div className="relative">
                <button
                  onClick={() => copyToClipboard(JSON.stringify({
                    "client_name": "John Doe",
                    "client_email": "john@example.com",
                    "items": [
                      { "name": "Web Development", "price": 500, "quantity": 1 },
                      { "name": "Logo Design", "price": 150, "quantity": 2 }
                    ],
                    "description": "Website redesign project",
                    "network": "base",
                    "due_days": 7
                  }, null, 2), 'create')}
                  className="absolute top-2 right-2 p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white z-10"
                >
                  {copiedEndpoint === 'create' ? '✓' : <Copy size={16} />}
                </button>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`{
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
}`}
                </pre>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Parameters</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Field</th>
                      <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Type</th>
                      <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Required</th>
                      <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 dark:text-gray-400">
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="p-3"><code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">client_email</code></td>
                      <td className="p-3">string</td>
                      <td className="p-3">Yes</td>
                      <td className="p-3">Customer's email address</td>
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="p-3"><code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">items</code></td>
                      <td className="p-3">array</td>
                      <td className="p-3">Yes</td>
                      <td className="p-3">Array of items with name, price, quantity</td>
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="p-3"><code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">client_name</code></td>
                      <td className="p-3">string</td>
                      <td className="p-3">No</td>
                      <td className="p-3">Customer's name</td>
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="p-3"><code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">description</code></td>
                      <td className="p-3">string</td>
                      <td className="p-3">No</td>
                      <td className="p-3">Invoice description</td>
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="p-3"><code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">network</code></td>
                      <td className="p-3">string</td>
                      <td className="p-3">No</td>
                      <td className="p-3">Blockchain (base, celo). Default: base</td>
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="p-3"><code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">due_days</code></td>
                      <td className="p-3">number</td>
                      <td className="p-3">No</td>
                      <td className="p-3">Days until invoice expires. Default: 7</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Example Response</h4>
              <div className="relative">
                <button
                  onClick={() => copyToClipboard(JSON.stringify({
                    "invoice_id": "550e8400-e29b-41d4-a716-446655440000",
                    "invoice_number": "INV-1704451234567-ABC123XYZ",
                    "payment_url": "https://ravgateway.com/pay/550e8400-e29b-41d4-a716-446655440000",
                    "amount": 800,
                    "status": "sent"
                  }, null, 2), 'create-response')}
                  className="absolute top-2 right-2 p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white z-10"
                >
                  {copiedEndpoint === 'create-response' ? '✓' : <Copy size={16} />}
                </button>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "invoice_id": "550e8400-e29b-41d4-a716-446655440000",
  "invoice_number": "INV-1704451234567-ABC123XYZ",
  "payment_url": "https://ravgateway.com/pay/550e8400-...",
  "client_email": "john@example.com",
  "amount": 800,
  "network": "base",
  "status": "sent",
  "created_at": "2026-01-04T12:00:00.000Z"
}`}
                </pre>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>💡 Tip:</strong> Send the <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded text-xs">payment_url</code> to your customer via email or redirect them to complete payment.
              </p>
            </div>
          </section>

          {/* Get Invoice */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-3 py-1 rounded font-semibold text-sm">
                GET
              </span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Get Invoice</h3>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Retrieve details and payment status of a specific invoice.
            </p>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Endpoint</h4>
              <code className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded block">
                GET {baseUrl}/invoices/get?id=INVOICE_ID
              </code>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Example Request</h4>
              <div className="relative">
                <button
                  onClick={() => copyToClipboard(`curl -X GET '${baseUrl}/invoices/get?id=550e8400-e29b-41d4-a716-446655440000' -H 'X-API-Key: rav_live_your_api_key_here'`, 'get')}
                  className="absolute top-2 right-2 p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white z-10"
                >
                  {copiedEndpoint === 'get' ? '✓' : <Copy size={16} />}
                </button>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`curl -X GET \\
  '${baseUrl}/invoices/get?id=550e8400-...' \\
  -H 'X-API-Key: rav_live_your_api_key_here'`}
                </pre>
              </div>
            </div>
          </section>

          {/* List Invoices */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-3 py-1 rounded font-semibold text-sm">
                GET
              </span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">List Invoices</h3>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Get a list of all your invoices with optional filtering.
            </p>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Endpoint</h4>
              <code className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded block">
                GET {baseUrl}/invoices/list
              </code>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Query Parameters</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Parameter</th>
                      <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Type</th>
                      <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 dark:text-gray-400">
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="p-3"><code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">limit</code></td>
                      <td className="p-3">number</td>
                      <td className="p-3">Max results (1-100). Default: 50</td>
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="p-3"><code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">status</code></td>
                      <td className="p-3">string</td>
                      <td className="p-3">Filter: draft, sent, viewed, paid, overdue</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Example Request</h4>
              <div className="relative">
                <button
                  onClick={() => copyToClipboard(`curl -X GET '${baseUrl}/invoices/list?status=paid&limit=20' -H 'X-API-Key: rav_live_your_api_key_here'`, 'list')}
                  className="absolute top-2 right-2 p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white z-10"
                >
                  {copiedEndpoint === 'list' ? '✓' : <Copy size={16} />}
                </button>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`curl -X GET \\
  '${baseUrl}/invoices/list?status=paid&limit=20' \\
  -H 'X-API-Key: rav_live_your_api_key_here'`}
                </pre>
              </div>
            </div>
          </section>
        </div>

        {/* Rate Limits */}
        <section className="mt-12 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Rate Limits</h2>
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded">
              <span className="font-semibold">Starter</span>
              <span>1,000 requests/month</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded">
              <span className="font-semibold">Growth</span>
              <span>10,000 requests/month</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded">
              <span className="font-semibold">Enterprise</span>
              <span>100,000 requests/month</span>
            </div>
          </div>
        </section>

        {/* Errors */}
        <section className="mt-12 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Error Codes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Code</th>
                  <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 dark:text-gray-400">
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="p-3"><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">401</code></td>
                  <td className="p-3">Unauthorized - Invalid or missing API key</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="p-3"><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">404</code></td>
                  <td className="p-3">Not Found - Invoice doesn't exist</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="p-3"><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">429</code></td>
                  <td className="p-3">Rate Limit Exceeded</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="p-3"><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">500</code></td>
                  <td className="p-3">Internal Server Error</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Support */}
        <section className="mt-12 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Need Help?</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Contact us at{' '}
            <a href="mailto:support@ravgateway.com" className="text-blue-600 dark:text-blue-400 hover:underline">
              support@ravgateway.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}