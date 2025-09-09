import { NextRequest, NextResponse } from "next/server";
import { getTodayAttendance } from "@/lib/attendance";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const attendance = await getTodayAttendance(userId);

    return NextResponse.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error("오늘 출근 기록 조회 API 오류:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

