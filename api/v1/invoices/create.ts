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
  
  // Check rate limit
  if (data.calls_used >= data.rate_limit) {
    return null;
  }
  
  // Update usage stats
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-API-Key, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
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

  // Parse request body
  const { customer_email, items, currency = 'USDC', blockchain = 'Base' } = req.body;

  // Validate input
  if (!customer_email || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ 
      error: 'Invalid request. Required: customer_email, items (array)' 
    });
  }

  // Calculate total
  const total = items.reduce((sum: number, item: any) => {
    return sum + (item.price * item.quantity);
  }, 0);

  // Generate invoice ID
  const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Create invoice in database
  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      profile_id: auth.profile_id,
      invoice_number: invoiceNumber,
      customer_email,
      items,
      currency,
      blockchain,
      total_amount: total,
      status: 'pending',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Failed to create invoice' });
  }

  // Return invoice details
  return res.status(201).json({
    invoice_id: invoice.id,
    invoice_number: invoice.invoice_number,
    payment_url: `${process.env.VITE_APP_URL || 'https://ravgateway.vercel.app'}/pay/${invoice.id}`,
    customer_email: invoice.customer_email,
    total_amount: invoice.total_amount,
    currency: invoice.currency,
    blockchain: invoice.blockchain,
    status: invoice.status,
    created_at: invoice.created_at
  });
}