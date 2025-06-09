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

    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    console.log('Using OpenAI API for gift suggestions');

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
    // 只有在 API 调用失败时才使用备用系统
    console.log('Falling back to local gift suggestions due to:', error.message);
    const fallbackGifts = generateFallbackGifts(prompt, history);
    return res.status(200).json({ gifts: fallbackGifts });
  }
}

// 备用礼物建议系统
function generateFallbackGifts(prompt, history = []) {
  const giftCategories = {
    tech: [
      { title: "Smart Watch", description: "A stylish smartwatch to track fitness and stay connected" },
      { title: "Wireless Earbuds", description: "High-quality wireless earbuds for music and calls" },
      { title: "Portable Charger", description: "A compact power bank for charging devices on the go" }
    ],
    books: [
      { title: "Bestselling Novel", description: "A captivating fiction book from the current bestseller list" },
      { title: "Self-Development Book", description: "An inspiring book about personal growth and success" },
      { title: "Coffee Table Book", description: "A beautiful photography or art book for display" }
    ],
    experience: [
      { title: "Cooking Class", description: "A fun cooking class to learn new recipes and techniques" },
      { title: "Spa Day", description: "A relaxing spa treatment package for ultimate relaxation" },
      { title: "Concert Tickets", description: "Tickets to see their favorite artist or band live" }
    ],
    wellness: [
      { title: "Yoga Mat Set", description: "A premium yoga mat with accessories for home practice" },
      { title: "Meditation App Subscription", description: "A year subscription to a premium meditation app" },
      { title: "Essential Oils Kit", description: "A collection of therapeutic essential oils and diffuser" }
    ],
    fashion: [
      { title: "Designer Watch", description: "A timeless watch that makes a statement" },
      { title: "Luxury Scarf", description: "A high-quality scarf in a versatile color" },
      { title: "Leather Wallet", description: "A handcrafted leather wallet with personalization" }
    ]
  };

  // 从所有类别中随机选择礼物
  const allGifts = Object.values(giftCategories).flat();
  const shuffled = allGifts.sort(() => 0.5 - Math.random());
  
  // 过滤掉历史记录中的礼物
  const filteredGifts = shuffled.filter(gift => 
    !history.includes(gift.title)
  );

  // 返回10个不重复的礼物建议
  return filteredGifts.slice(0, 10);
} 