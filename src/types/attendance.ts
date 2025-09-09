export interface Attendance {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD 형식
  check_in_time: string | null; // ISO 8601 형식
  check_out_time: string | null; // ISO 8601 형식
  work_hours: number | null; // 근무 시간 (시간 단위)
  status: "present" | "absent" | "late" | "early_leave";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: number | null;
  status: string;
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalWorkHours: number;
  averageWorkHours: number;
}
