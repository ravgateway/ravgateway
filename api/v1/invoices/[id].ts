import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function hashApiKey(key: string): string {
  return crypto
    .createHash('sha256')
    .update(key)
    .digest('hex');
}

async function validateApiKey(key: string) {
  const keyHash = hashApiKey(key);
  
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, profile_id, tier, rate_limit, calls_used, is_active')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  if (data.calls_used >= data.rate_limit) {
    return null;
  }
  
  await supabase
    .from('api_keys')
    .update({ 
      calls_used: data.calls_used + 1,
      last_used_at: new Date().toISOString()
    })
    .eq('id', data.id);
  
  return data;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-API-Key, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate API key
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required in X-API-Key header' });
  }

  const auth = await validateApiKey(apiKey);
  if (!auth) {
    return res.status(401).json({ error: 'Invalid or rate-limited API key' });
  }

  // Get invoice ID from URL
  const invoiceId = req.query.id as string;

  // Fetch invoice
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('merchant_id', auth.profile_id) // Ensure user owns this invoice
    .single();

  if (error || !invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  // Return invoice details
  return res.status(200).json({
    invoice_id: invoice.id,
    invoice_number: invoice.invoice_number,
    client_name: invoice.client_name,
    client_email: invoice.client_email,
    items: invoice.items,
    description: invoice.description,
    amount: invoice.amount,
    network: invoice.network,
    status: invoice.status,
    payment_url: `${process.env.VITE_APP_URL || 'https://ravgateway.vercel.app'}/pay/${invoice.id}`,
    tx_hash: invoice.tx_hash,
    issue_date: invoice.issue_date,
    due_date: invoice.due_date,
    paid_at: invoice.paid_at,
    created_at: invoice.created_at
  });
}