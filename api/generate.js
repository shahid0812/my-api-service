import { createClient } from '@supabase/supabase-client';

// Initializing Supabase
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const { apiKey, text, type } = req.body; // type can be 'tts' or 'chat'

  // 1. Validate User & Credits in Supabase
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('api_key', apiKey)
    .single();

  if (error || !user || user.credits <= 0) {
    return res.status(401).json({ error: 'Invalid API Key or 0 credits remaining.' });
  }

  // 2. Decide which Hugging Face Space to call
  const hfUrl = type === 'tts' 
    ? "https://shahid202-kokoro-api.hf.space/generate" 
    : "https://Shahid0812-chatapi.hf.space/chat";

  try {
    // 3. Subtract 1 credit from Supabase
    await supabase.from('users').update({ credits: user.credits - 1 }).eq('id', user.id);

    // 4. Call Hugging Face
    const hfResponse = await fetch(hfUrl, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ text: text })
    });

    const result = await hfResponse.json();

    // 5. Send result to your customer
    return res.status(200).json({
      success: true,
      data: result,
      credits_left: user.credits - 1
    });

  } catch (err) {
    return res.status(500).json({ error: 'Communication with AI failed.' });
  }
}
