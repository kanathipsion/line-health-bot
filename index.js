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

    // Extract values from message (example: "ค่าน้ำตาล 90 ค่าความดัน 110")
    const sugarMatch = userMessage.match(/ค่าน้ำตาล\s*(\d+)/);
    const pressureMatch = userMessage.match(/ค่าความดัน\s*(\d+)/);

    if (sugarMatch && pressureMatch) {
      const sugarLevel = parseInt(sugarMatch[1]);
      const pressureLevel = parseInt(pressureMatch[1]);

      let replyMessage;
      let healthStatus;

      // Conditions for responses
      if (sugarLevel <= 100 && pressureLevel <= 120) {
        healthStatus = "ปกติ";
        replyMessage = 'ค่าของเติ้นอยู่ในเกณฑ์ปกติ ผ่านๆ! โปรดรักษาสุขภาพให้ดีต่อไปนะครับ';
      } else if (sugarLevel > 100 && pressureLevel <= 120) {
        healthStatus = "น้ำตาลสูง";
        replyMessage = 'ค่าน้ำตาลของเติ้นสูงหว่าปกติจังนิ ออกกำลังกายควบคุมอาหารมั้งได้แล้วตะ ถ้าไม่ดีขึ้นแขบไปหาหมอนะ';
      } else if (sugarLevel <= 100 && pressureLevel > 120) {
        healthStatus = "ความดันสูง";
        replyMessage = 'ค่าความดันของคุณสูงเกินแล้วนิ ควรออกกำลังกายแล้วก็ลดอาหารเค็มมั้งได้แล้ว ถ้ามีอาการผิดปกติควรไปหาหมอนะ';
      } else if (sugarLevel > 100 && pressureLevel > 120) {
        healthStatus = "น้ำตาลและความดันสูง";
        replyMessage = 'ค่าน้ำตาลแล้วก็ค่าความดันของคุณสูงหว่าปกติจังแล้วนิ แนะนำให้ออกกำลังกายมั้งนะเติ้น ควบคุมอาหาร และไปหาหมอเพื่อตรวจสอบเพิ่มเติมกันได้ปลอดภัย';
      } else if (sugarLevel < 70) {
        healthStatus = "น้ำตาลต่ำ";
        replyMessage = 'ค่าน้ำตาลของเติ้นต่ำเกินแล้วนิ และแนะนำให้รับกินอาหารที่มีน้ำตาล ถ้าไม่ดีขึ้นก็แขบไปหาหมอได้แล้ว';
      } else if (pressureLevel < 60) {
        healthStatus = "ความดันต่ำ";
        replyMessage = 'ค่าความดันต่ำ ควรนั่งพักและดื่มน้ำ ถ้าไม่ดีขึ้นควรไปหาหมอได้แล้ว';
      } else {
        healthStatus = "ข้อมูลผิดพลาด";
        replyMessage = 'กรุณาพิมพ์ข้อมูลในรูปแบบ: "ค่าน้ำตาล XX ค่าความดัน YY" (เช่น "ค่าน้ำตาล 90 ค่าความดัน 120")';
      }

      // Prepare data to send to Google Apps Script
      const googleScriptUrl = process.env.GOOGLE_SCRIPT_URL;
      const data = {
        userId: event.source.userId,
        displayName: "unknown", // default in case not available
        sugarLevel,
        pressureLevel,
        healthStatus,
        advice: replyMessage
      };

      // Send data to Google Apps Script
      axios.post(googleScriptUrl, data)
        .then(response => {
          console.log('Data successfully sent to Google Sheet');
        })
        .catch(error => {
          console.error('Error sending data to Google Sheet:', error);
        });

      // Reply to user
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: replyMessage,
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
