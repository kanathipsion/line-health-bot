function handleEvent(event) {
  if (event.type === 'message' && event.message.type === 'text') {
    const userMessage = event.message.text;
    const userId = event.source.userId;  // เก็บ userId ของผู้ใช้

    // Extract values from message
    const sugarMatch = userMessage.match(/ค่าน้ำตาล\s*(\d+)/);
    const pressureMatch = userMessage.match(/ค่าความดัน\s*(\d+)/);

    if (sugarMatch && pressureMatch) {
      const sugarLevel = parseInt(sugarMatch[1]);
      const pressureLevel = parseInt(pressureMatch[1]);
      let replyMessage;

      // Create advice based on values
      if (sugarLevel <= 100 && pressureLevel <= 120) {
        replyMessage = `ค่าของเติ้นอยู่ในเกณฑ์ปกติ ผ่านๆ! โปรดรักษาสุขภาพให้ดีต่อไปนะครับ\n(ผู้ใช้: ${userId})`;
      } else if (sugarLevel > 100 && pressureLevel <= 120) {
        replyMessage = `ค่าน้ำตาลของเติ้นสูงหว่าปกติจังนิ ออกกำลังกายควบคุมอาหารมั้งได้แล้วตะ ถ้าไม่ดีขึ้นแขบไปหาหมอนะ\n(ผู้ใช้: ${userId})`;
      } // เพิ่มเงื่อนไขอื่น ๆ

      // Send response
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: replyMessage,
      });
    } else {
      // Format error message
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: `กรุณาพิมพ์ข้อมูลในรูปแบบ: "ค่าน้ำตาล XX ค่าความดัน YY" (เช่น "ค่าน้ำตาล 90 ค่าความดัน 120")\n(ผู้ใช้: ${userId})`,
      });
    }
  }
  return Promise.resolve(null);
}
