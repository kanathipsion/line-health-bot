function handleEvent(event) {
  if (event.type === 'message' && event.message.type === 'text') {
    const userId = event.source.userId; // Get userId
    const userMessage = event.message.text;

    // Extract values from message (example: "ค่าน้ำตาล 90 ค่าความดัน 110")
    const sugarMatch = userMessage.match(/ค่าน้ำตาล\s*(\d+)/);
    const pressureMatch = userMessage.match(/ค่าความดัน\s*(\d+)/);

    if (sugarMatch && pressureMatch) {
      const sugarLevel = parseInt(sugarMatch[1]);
      const pressureLevel = parseInt(pressureMatch[1]);

      // Begin reply message with user ID on the first line
      let replyMessage = `User:${userId}\n`; // Display userId and newline
      let sugarStatus = '';
      let pressureStatus = '';

      // Determine sugar status
      if (sugarLevel <= 100 && sugarLevel >= 70) {
        sugarStatus = 'ปกติ';
      } else if (sugarLevel > 100) {
        sugarStatus = 'สูง';
      } else if (sugarLevel < 70) {
        sugarStatus = 'ต่ำ';
      }

      // Determine pressure status
      if (pressureLevel <= 120 && pressureLevel >= 60) {
        pressureStatus = 'ปกติ';
      } else if (pressureLevel > 120) {
        pressureStatus = 'สูง';
      } else if (pressureLevel < 60) {
        pressureStatus = 'ต่ำ';
      }

      // Set reply message based on conditions
      if (sugarStatus === 'ปกติ' && pressureStatus === 'ปกติ') {
        replyMessage += 'ค่าน้ำตาลของเติ้นอยู่ในเกณฑ์ปกติ ผ่านๆครับ! โปรดรักษาสุขภาพให้ดีต่อไปนะครับ และ ค่าความดันของเติ้นอยู่ในเกณฑ์ปกติ โปรดรักษาสุขภาพต่อไปนะครับ';
      } else if (sugarStatus === 'สูง' && pressureStatus === 'ปกติ') {
        replyMessage += 'ค่าน้ำตาลของเติ้นสูงหว่าปกติจังนิ ออกกำลังกายควบคุมอาหารมั้งได้แล้วตะ ถ้าไม่ดีขึ้นแขบไปหาหมอนะ และ ค่าความดันของเติ้นอยู่ในเกณฑ์ปกติ โปรดรักษาสุขภาพต่อไปนะครับ';
      } else if (sugarStatus === 'ต่ำ' && pressureStatus === 'ปกติ') {
        replyMessage += 'ค่าน้ำตาลของเติ้นต่ำเกินแล้วนิ และแนะนำให้แขบกินอาหารที่มีน้ำตาล ถ้าไม่ดีขึ้นก็แขบไปหาหมอได้แล้ว และ ค่าความดันของเติ้นอยู่ในเกณฑ์ปกติ โปรดรักษาสุขภาพต่อไปนะครับ';
      } else if (sugarStatus === 'ปกติ' && pressureStatus === 'สูง') {
        replyMessage += 'ค่าของเติ้นอยู่ในเกณฑ์ปกติ ผ่านๆครับ! โปรดรักษาสุขภาพให้ดีต่อไปนะครับ และ ค่าความดันของเติ้นสูงเกินแล้วนิ ควรออกกำลังกายแล้วก็ลดอาหารเค็ม ถ้ามีอาการผิดปกติแขบไปหาหมอนะ';
      } else if (sugarStatus === 'ปกติ' && pressureStatus === 'ต่ำ') {
        replyMessage += 'ค่าน้ำตาลของเติ้นอยู่ในเกณฑ์ปกติ ผ่านๆครับ! โปรดรักษาสุขภาพให้ดีต่อไปนะครับ และ ค่าความดันต่ำ ควรนั่งพักและดื่มน้ำ ถ้าไม่ดีขึ้นควรไปหาหมอได้แล้วครับ';
      } else if (sugarStatus === 'สูง' && pressureStatus === 'สูง') {
        replyMessage += 'ค่าน้ำตาลของเติ้นสูงหว่าปกติจังนิ ออกกำลังกายควบคุมอาหารมั้งได้แล้วตะ ถ้าไม่ดีขึ้นแขบไปหาหมอนะ และ ค่าความดันของเติ้นสูงเกินแล้วนิ ควรออกกำลังกายแล้วก็ลดอาหารเค็ม ถ้ามีอาการผิดปกติแขบไปหาหมอนะ';
      } else if (sugarStatus === 'สูง' && pressureStatus === 'ต่ำ') {
        replyMessage += 'ค่าน้ำตาลของเติ้นสูงหว่าปกติจังนิ ออกกำลังกายควบคุมอาหารมั้งได้และตะ ถ้าไม่ดีขึ้นแขบไปหาหมอนะ และ ค่าความดันต่ำ ควรนั่งพักและดื่มน้ำ ถ้าไม่ดีขึ้นแขบไปหาหมอได้แล้ว';
      } else if (sugarStatus === 'ต่ำ' && pressureStatus === 'สูง') {
        replyMessage += 'ค่าน้ำตาลของเติ้นต่ำเกินแล้วนิ และแนะนำให้รับกินอาหารที่มีน้ำตาล ถ้าไม่ดีขึ้นก็แขบไปหาหมอได้แล้ว และ ค่าความดันของเติ้นสูงเกินแล้วนิ ควรออกกำลังกายแล้วก็ลดอาหารเค็ม ถ้ามีอาการผิดปกติแขบไปหาหมอนะ';
      }

      // Save data to Google Sheets
      axios.post(process.env.GOOGLE_SCRIPT_URL, {
        userId: event.source.userId,
        sugarLevel: sugarLevel,
        pressureLevel: pressureLevel,
        sugarStatus: sugarStatus,
        pressureStatus: pressureStatus,
        advice: replyMessage,
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
