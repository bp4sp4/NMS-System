import { supabase } from "./supabase";
import type {
  Attendance,
  AttendanceRecord,
  AttendanceStats,
} from "@/types/attendance";

// 출근 체크
export async function checkIn(
  userId: string,
  notes?: string
): Promise<{ success: boolean; error?: string; data?: Attendance }> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date().toISOString();

    // 오늘 이미 출근했는지 확인
    const { data: existingRecord, error: checkError } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      return {
        success: false,
        error: "출근 기록 확인 중 오류가 발생했습니다.",
      };
    }

    if (existingRecord && existingRecord.check_in_time) {
      return { success: false, error: "이미 오늘 출근하셨습니다." };
    }

    // 출근 시간이 10시 이후인지 확인 (지각 여부)
    const checkInTime = new Date(now);
    const standardTime = new Date(today + "T10:00:00");
    const isLate = checkInTime > standardTime;

    const attendanceData = {
      user_id: userId,
      date: today,
      check_in_time: now,
      status: isLate ? "late" : "present",
      notes: notes || null,
    };

    // upsert를 사용하여 중복 오류 방지
    const { data, error } = await supabase
      .from("attendance")
      .upsert(attendanceData, {
        onConflict: "user_id,date",
        ignoreDuplicates: false,
      })
      .select()
      .single();

    const result = { data, error };

    if (result.error) {
      console.error("출근 기록 저장 오류:", result.error);
      return {
        success: false,
        error: `출근 기록 저장 중 오류가 발생했습니다: ${result.error.message}`,
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error("출근 체크 오류:", error);
    return { success: false, error: "출근 체크 중 오류가 발생했습니다." };
  }
}

// 퇴근 체크
export async function checkOut(
  userId: string,
  notes?: string
): Promise<{ success: boolean; error?: string; data?: Attendance }> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date().toISOString();

    // 오늘 출근 기록이 있는지 확인
    const { data: existingRecord, error: checkError } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    if (checkError) {
      return { success: false, error: "오늘 출근 기록을 찾을 수 없습니다." };
    }

    if (!existingRecord.check_in_time) {
      return {
        success: false,
        error: "출근 기록이 없습니다. 먼저 출근해주세요.",
      };
    }

    if (existingRecord.check_out_time) {
      return { success: false, error: "이미 오늘 퇴근하셨습니다." };
    }

    // 근무 시간 계산
    const checkInTime = new Date(existingRecord.check_in_time);
    const checkOutTime = new Date(now);
    const workHours =
      (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

    // 조기 퇴근 여부 확인 (19시 이전)
    const standardEndTime = new Date(today + "T19:00:00");
    const isEarlyLeave = checkOutTime < standardEndTime;

    const updateData = {
      check_out_time: now,
      work_hours: Math.round(workHours * 100) / 100, // 소수점 둘째 자리까지
      status: isEarlyLeave ? "early_leave" : existingRecord.status,
      notes: notes || existingRecord.notes,
    };

    const { data, error } = await supabase
      .from("attendance")
      .update(updateData)
      .eq("id", existingRecord.id)
      .select()
      .single();

    if (error) {
      console.error("퇴근 기록 저장 오류:", error);
      return {
        success: false,
        error: `퇴근 기록 저장 중 오류가 발생했습니다: ${error.message}`,
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error("퇴근 체크 오류:", error);
    return { success: false, error: "퇴근 체크 중 오류가 발생했습니다." };
  }
}

// 오늘 출근 상태 조회
export async function getTodayAttendance(
  userId: string
): Promise<Attendance | null> {
  try {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("오늘 출근 기록 조회 오류:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("오늘 출근 기록 조회 오류:", error);
    return null;
  }
}

// 월별 출근 기록 조회
export async function getMonthlyAttendance(
  userId: string,
  year: number,
  month: number
): Promise<AttendanceRecord[]> {
  try {
    const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
    const endDate = new Date(year, month, 0).toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (error) {
      console.error("월별 출근 기록 조회 오류:", error);
      return [];
    }

    return data.map((record) => ({
      date: record.date,
      checkIn: record.check_in_time,
      checkOut: record.check_out_time,
      workHours: record.work_hours,
      status: record.status,
    }));
  } catch (error) {
    console.error("월별 출근 기록 조회 오류:", error);
    return [];
  }
}

// 출근 통계 조회
export async function getAttendanceStats(
  userId: string,
  year: number,
  month: number
): Promise<AttendanceStats> {
  try {
    const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
    const endDate = new Date(year, month, 0).toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate);

    if (error) {
      console.error("출근 통계 조회 오류:", error);
      return {
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        totalWorkHours: 0,
        averageWorkHours: 0,
      };
    }

    const totalDays = new Date(year, month, 0).getDate();
    const presentDays = data.filter(
      (record) => record.status === "present"
    ).length;
    const absentDays = data.filter(
      (record) => record.status === "absent"
    ).length;
    const lateDays = data.filter((record) => record.status === "late").length;
    const totalWorkHours = data.reduce(
      (sum, record) => sum + (record.work_hours || 0),
      0
    );
    const averageWorkHours = data.length > 0 ? totalWorkHours / data.length : 0;

    return {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      totalWorkHours: Math.round(totalWorkHours * 100) / 100,
      averageWorkHours: Math.round(averageWorkHours * 100) / 100,
    };
  } catch (error) {
    console.error("출근 통계 조회 오류:", error);
    return {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      totalWorkHours: 0,
      averageWorkHours: 0,
    };
  }
}
