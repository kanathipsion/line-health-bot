const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const axios = require('axios'); // Import axios for HTTP requests

const app = express();

// LINE Bot configurations
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL; // Set this in your Heroku config vars

// Initialize LINE SDK client
const client = new Client(config);

// Route for root URL to confirm server is running
app.get('/', (req, res) => {
  res.send('LINE Bot Server is running!');
});

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
    const userId = event.source.userId;

    // Extract values from message (example: "ค่าน้ำตาล 90 ค่าความดัน 110")
    const sugarMatch = userMessage.match(/ค่าน้ำตาล\s*(\d+)/);
    const pressureMatch = userMessage.match(/ค่าความดัน\s*(\d+)/);

    let replyMessage;
    let sugarStatus = "unknown";
    let pressureStatus = "unknown";
    let recommendation = "unknown";

    if (sugarMatch && pressureMatch) {
      const sugarLevel = parseInt(sugarMatch[1]);
      const pressureLevel = parseInt(pressureMatch[1]);

      // Conditions for responses and status
      if (sugarLevel <= 100 && sugarLevel >= 70 && pressureLevel <= 120 && pressureLevel >= 60) {
        sugarStatus = "ปกติ";
        pressureStatus = "ปกติ";
        recommendation = "ค่าน้ำตาลของเติ้นอยู่ในเกณฑ์ปกติ ผ่านๆครับ! โปรดรักษาสุขภาพให้ดีต่อไปนะครับ และ ค่าความดันของเติ้นอยู่ในเกณฑ์ปกติ โปรดรักษาสุขภาพต่อไปนะครับ";
      } else if (sugarLevel > 100 && pressureLevel <= 120) {
        sugarStatus = "สูง";
        pressureStatus = "ปกติ";
        recommendation = "ค่าน้ำตาลของเติ้นสูงหว่าปกติจังนิ ออกกำลังกายควบคุมอาหารมั้งได้แล้วตะ ถ้าไม่ดีขึ้นแขบไปหาหมอนะ และ ค่าความดันของเติ้นอยู่ในเกณฑ์ปกติ โปรดรักษาสุขภาพต่อไปนะครับ";
      } else if (sugarLevel < 70 && pressureLevel <= 120) {
        sugarStatus = "ต่ำ";
        pressureStatus = "ปกติ";
        recommendation = "ค่าน้ำตาลของเติ้นต่ำเกินแล้วนิ และแนะนำให้รับกินอาหารที่มีน้ำตาล ถ้าไม่ดีขึ้นก็แขบไปหาหมอได้แล้ว และ ค่าความดันของเติ้นอยู่ในเกณฑ์ปกติ โปรดรักษาสุขภาพต่อไปนะครับ";
      } else if (sugarLevel <= 100 && pressureLevel > 120) {
        sugarStatus = "ปกติ";
        pressureStatus = "สูง";
        recommendation = "ค่าของเติ้นอยู่ในเกณฑ์ปกติ ผ่านๆครับ! โปรดรักษาสุขภาพให้ดีต่อไปนะครับ และ ค่าความดันของเติ้นสูงเกินแล้วนิ ควรออกกำลังกายแล้วก็ลดอาหารเค็ม ถ้ามีอาการผิดปกติแขบไปหาหมอนะ";
      } else if (sugarLevel <= 100 && pressureLevel < 60) {
        sugarStatus = "ปกติ";
        pressureStatus = "ต่ำ";
        recommendation = "ค่าน้ำตาลของเติ้นอยู่ในเกณฑ์ปกติ ผ่านๆครับ! โปรดรักษาสุขภาพให้ดีต่อไปนะครับ และ ค่าความดันต่ำ ควรนั่งพักและดื่มน้ำ ถ้าไม่ดีขึ้นควรไปหาหมอได้แล้วครับ";
      } else if (sugarLevel > 100 && pressureLevel > 120) {
        sugarStatus = "สูง";
        pressureStatus = "สูง";
        recommendation = "ค่าน้ำตาลของเติ้นสูงหว่าปกติจังนิ ออกกำลังกายควบคุมอาหารมั้งได้แล้วตะ ถ้าไม่ดีขึ้นแขบไปหาหมอนะ และ ค่าความดันของเติ้นสูงเกินแล้วนิ ควรออกกำลังกายแล้วก็ลดอาหารเค็ม ถ้ามีอาการผิดปกติแขบไปหาหมอนะ";
      } else if (sugarLevel > 100 && pressureLevel < 60) {
        sugarStatus = "สูง";
        pressureStatus = "ต่ำ";
        recommendation = "ค่าน้ำตาลของเติ้นสูงหว่าปกติจังนิ ออกกำลังกายควบคุมอาหารมั้งได้และตะ ถ้าไม่ดีขึ้นแขบไปหาหมอนะ และ ค่าความดันต่ำ ควรนั่งพักและดื่มน้ำ ถ้าไม่ดีขึ้นแขบไปหาหมอได้แล้ว";
      } else if (sugarLevel < 70 && pressureLevel > 120) {
        sugarStatus = "ต่ำ";
        pressureStatus = "สูง";
        recommendation = "ค่าน้ำตาลของเติ้นต่ำเกินแล้วนิ และแนะนำให้รับกินอาหารที่มีน้ำตาล ถ้าไม่ดีขึ้นก็แขบไปหาหมอได้แล้ว และ ค่าความดันของเติ้นสูงเกินแล้วนิ ควรออกกำลังกายแล้วก็ลดอาหารเค็ม ถ้ามีอาการผิดปกติแขบไปหาหมอนะ";
      }

      // Send data to Google Sheet
      await axios.post(GOOGLE_SCRIPT_URL, {
        timestamp: new Date().toLocaleString(),
        userId: userId,
        sugarLevel: sugarLevel,
        pressureLevel: pressureLevel,
        sugarStatus: sugarStatus,
        pressureStatus: pressureStatus,
        recommendation: recommendation,
      });
    } else {
      recommendation = `User:${userId}\nกรุณาพิมพ์ข้อมูลในรูปแบบ: "ค่าน้ำตาล XX ค่าความดัน YY" (เช่น "ค่าน้ำตาล 90 ค่าความดัน 120")`;
    }

    // Reply to user
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: `User:${userId}\n${recommendation}`,
    });
  }
  return Promise.resolve(null);
}

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
