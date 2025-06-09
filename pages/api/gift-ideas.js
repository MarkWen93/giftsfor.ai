export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { prompt, history = [] } = req.body;
    let historyText = '';
    if (history.length > 0) {
      historyText = `Previously suggested gifts: ${history.join(', ')}. Do NOT repeat these.`;
    }
    const betterPrompt = `${prompt}\n${historyText}\nPlease suggest 10 unique, creative, and diverse gift ideas. Each gift should be different from the others, and cover a variety of categories (e.g. tech, experience, handmade, luxury, books, etc). Respond with a JSON array of 10 objects, each with 'title' and 'description'. Do not repeat any gift.`;

    const apiKey = process.env.OPENAI_API_KEY;

    console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a thoughtful gift recommendation assistant."
          },
          {
            role: "user",
            content: betterPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1200
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to generate gift ideas');
    }

    // Parse the GPT response to extract the JSON array
    const content = data.choices[0].message.content;
    let gifts;
    try {
      gifts = JSON.parse(content);
    } catch (e) {
      // If parsing fails, try to extract JSON from the text
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        gifts = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse gift suggestions');
      }
    }

    // 只展示 GPT 返回的内容，不补足重复项
    const finalGifts = Array.isArray(gifts) ? gifts.slice(0, 10) : [];

    res.status(200).json({ gifts: finalGifts });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      message: 'Failed to generate gift ideas',
      error: error.message 
    });
  }
} 