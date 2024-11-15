const express = require('express');
const axios = require('axios');
const { Client, middleware } = require('@line/bot-sdk');

const app = express();

// LINE Bot configurations
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// Initialize LINE SDK client
const client = new Client(config);

// Webhook handling
app.post('/webhook', middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => res.status(500).end());
});

// Function to get user's displayName
async function getUserDisplayName(userId) {
  try {
    const response = await axios.get(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: {
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
    });
    return response.data.displayName;
  } catch (error) {
    console.error('Error fetching displayName:', error);
    return 'unknown';
  }
}

// Function to handle LINE messages
async function handleEvent(event) {
  if (event.type === 'message' && event.message.type === 'text') {
    const userMessage = event.message.text;
    const userId = event.source.userId;

    // ดึง displayName ของผู้ใช้
    const displayName = await getUserDisplayName(userId);

    // ตอบกลับผู้ใช้ด้วยชื่อ
    let replyMessage = `สวัสดีคุณ ${displayName} ข้อความของคุณคือ: ${userMessage}`;

    // Logic for generating a response based on user input can be added here

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: replyMessage,
    });
  }
  return Promise.resolve(null);
}

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
