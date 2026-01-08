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
  const { 
    client_name, 
    client_email, 
    items, 
    description,
    network = 'base',
    due_days = 7 
  } = req.body;

  // Validate input
  if (!client_email || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ 
      error: 'Invalid request. Required: client_email, items (array)' 
    });
  }

  // Calculate total amount
  const amount = items.reduce((sum: number, item: any) => {
    return sum + (item.price * item.quantity);
  }, 0);

  // ✅ CHANGED: Generate invoice number using hash-based RPC
  const { data: invoiceNumber, error: rpcError } = await supabase
    .rpc('generate_invoice_number', { p_merchant_id: auth.profile_id });

  if (rpcError || !invoiceNumber) {
    console.error('Failed to generate invoice number:', rpcError);
    return res.status(500).json({ 
      error: 'Failed to generate invoice number',
      details: rpcError?.message 
    });
  }

  // Calculate dates
  const issueDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + due_days);

  // Create invoice in database
  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      merchant_id: auth.profile_id,
      invoice_number: invoiceNumber,
      client_name: client_name || null,
      client_email,
      items,
      description: description || null,
      amount,
      network,
      status: 'sent',
      issue_date: issueDate.toISOString(),
      due_date: dueDate.toISOString(),
      reminder_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Failed to create invoice', details: error.message });
  }

  // Return invoice details
  return res.status(201).json({
    invoice_id: invoice.id,
    invoice_number: invoice.invoice_number,
    payment_url: `${process.env.VITE_APP_URL || 'https://www.ravgateway.com'}/invoice/${invoice.id}`,
    client_email: invoice.client_email,
    client_name: invoice.client_name,
    amount: invoice.amount,
    network: invoice.network,
    status: invoice.status,
    issue_date: invoice.issue_date,
    due_date: invoice.due_date,
    created_at: invoice.created_at
  });
}