// src/lib/sms.js
const axios = require("axios");
const crypto = require("crypto");

export async function sendSMS(phoneNumber, message) {
  try {
    const apiKey = process.env.COOLSMS_API_KEY;
    const secretKey = process.env.COOLSMS_SECRET_KEY;
    const sendNo = process.env.SMS_SEND_NO;

    if (!apiKey || !secretKey || !sendNo) {
      throw new Error(
        "SMS API 설정이 완료되지 않았습니다. 환경변수를 확인해주세요."
      );
    }

    // CoolSMS API v4 형식
    const requestBody = {
      message: {
        to: phoneNumber,
        from: sendNo,
        text: message,
      },
    };

    // HMAC-SHA256 인증 헤더 생성
    const date = new Date().toISOString();
    const salt = crypto.randomBytes(16).toString("hex");
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(date + salt)
      .digest("hex");

    const response = await axios.post(
      "https://api.coolsms.co.kr/messages/v4/send",
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
        },
      }
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error("SMS 전송 실패:", error);

    // 더 자세한 오류 정보 제공
    if (error.response) {
      console.error("응답 데이터:", error.response.data);
      return {
        success: false,
        error: `API 오류 (${error.response.status}): ${JSON.stringify(
          error.response.data
        )}`,
      };
    }

    return { success: false, error: error.message };
  }
}
