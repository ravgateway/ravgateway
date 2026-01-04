import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateApiKey(): { key: string; hash: string; prefix: string } {
  const randomBytes = crypto.randomBytes(24).toString('hex');
  const key = `rav_live_${randomBytes}`;
  
  const hash = crypto
    .createHash('sha256')
    .update(key)
    .digest('hex');
  
  const prefix = key.substring(0, 16);
  
  return { key, hash, prefix };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get auth token from header
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);

  // Verify user with Supabase
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { name, tier = 'starter' } = req.body;

  // Generate API key
  const { key, hash, prefix } = generateApiKey();

  // Determine rate limit
  const rateLimits = {
    starter: 1000,
    growth: 10000,
    enterprise: 100000
  };

  // Save to database
  const { data: apiKey, error } = await supabase
    .from('api_keys')
    .insert({
      profile_id: user.id,
      key_prefix: prefix,
      key_hash: hash,
      name,
      tier,
      rate_limit: rateLimits[tier as keyof typeof rateLimits]
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({
    api_key: key,
    id: apiKey.id,
    prefix,
    name,
    tier,
    rate_limit: apiKey.rate_limit,
    created_at: apiKey.created_at
  });
}