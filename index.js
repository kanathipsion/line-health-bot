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
function handleEvent(event) {
  if (event.type === 'message' && event.message.type === 'text') {
    const userMessage = event.message.text;
    const sugarMatch = userMessage.match(/ค่าน้ำตาล\s*(\d+)/);
    const pressureMatch = userMessage.match(/ค่าความดัน\s*(\d+)/);

    if (sugarMatch && pressureMatch) {
      const sugarLevel = parseInt(sugarMatch[1]);
      const pressureLevel = parseInt(pressureMatch[1]);

      let sugarStatus, pressureStatus, recommendation;

      if (sugarLevel < 70) {
        sugarStatus = "ต่ำ";
        recommendation = "ค่าน้ำตาลของเติ้นต่ำเกินแล้วนิ และแนะนำให้รับกินอาหารที่มีน้ำตาล ถ้าไม่ดีขึ้นก็แขบไปหาหมอได้แล้ว";
      } else if (sugarLevel > 100) {
        sugarStatus = "สูง";
        recommendation = "ค่าน้ำตาลของเติ้นสูงหว่าปกติจังนิ ออกกำลังกายควบคุมอาหารมั้งได้และตะ ถ้าไม่ดีขึ้นควรไปหาหมอนะ";
      } else {
        sugarStatus = "ปกติ";
        recommendation = "ค่าน้ำตาลของเติ้นอยู่ในเกณฑ์ปกติ ผ่านๆ! โปรดรักษาสุขภาพให้ดีต่อไปนะครับ";
      }

      if (pressureLevel < 60) {
        pressureStatus = "ต่ำ";
        recommendation += " และ ค่าความดันต่ำ ควรนั่งพักและดื่มน้ำ ถ้าไม่ดีขึ้นควรไปหาหมอได้แล้ว";
      } else if (pressureLevel > 120) {
        pressureStatus = "สูง";
        recommendation += " และ ค่าความดันสูงเกิน ควรออกกำลังกายและลดอาหารเค็ม ถ้ามีอาการผิดปกติควรไปหาหมอนะ";
      } else {
        pressureStatus = "ปกติ";
        recommendation += " และ ค่าความดันปกติ โปรดรักษาสุขภาพต่อไปนะครับ";
      }

      axios.post(process.env.GOOGLE_SCRIPT_URL, {
        userId: event.source.userId,
        sugarLevel,
        pressureLevel,
        sugarStatus,
        pressureStatus,
        recommendation,
      });

      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: recommendation,
      });
    } else {
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
