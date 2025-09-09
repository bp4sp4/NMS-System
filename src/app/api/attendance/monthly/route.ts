import { NextRequest, NextResponse } from "next/server";
import { getMonthlyAttendance, getAttendanceStats } from "@/lib/attendance";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const year = parseInt(
      searchParams.get("year") || new Date().getFullYear().toString()
    );
    const month = parseInt(
      searchParams.get("month") || (new Date().getMonth() + 1).toString()
    );

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const [records, stats] = await Promise.all([
      getMonthlyAttendance(userId, year, month),
      getAttendanceStats(userId, year, month),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        records,
        stats,
      },
    });
  } catch (error) {
    console.error("월별 출근 기록 조회 API 오류:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

