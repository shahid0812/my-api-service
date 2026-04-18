import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const DAILY_FREE_LIMIT = 50; 

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  
  const { apiKey, text, type } = req.body;

  // 1. Get User from Supabase
  let { data: user, error } = await supabase.from('users').select('*').eq('api_key', apiKey).single();
  if (error || !user) return res.status(401).json({ error: "Invalid API Key" });

  // 2. 24-Hour Cycle Logic
  const now = new Date();
  const lastReset = new Date(user.last_reset);
  const hoursSinceReset = (now - lastReset) / (1000 * 60 * 60);

  if (hoursSinceReset >= 24) {
    // Refill to free limit and update the reset timestamp
    await supabase.from('users').update({ 
      credits: Math.max(user.credits, DAILY_FREE_LIMIT), 
      last_reset: now.toISOString() 
    }).eq('id', user.id);
    user.credits = Math.max(user.credits, DAILY_FREE_LIMIT);
  }

  // 3. Check Credits
  if (user.credits <= 0) {
    return res.status(403).json({ error: "Daily limit reached. Contact Shahid for more!" });
  }

  // 4. Call Hugging Face
  const hfUrl = type === 'tts' 
    ? "https://shahid202-kokoro-api.hf.space/generate" 
    : "https://Shahid0812-chatapi.hf.space/chat";

  try {
    await supabase.from('users').update({ credits: user.credits - 1 }).eq('id', user.id);
    
    const hfResponse = await fetch(hfUrl, {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.HF_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const result = await hfResponse.json();
    res.status(200).json({ success: true, data: result, credits_left: user.credits - 1 });
  } catch (err) {
    res.status(500).json({ error: "AI Space is sleeping or busy." });
  }
}
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
