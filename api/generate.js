export default async function handler(req, res) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const userKey = req.headers['x-api-key'];
  const { text, modelType } = req.body;

  // 2. Simple Key Check (We will automate this later)
  if (userKey !== process.env.MASTER_API_KEY) {
    return res.status(401).json({ error: "Invalid API Key" });
  }

  // 3. Determine which Space to call
  const targetUrl = modelType === 'tts' 
    ? "https://shahid202-kokoro-api.hf.space/generate" 
    : "https://Shahid0812-chatapi.hf.space/chat";

  // 4. Call Hugging Face with your Private Token
  const response = await fetch(targetUrl, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.HF_TOKEN}` 
    },
    body: JSON.stringify({ text })
  });

  const data = await response.json();
  res.status(200).json(data);
      }
