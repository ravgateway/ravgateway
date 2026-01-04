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

  // Query parameters
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const status = req.query.status as string;

  // Build query
  let query = supabase
    .from('invoices')
    .select('*')
    .eq('merchant_id', auth.profile_id)
    .order('created_at', { ascending: false })
    .limit(limit);

  // Filter by status if provided
  if (status && ['pending', 'paid', 'expired'].includes(status)) {
    query = query.eq('status', status);
  }

  const { data: invoices, error } = await query;

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch invoices' });
  }

  // Return invoices
  return res.status(200).json({
    invoices: invoices.map(inv => ({
      invoice_id: inv.id,
      invoice_number: inv.invoice_number,
      client_name: inv.client_name,
      client_email: inv.client_email,
      amount: inv.amount,
      network: inv.network,
      status: inv.status,
      issue_date: inv.issue_date,
      due_date: inv.due_date,
      paid_at: inv.paid_at,
      created_at: inv.created_at
    })),
    count: invoices.length
  });
}