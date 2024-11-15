function handleEvent(event) {
  if (event.type === 'message' && event.message.type === 'text') {
    const userMessage = event.message.text;

    // Extract values from message (example: "ค่าน้ำตาล 90 ค่าความดัน 110")
    const sugarMatch = userMessage.match(/ค่าน้ำตาล\s*(\d+)/);
    const pressureMatch = userMessage.match(/ค่าความดัน\s*(\d+)/);

    if (sugarMatch && pressureMatch) {
      const sugarLevel = parseInt(sugarMatch[1]);
      const pressureLevel = parseInt(pressureMatch[1]);

      let replyMessage = "";
      let healthStatus = "";

      // Check each condition and assign a specific message
      if (sugarLevel <= 100 && pressureLevel <= 120) {
        replyMessage = 'ค่าความดันและค่าน้ำตาลอยู่ในเกณฑ์ปกติ ผ่านๆ! โปรดรักษาสุขภาพให้ดีต่อไปนะครับ';
        healthStatus = 'ปกติ';
      } else if (sugarLevel > 100 && pressureLevel <= 120) {
        replyMessage = 'ค่าน้ำตาลของเติ้นสูงหว่าปกติจังนิ ออกกำลังกายควบคุมอาหารมั้งได้แล้วตะ ถ้าไม่ดีขึ้นควรไปหาหมอนะ';
        healthStatus = 'น้ำตาลสูง';
      } else if (sugarLevel < 70 && pressureLevel <= 120) {
        replyMessage = 'ค่าน้ำตาลของเติ้นต่ำเกินแล้วนิ และแนะนำให้รับกินอาหารที่มีน้ำตาล ถ้าไม่ดีขึ้นก็แขบไปหาหมอได้แล้ว';
        healthStatus = 'น้ำตาลต่ำ';
      } else if (sugarLevel <= 100 && pressureLevel > 120) {
        replyMessage = 'ค่าความดันของเติ้นสูงเกินแล้วนิ ควรออกกำลังกายและลดอาหารเค็ม ถ้ามีอาการผิดปกติควรไปหาหมอนะ';
        healthStatus = 'ความดันสูง';
      } else if (sugarLevel > 100 && pressureLevel > 120) {
        replyMessage = 'ค่าน้ำตาลและค่าความดันของเติ้นสูงเกิน แนะนำให้ออกกำลังกาย ควบคุมอาหาร และไปพบแพทย์เพื่อตรวจเพิ่มเติม';
        healthStatus = 'น้ำตาลและความดันสูง';
      } else if (sugarLevel < 70 && pressureLevel < 60) {
        replyMessage = 'ค่าความดันและค่าน้ำตาลต่ำเกินไป ควรรับอาหารและพักผ่อน ถ้าไม่ดีขึ้นควรไปหาหมอ';
        healthStatus = 'น้ำตาลและความดันต่ำ';
      }

      // Combine User ID and Advice into one message
      const fullReplyMessage = `User ID ของคุณคือ: ${event.source.userId}\nคำแนะนำ: ${replyMessage}`;

      // Send data to Google Sheets
      axios.post(googleScriptUrl, {
        userId: event.source.userId,
        sugarLevel: sugarLevel,
        pressureLevel: pressureLevel,
        healthStatus: healthStatus,
        advice: replyMessage,
        timestamp: new Date().toLocaleString(),
      }).then(() => {
        console.log('Data sent to Google Sheets');
      }).catch(error => {
        console.error('Error sending data to Google Sheets:', error);
      });

      // Reply to user with the combined message
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: fullReplyMessage,
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
