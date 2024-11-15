const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const axios = require('axios');

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
    .then(result => res.json(result))
    .catch(err => res.status(500).end());
});

// Function to handle LINE messages
async function handleEvent(event) {
  if (event.type === 'message' && event.message.type === 'text') {
    const userMessage = event.message.text;

    // Extract values from message
    const sugarMatch = userMessage.match(/ค่าน้ำตาล\s*(\d+)/);
    const pressureMatch = userMessage.match(/ค่าความดัน\s*(\d+)/);

    if (sugarMatch && pressureMatch) {
      const sugarLevel = parseInt(sugarMatch[1]);
      const pressureLevel = parseInt(pressureMatch[1]);

      let replyMessage;
      let sugarStatus = "ปกติ";
      let pressureStatus = "ปกติ";

      // Conditions for responses
      if (sugarLevel < 70) {
        sugarStatus = "ต่ำ";
        replyMessage = 'ค่าน้ำตาลของเติ้นต่ำเกินแล้วนิ และแนะนำให้รับกินอาหารที่มีน้ำตาล ถ้าไม่ดีขึ้นก็แขบไปหาหมอได้แล้ว';
      } else if (sugarLevel > 100) {
        sugarStatus = "สูง";
        replyMessage = 'ค่าน้ำตาลของเติ้นสูงหว่าปกติจังนิ ออกกำลังกายควบคุมอาหารมั้งได้และตะ ถ้าไม่ดีขึ้นควรไปหาหมอนะ';
      }

      if (pressureLevel < 60) {
        pressureStatus = "ต่ำ";
        replyMessage = replyMessage ? `${replyMessage} และ ค่าความดันต่ำ ควรนั่งพักและดื่มน้ำ ถ้าไม่ดีขึ้นควรไปหาหมอได้แล้ว` : 'ค่าความดันต่ำ ควรนั่งพักและดื่มน้ำ ถ้าไม่ดีขึ้นควรไปหาหมอได้แล้ว';
      } else if (pressureLevel > 120) {
        pressureStatus = "สูง";
        replyMessage = replyMessage ? `${replyMessage} และ ค่าความดันสูงเกิน ควรออกกำลังกายแล้วก็ลดอาหารเค็ม ถ้ามีอาการผิดปกติควรไปหาหมอนะ` : 'ค่าความดันสูงเกิน ควรออกกำลังกายแล้วก็ลดอาหารเค็ม ถ้ามีอาการผิดปกติควรไปหาหมอนะ';
      }

      replyMessage = replyMessage || 'ค่าน้ำตาลและความดันของเติ้นอยู่ในเกณฑ์ปกติ ผ่านๆ! โปรดรักษาสุขภาพให้ดีต่อไปนะครับ';

      // Send data to Google Sheet
      try {
        await axios.post(process.env.GOOGLE_SCRIPT_URL, {
          userId: event.source.userId,
          sugarLevel: sugarLevel,
          pressureLevel: pressureLevel,
          sugarStatus: sugarStatus,
          pressureStatus: pressureStatus,
          advice: replyMessage
        });
      } catch (error) {
        console.error('Error sending data to Google Sheet:', error);
      }

      // Reply to user
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: `User:${event.source.userId}\n${replyMessage}`
      });
    } else {
      // Message format error
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'กรุณาพิมพ์ข้อมูลในรูปแบบ: "ค่าน้ำตาล XX ค่าความดัน YY" (เช่น "ค่าน้ำตาล 90 ค่าความดัน 120")',
      });
    }
  }
  return Promise.resolve(null);
}

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
