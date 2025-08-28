import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// 네이버 클라우드 플랫폼 SMS API 설정
const NAVER_SMS_API_URL =
  "https://sens.apigw.ntruss.com/sms/v2/services/{serviceId}/messages";
const NAVER_ACCESS_KEY = process.env.NAVER_ACCESS_KEY;
const NAVER_SECRET_KEY = process.env.NAVER_SECRET_KEY;
const NAVER_SERVICE_ID = process.env.NAVER_SERVICE_ID;
const NAVER_SENDER_PHONE = process.env.NAVER_SENDER_PHONE;

interface SendSMSRequest {
  phoneNumber: string;
  message: string;
  customerName?: string;
  senderId?: string;
  senderName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendSMSRequest = await request.json();
    const { phoneNumber, message, customerName, senderId, senderName } = body;

    if (
      !NAVER_ACCESS_KEY ||
      !NAVER_SECRET_KEY ||
      !NAVER_SERVICE_ID ||
      !NAVER_SENDER_PHONE
    ) {
      return NextResponse.json(
        { error: "네이버 클라우드 플랫폼 SMS 설정이 완료되지 않았습니다." },
        { status: 500 }
      );
    }

    // 네이버 클라우드 플랫폼 SMS API 요청 데이터
    const smsRequestData = {
      type: "SMS",
      contentType: "COMM",
      countryCode: "82",
      from: NAVER_SENDER_PHONE,
      content: message,
      messages: [
        {
          to: phoneNumber.replace(/-/g, ""),
        },
      ],
    };

    // 현재 시간을 ISO 문자열로 변환
    const timestamp = new Date().toISOString();
    const date = new Date().toISOString().split("T")[0].replace(/-/g, "");

    // HMAC-SHA256 서명 생성
    const crypto = require("crypto");
    const signature = crypto
      .createHmac("sha256", NAVER_SECRET_KEY)
      .update(
        `POST /sms/v2/services/${NAVER_SERVICE_ID}/messages\n${timestamp}\n${NAVER_ACCESS_KEY}`
      )
      .digest("base64");

    // 네이버 클라우드 플랫폼 SMS API 호출
    const response = await axios.post(
      NAVER_SMS_API_URL.replace("{serviceId}", NAVER_SERVICE_ID),
      smsRequestData,
      {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "x-ncp-apigw-timestamp": timestamp,
          "x-ncp-iam-access-key": NAVER_ACCESS_KEY,
          "x-ncp-apigw-signature-v2": signature,
        },
      }
    );

    // 발송 성공 시 로그 저장
    console.log("SMS 발송 성공:", {
      phoneNumber,
      customerName,
      senderId,
      senderName,
      message: message.substring(0, 50) + "...",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "SMS가 성공적으로 발송되었습니다.",
      data: response.data,
    });
  } catch (error: any) {
    console.error("SMS 발송 실패:", error.response?.data || error.message);

    return NextResponse.json(
      {
        error: "SMS 발송에 실패했습니다.",
        details: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
