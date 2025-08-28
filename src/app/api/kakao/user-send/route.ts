import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { supabase } from "@/lib/supabase";

interface SendMessageRequest {
  userId: string;
  phoneNumber: string;
  message: string;
  customerName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendMessageRequest = await request.json();
    const { userId, phoneNumber, message, customerName } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 사용자별 카카오톡 설정 조회
    const { data: userSettings, error: settingsError } = await supabase
      .from("user_kakao_settings")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (settingsError || !userSettings) {
      return NextResponse.json(
        { error: "카카오톡 API 설정이 없습니다. 먼저 설정을 완료해주세요." },
        { status: 400 }
      );
    }

    if (!userSettings.kakao_access_token) {
      return NextResponse.json(
        { error: "카카오톡 액세스 토큰이 설정되지 않았습니다." },
        { status: 400 }
      );
    }

    // 카카오톡 API 엔드포인트 (사용자별 설정 사용)
    const KAKAO_API_URL = "https://api.kakao.com/v2/api/talk/memo/default/send";

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

    // 카카오톡 API 호출 (사용자별 토큰 사용)
    const response = await axios.post(KAKAO_API_URL, kakaoRequestData, {
      headers: {
        Authorization: `Bearer ${userSettings.kakao_access_token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // 발송 성공 시 로그 저장
    console.log("사용자별 카카오톡 발송 성공:", {
      userId,
      phoneNumber,
      customerName,
      message: message.substring(0, 50) + "...",
      timestamp: new Date().toISOString(),
    });

    // 발송 로그 저장
    await saveKakaoLog(userId, phoneNumber, customerName, message, true);

    return NextResponse.json({
      success: true,
      message: "카카오톡 메시지가 성공적으로 발송되었습니다.",
      data: response.data,
    });
  } catch (error: any) {
    console.error(
      "사용자별 카카오톡 발송 실패:",
      error.response?.data || error.message
    );

    // 발송 실패 로그 저장
    try {
      const body: SendMessageRequest = await request.json();
      if (body?.userId) {
        await saveKakaoLog(
          body.userId,
          body.phoneNumber,
          body.customerName,
          body.message,
          false
        );
      }
    } catch (logError) {
      console.error("로그 저장 실패:", logError);
    }

    return NextResponse.json(
      {
        error: "카카오톡 메시지 발송에 실패했습니다.",
        details: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}

// 카카오톡 발송 로그 저장
const saveKakaoLog = async (
  userId: string,
  phoneNumber: string,
  customerName: string | undefined,
  message: string,
  success: boolean
) => {
  try {
    await supabase.from("user_kakao_logs").insert({
      user_id: userId,
      phone_number: phoneNumber,
      customer_name: customerName,
      message: message.substring(0, 200) + "...",
      success,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("카카오톡 로그 저장 실패:", error);
  }
};
