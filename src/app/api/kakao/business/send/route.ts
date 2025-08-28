import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// 카카오톡 비즈니스 API 설정
const KAKAO_BUSINESS_API_URL =
  "https://api.kakao.com/v1/api/talk/friends/message/default/send";
const KAKAO_ACCESS_TOKEN = process.env.KAKAO_ACCESS_TOKEN;
const KAKAO_BUSINESS_ID = process.env.KAKAO_BUSINESS_ID;

interface SendMessageRequest {
  phoneNumber: string;
  message: string;
  templateId?: string;
  customerName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendMessageRequest = await request.json();
    const { phoneNumber, message, templateId, customerName } = body;

    if (!KAKAO_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "카카오톡 API 토큰이 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // 카카오톡 비즈니스 API 요청 데이터
    const kakaoRequestData = {
      receiver_uuids: [phoneNumber], // 실제로는 UUID를 사용해야 함
      template_object: {
        object_type: "text",
        text: message,
        link: {
          web_url: "https://your-business-domain.com",
          mobile_web_url: "https://your-business-domain.com",
        },
      },
    };

    // 카카오톡 비즈니스 API 호출
    const response = await axios.post(
      KAKAO_BUSINESS_API_URL,
      kakaoRequestData,
      {
        headers: {
          Authorization: `Bearer ${KAKAO_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    // 발송 성공 시 로그 저장
    console.log("카카오톡 비즈니스 발송 성공:", {
      phoneNumber,
      customerName,
      message: message.substring(0, 50) + "...",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "메시지가 성공적으로 발송되었습니다.",
      data: response.data,
    });
  } catch (error: any) {
    console.error(
      "카카오톡 비즈니스 발송 실패:",
      error.response?.data || error.message
    );

    return NextResponse.json(
      {
        error: "메시지 발송에 실패했습니다.",
        details: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
