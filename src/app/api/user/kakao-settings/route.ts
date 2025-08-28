import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface KakaoSettings {
  userId: string;
  kakaoAccessToken: string;
  kakaoBusinessId?: string;
  kakaoTemplateId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 사용자별 카카오톡 설정 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("user_kakao_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("카카오톡 설정 조회 오류:", error);
      return NextResponse.json(
        { error: "설정 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || null,
    });
  } catch (error) {
    console.error("카카오톡 설정 조회 오류:", error);
    return NextResponse.json(
      { error: "설정 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 사용자별 카카오톡 설정 저장/수정
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, kakaoAccessToken, kakaoBusinessId, kakaoTemplateId } = body;

    if (!userId || !kakaoAccessToken) {
      return NextResponse.json(
        { error: "사용자 ID와 카카오톡 액세스 토큰이 필요합니다." },
        { status: 400 }
      );
    }

    // 기존 설정 확인
    const { data: existingSettings } = await supabase
      .from("user_kakao_settings")
      .select("id")
      .eq("user_id", userId)
      .single();

    const now = new Date().toISOString();

    if (existingSettings) {
      // 기존 설정 업데이트
      const { data, error } = await supabase
        .from("user_kakao_settings")
        .update({
          kakao_access_token: kakaoAccessToken,
          kakao_business_id: kakaoBusinessId || null,
          kakao_template_id: kakaoTemplateId || null,
          is_active: true,
          updated_at: now,
        })
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        console.error("카카오톡 설정 업데이트 오류:", error);
        return NextResponse.json(
          { error: "설정 업데이트에 실패했습니다." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "카카오톡 설정이 업데이트되었습니다.",
        data,
      });
    } else {
      // 새 설정 생성
      const { data, error } = await supabase
        .from("user_kakao_settings")
        .insert({
          user_id: userId,
          kakao_access_token: kakaoAccessToken,
          kakao_business_id: kakaoBusinessId || null,
          kakao_template_id: kakaoTemplateId || null,
          is_active: true,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        console.error("카카오톡 설정 생성 오류:", error);
        return NextResponse.json(
          { error: "설정 생성에 실패했습니다." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "카카오톡 설정이 생성되었습니다.",
        data,
      });
    }
  } catch (error) {
    console.error("카카오톡 설정 저장 오류:", error);
    return NextResponse.json(
      { error: "설정 저장에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 사용자별 카카오톡 설정 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("user_kakao_settings")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("카카오톡 설정 삭제 오류:", error);
      return NextResponse.json(
        { error: "설정 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "카카오톡 설정이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("카카오톡 설정 삭제 오류:", error);
    return NextResponse.json(
      { error: "설정 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
