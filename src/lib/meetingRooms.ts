import { supabase } from "./supabase";

export interface MeetingReservation {
  id: string;
  room_id: string;
  user_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  repeat_type: string;
  repeat_count: number;
  status: string;
  created_at: string;
  organizer_name?: string;
  attendees?: string;
  meeting_rooms: {
    name: string;
    location: string;
  };
  users?: {
    id: string;
    name: string;
    email: string;
  };
}

// 최근 회의실 예약 알림 가져오기 (현재 시간에서 가장 가까운 예약)
export async function getRecentMeetingReservations(
  limit: number = 3
): Promise<MeetingReservation[]> {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const { data, error } = await supabase
      .from("meeting_reservations")
      .select(
        `
        *,
        meeting_rooms (
          name,
          location
        )
      `
      )
      .eq("status", "confirmed")
      .gte("start_time", today.toISOString())
      .lte("start_time", nextWeek.toISOString())
      .order("start_time", { ascending: true })
      .limit(limit * 2); // 더 많이 가져와서 정렬 후 필터링

    if (error) {
      console.error("회의실 예약 조회 오류:", error);
      return [];
    }

    if (!data) return [];

    // 현재 시간에서 가장 가까운 예약들로 정렬
    const sortedReservations = data.sort((a, b) => {
      const timeA = Math.abs(new Date(a.start_time).getTime() - now.getTime());
      const timeB = Math.abs(new Date(b.start_time).getTime() - now.getTime());
      return timeA - timeB;
    });

    return sortedReservations.slice(0, limit);
  } catch (error) {
    console.error("회의실 예약 조회 오류:", error);
    return [];
  }
}

// 사용자의 회의실 예약 가져오기
export async function getUserMeetingReservations(
  userId: string
): Promise<MeetingReservation[]> {
  try {
    const { data, error } = await supabase
      .from("meeting_reservations")
      .select(
        `
        *,
        meeting_rooms (
          name,
          location
        )
      `
      )
      .eq("user_id", userId)
      .eq("status", "confirmed")
      .order("start_time", { ascending: true });

    if (error) {
      console.error("사용자 회의실 예약 조회 오류:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("사용자 회의실 예약 조회 오류:", error);
    return [];
  }
}

// 회의실 예약 생성
export async function createMeetingReservation(reservationData: {
  room_id: string;
  user_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  is_all_day?: boolean;
  repeat_type?: string;
  repeat_count?: number;
}): Promise<{ success: boolean; error?: string; data?: MeetingReservation }> {
  try {
    const { data, error } = await supabase
      .from("meeting_reservations")
      .insert(reservationData)
      .select(
        `
        *,
        meeting_rooms (
          name,
          location
        )
      `
      )
      .single();

    if (error) {
      console.error("회의실 예약 생성 오류:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("회의실 예약 생성 오류:", error);
    return {
      success: false,
      error: "회의실 예약 생성 중 오류가 발생했습니다.",
    };
  }
}
