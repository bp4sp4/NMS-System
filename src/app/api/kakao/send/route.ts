import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// 카카오톡 비즈니스 API 설정
const KAKAO_API_URL = "https://api.kakao.com/v2/api/talk/memo/default/send";
const KAKAO_ACCESS_TOKEN = process.env.KAKAO_ACCESS_TOKEN;

interface SendMessageRequest {
  phoneNumber: string;
  message: string;
  templateId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendMessageRequest = await request.json();
    const { phoneNumber, message, templateId } = body;

    if (!KAKAO_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "카카오톡 API 토큰이 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // 카카오톡 API 요청 데이터
    const kakaoRequestData = {
      template_object: {
        object_type: "text",
        text: message,
        link: {
          web_url: "https://developers.kakao.com",
          mobile_web_url: "https://developers.kakao.com",
        },
      },
    };

    // 카카오톡 API 호출
    const response = await axios.post(KAKAO_API_URL, kakaoRequestData, {
      headers: {
        Authorization: `Bearer ${KAKAO_ACCESS_TOKEN}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // 발송 성공 시 로그 저장
    console.log("카카오톡 발송 성공:", {
      phoneNumber,
      message: message.substring(0, 50) + "...",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "메시지가 성공적으로 발송되었습니다.",
      data: response.data,
    });
  } catch (error: any) {
    console.error("카카오톡 발송 실패:", error.response?.data || error.message);

    return NextResponse.json(
      {
        error: "메시지 발송에 실패했습니다.",
        details: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
