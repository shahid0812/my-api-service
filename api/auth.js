import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const { email } = req.body;

  let { data: user } = await supabase.from('users').select('*').eq('email', email).single();

  if (!user) {
    // Generate a simple key if user doesn't exist
    const newKey = 'sk_' + Math.random().toString(36).substring(2, 11);
    const { data: newUser, error } = await supabase.from('users').insert([
      { email, credits: 50, api_key: newKey, last_reset: new Date().toISOString() }
    ]).select().single();
    
    if (error) return res.status(500).json({ error: error.message });
    user = newUser;
  }

  res.status(200).json({ apiKey: user.api_key, credits: user.credits });
  }
      
