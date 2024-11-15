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
    let sugarStatus = 'unknown';
    let pressureStatus = 'unknown';

    if (sugarMatch && pressureMatch) {
      const sugarLevel = parseInt(sugarMatch[1]);
      const pressureLevel = parseInt(pressureMatch[1]);

      // Conditions for responses based on levels
      if (sugarLevel <= 100 && sugarLevel >= 70 && pressureLevel <= 120 && pressureLevel >= 60) {
        replyMessage = `User:${userId}\nค่าน้ำตาลของเติ้นอยู่ในเกณฑ์ปกติ ผ่านๆครับ! โปรดรักษาสุขภาพให้ดีต่อไปนะครับ และ ค่าความดันของเติ้นอยู่ในเกณฑ์ปกติ โปรดรักษาสุขภาพต่อไปนะครับ`;
        sugarStatus = 'ปกติ';
        pressureStatus = 'ปกติ';
      } else if (sugarLevel > 100 && pressureLevel <= 120) {
        replyMessage = `User:${userId}\nค่าน้ำตาลของเติ้นสูงหว่าปกติจังนิ ออกกำลังกายควบคุมอาหารมั้งได้แล้วตะ ถ้าไม่ดีขึ้นแขบไปหาหมอนะ และ ค่าความดันของเติ้นอยู่ในเกณฑ์ปกติ โปรดรักษาสุขภาพต่อไปนะครับ`;
        sugarStatus = 'สูง';
        pressureStatus = 'ปกติ';
      } else if (sugarLevel < 70 && pressureLevel <= 120) {
        replyMessage = `User:${userId}\nค่าน้ำตาลของเติ้นต่ำเกินแล้วนิ และแนะนำให้รับกินอาหารที่มีน้ำตาล ถ้าไม่ดีขึ้นก็แขบไปหาหมอได้แล้ว และ ค่าความดันของเติ้นอยู่ในเกณฑ์ปกติ โปรดรักษาสุขภาพต่อไปนะครับ`;
        sugarStatus = 'ต่ำ';
        pressureStatus = 'ปกติ';
      } else if (sugarLevel <= 100 && pressureLevel > 120) {
        replyMessage = `User:${userId}\nค่าน้ำตาลของเติ้นอยู่ในเกณฑ์ปกติ ผ่านๆครับ! โปรดรักษาสุขภาพให้ดีต่อไปนะครับ และ ค่าความดันของเติ้นสูงเกินแล้วนิ ควรออกกำลังกายแล้วก็ลดอาหารเค็ม ถ้ามีอาการผิดปกติแขบไปหาหมอนะ`;
        sugarStatus = 'ปกติ';
        pressureStatus = 'สูง';
      } else if (sugarLevel <= 100 && pressureLevel < 60) {
        replyMessage = `User:${userId}\nค่าน้ำตาลของเติ้นอยู่ในเกณฑ์ปกติ ผ่านๆครับ! โปรดรักษาสุขภาพให้ดีต่อไปนะครับ และ ค่าความดันต่ำ ควรนั่งพักและดื่มน้ำ ถ้าไม่ดีขึ้นควรไปหาหมอได้แล้วครับ`;
        sugarStatus = 'ปกติ';
        pressureStatus = 'ต่ำ';
      } else if (sugarLevel > 100 && pressureLevel > 120) {
        replyMessage = `User:${userId}\nค่าน้ำตาลของเติ้นสูงหว่าปกติจังนิ ออกกำลังกายควบคุมอาหารมั้งได้แล้วตะ ถ้าไม่ดีขึ้นแขบไปหาหมอนะ และ ค่าความดันของเติ้นสูงเกินแล้วนิ ควรออกกำลังกายแล้วก็ลดอาหารเค็ม ถ้ามีอาการผิดปกติแขบไปหาหมอนะ`;
        sugarStatus = 'สูง';
        pressureStatus = 'สูง';
      } else if (sugarLevel > 100 && pressureLevel < 60) {
        replyMessage = `User:${userId}\nค่าน้ำตาลของเติ้นสูงหว่าปกติจังนิ ออกกำลังกายควบคุมอาหารมั้งได้และตะ ถ้าไม่ดีขึ้นแขบไปหาหมอนะ และ ค่าความดันต่ำ ควรนั่งพักและดื่มน้ำ ถ้าไม่ดีขึ้นแขบไปหาหมอได้แล้ว`;
        sugarStatus = 'สูง';
        pressureStatus = 'ต่ำ';
      } else if (sugarLevel < 70 && pressureLevel > 120) {
        replyMessage = `User:${userId}\nค่าน้ำตาลของเติ้นต่ำเกินแล้วนิ และแนะนำให้รับกินอาหารที่มีน้ำตาล ถ้าไม่ดีขึ้นก็แขบไปหาหมอได้แล้ว และ ค่าความดันของเติ้นสูงเกินแล้วนิ ควรออกกำลังกายแล้วก็ลดอาหารเค็ม ถ้ามีอาการผิดปกติแขบไปหาหมอนะ`;
        sugarStatus = 'ต่ำ';
        pressureStatus = 'สูง';
      }

      // Save data to Google Sheets
      await saveDataToGoogleSheets({
        userId,
        sugarLevel,
        pressureLevel,
        sugarStatus,
        pressureStatus,
        advice: replyMessage,
      });
    } else {
      replyMessage = `User:${userId}\nกรุณาพิมพ์ข้อมูลในรูปแบบ: "ค่าน้ำตาล XX ค่าความดัน YY" (เช่น "ค่าน้ำตาล 90 ค่าความดัน 120")`;
    }

    // Reply to user
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: replyMessage,
    });
  }
  return Promise.resolve(null);
}

// Function to save data to Google Sheets
async function saveDataToGoogleSheets(data) {
  try {
    await axios.post(process.env.GOOGLE_SCRIPT_URL, data);
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
  }
}

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
