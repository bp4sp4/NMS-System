"use client";

import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/Navigation";
import { supabase } from "@/lib/supabase";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Plus,
  ChevronDown,
  ChevronRight,
  X,
  Trash2,
} from "lucide-react";
import MeetingRoomBookingModal from "@/components/MeetingRoomBookingModal";
import { getDepartmentColor } from "@/lib/utils";

interface MeetingRoom {
  id: string;
  name: string;
  location: string;
  capacity: number;
  description: string;
  is_active: boolean;
}

interface MeetingReservation {
  id: string;
  room_id: string;
  user_id: string;
  title: string;
  description: string;
  organizer_name: string;
  attendees: string;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  repeat_type: string;
  repeat_count: number;
  status: string;
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

export default function MeetingRoomsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>([]);
  const [reservations, setReservations] = useState<MeetingReservation[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingData, setBookingData] = useState<{
    roomId?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
  }>({});
  const [selectedReservation, setSelectedReservation] =
    useState<MeetingReservation | null>(null);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isMoreReservationsModalOpen, setIsMoreReservationsModalOpen] =
    useState(false);
  const [moreReservations, setMoreReservations] = useState<
    MeetingReservation[]
  >([]);
  const [moreReservationsTitle, setMoreReservationsTitle] = useState("");

  // 인증 상태 확인
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  // 데이터 로드
  useEffect(() => {
    if (user) {
      loadMeetingRooms();
      loadReservations();
    }
  }, [user, selectedDate]);

  const loadMeetingRooms = async () => {
    try {
      const { data, error } = await supabase
        .from("meeting_rooms")
        .select("*")
        .eq("is_active", true)
        .order("location", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      setMeetingRooms(data || []);
    } catch (error) {
      console.error("회의실 목록 로드 오류:", error);
    }
  };

  const loadReservations = async () => {
    try {
      // 전체 예약을 가져오도록 수정 (날짜 제한 제거)
      const { data, error } = await supabase
        .from("meeting_reservations")
        .select(
          `
          *,
          meeting_rooms (
            name,
            location
          ),
          users (
            id,
            name,
            email
          )
        `
        )
        .eq("status", "confirmed")
        .order("start_time", { ascending: true });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error("예약 목록 로드 오류:", error);
    }
  };

  const getWeekDates = (): Date[] => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());

    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const getMonthDates = (): Date[] => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    // 해당 월의 첫 번째 날
    const firstDay = new Date(year, month, 1);
    // 해당 월의 마지막 날
    const lastDay = new Date(year, month + 1, 0);

    // 첫 번째 날이 시작하는 주의 시작일 (일요일)
    const startOfFirstWeek = new Date(firstDay);
    startOfFirstWeek.setDate(firstDay.getDate() - firstDay.getDay());

    // 마지막 날이 끝나는 주의 마지막일 (토요일)
    const endOfLastWeek = new Date(lastDay);
    endOfLastWeek.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

    const dates: Date[] = [];
    const current = new Date(startOfFirstWeek);

    while (current <= endOfLastWeek) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  // 특정 날짜의 회의 개수 계산
  const getMeetingCountForDate = (date: Date): number => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return reservations.filter((reservation) => {
      // 회의실 필터링
      if (selectedRoom && reservation.room_id !== selectedRoom) {
        return false;
      }

      const resStart = new Date(reservation.start_time);
      const resEnd = new Date(reservation.end_time);

      // 해당 날짜와 겹치는 회의인지 확인
      return resStart < endOfDay && resEnd > startOfDay;
    }).length;
  };

  const getTimeSlots = (): string[] => {
    const slots: string[] = [];
    for (let hour = 8; hour <= 23; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
    }
    return slots;
  };

  const getReservationsForSlot = (
    roomId: string,
    date: Date,
    timeSlot: string
  ) => {
    const [hour] = timeSlot.split(":").map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    return reservations.filter((reservation) => {
      if (reservation.room_id !== roomId) return false;

      const resStart = new Date(reservation.start_time);
      const resEnd = new Date(reservation.end_time);

      return resStart < slotEnd && resEnd > slotStart;
    });
  };

  const handleDateClick = (roomId: string, date: Date, timeSlot: string) => {
    const [hour] = timeSlot.split(":").map(Number);
    const [endHour] = timeSlot.split(":").map(Number);

    setBookingData({
      roomId,
      date: date.toISOString().split("T")[0],
      startTime: `${hour.toString().padStart(2, "0")}:00`,
      endTime: `${(endHour + 1).toString().padStart(2, "0")}:00`,
    });
    setIsBookingModalOpen(true);
  };

  const handleBookingSuccess = () => {
    setIsBookingModalOpen(false);
    setBookingData({});
    loadReservations();
  };

  const handleReservationClick = (reservation: MeetingReservation) => {
    setSelectedReservation(reservation);
    setIsReservationModalOpen(true);
  };

  // 예약 수정/삭제 권한 체크
  const canEditReservation = (reservation: MeetingReservation): boolean => {
    if (!user || !reservation.users) return false;
    return user.id === reservation.users.id;
  };

  const handleMoreReservationsClick = (
    reservations: MeetingReservation[],
    date: Date,
    timeSlot: string
  ) => {
    setMoreReservations(reservations);
    const title =
      timeSlot === "전체"
        ? `${date.getMonth() + 1}월 ${date.getDate()}일 전체 - ${
            reservations.length
          }개 예약`
        : `${date.getMonth() + 1}월 ${date.getDate()}일 ${timeSlot} - ${
            reservations.length
          }개 예약`;
    setMoreReservationsTitle(title);
    setIsMoreReservationsModalOpen(true);
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === "next" ? 7 : -7));
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">인증 상태 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="flex h-screen">
        {/* 왼쪽 사이드바 - 필터 및 통계 */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">회의 예약</h2>
              <button
                onClick={() => setIsBookingModalOpen(true)}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* 오늘의 예약 현황 */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">오늘의 예약</h3>
              <div className="text-2xl font-bold text-blue-600">
                {
                  reservations.filter((reservation) => {
                    const today = new Date().toISOString().split("T")[0];
                    const reservationDate = new Date(reservation.start_time)
                      .toISOString()
                      .split("T")[0];
                    return reservationDate === today;
                  }).length
                }
                건
              </div>
              <div className="text-sm text-gray-600 mt-1">
                총 {reservations.length}건의 예약
              </div>
            </div>

            {/* 회의실 필터 */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">회의실 필터</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedRoom(null)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                    selectedRoom === null
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="font-medium">전체 보기</span>
                  </div>
                </button>
                {meetingRooms.map((room) => {
                  const roomReservations = reservations.filter(
                    (r) => r.room_id === room.id
                  );
                  return (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoom(room.id)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                        selectedRoom === room.id
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                      }`}
                      title={room.location}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <div>
                            <div className="font-medium text-sm">
                              {room.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {roomReservations.length}건
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 빠른 액션 */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">빠른 액션</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">오늘로 이동</span>
                  </div>
                </button>
                <button
                  onClick={() =>
                    setViewMode(viewMode === "week" ? "month" : "week")
                  }
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      {viewMode === "week" ? "월간 보기" : "주간 보기"}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* 운영규칙 */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start space-x-2 text-sm text-gray-600">
                <span>⭐</span>
                <div>
                  <div className="font-medium mb-2">운영규칙</div>
                  <div className="text-xs leading-relaxed">
                    • 예약 신청은 해당 날짜를 클릭하시면 됩니다
                    <br />
                    • 예약은 30분 단위로 가능합니다
                    <br />• 최대 3개월까지 예약 가능합니다
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 - 캘린더 */}
        <div className="flex-1 flex flex-col">
          {/* 헤더 */}
          <div className="bg-white border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigateWeek("prev")}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ‹
                  </button>
                  <span className="text-lg font-semibold text-gray-900">
                    {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}
                    월 {selectedDate.getDate()}일 -{" "}
                    {new Date(
                      selectedDate.getTime() + 6 * 24 * 60 * 60 * 1000
                    ).getDate()}
                    일
                  </span>
                  <button
                    onClick={() => navigateWeek("next")}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ›
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex bg-gray-100 rounded-lg">
                  <button
                    onClick={() => setViewMode("month")}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      viewMode === "month"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600"
                    }`}
                  >
                    월간
                  </button>
                  <button
                    onClick={() => setViewMode("week")}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      viewMode === "week"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600"
                    }`}
                  >
                    주간
                  </button>
                </div>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  전체보기
                </button>
              </div>
            </div>
          </div>

          {/* 캘린더 그리드 */}
          <div className="flex-1 overflow-auto">
            <div className="min-h-full">
              {/* 요일 헤더 */}
              <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
                <div
                  className={`grid ${
                    viewMode === "month" ? "grid-cols-8" : "grid-cols-8"
                  }`}
                >
                  <div className="p-4 border-r border-gray-200"></div>
                  {(viewMode === "month"
                    ? getMonthDates()
                    : getWeekDates()
                  ).map((date, index) => {
                    const meetingCount =
                      viewMode === "month" ? getMeetingCountForDate(date) : 0;
                    return (
                      <div
                        key={index}
                        className="p-4 text-center border-r border-gray-200"
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {date.getMonth() + 1}.{date.getDate()}.
                        </div>
                        <div className="text-xs text-gray-500">
                          {
                            ["일", "월", "화", "수", "목", "금", "토"][
                              date.getDay()
                            ]
                          }
                        </div>
                        {viewMode === "month" && meetingCount > 0 && (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {meetingCount}개
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 시간 슬롯과 회의실 그리드 */}
              <div
                className={`grid ${
                  viewMode === "month" ? "grid-cols-8" : "grid-cols-8"
                }`}
              >
                {viewMode === "month" ? (
                  // 월간 보기: 날짜별 회의 개수만 표시
                  <>
                    <div className="border-r border-gray-200"></div>
                    {getMonthDates().map((date, dateIndex) => {
                      const meetingCount = getMeetingCountForDate(date);
                      const dayReservations = reservations.filter(
                        (reservation) => {
                          if (
                            selectedRoom &&
                            reservation.room_id !== selectedRoom
                          ) {
                            return false;
                          }
                          const resStart = new Date(reservation.start_time);
                          const resEnd = new Date(reservation.end_time);
                          const startOfDay = new Date(date);
                          startOfDay.setHours(0, 0, 0, 0);
                          const endOfDay = new Date(date);
                          endOfDay.setHours(23, 59, 59, 999);
                          return resStart < endOfDay && resEnd > startOfDay;
                        }
                      );

                      return (
                        <div
                          key={dateIndex}
                          className="border-r border-gray-200"
                        >
                          <div className="h-96 border-b border-gray-100 p-2 cursor-pointer hover:bg-blue-50 transition-colors relative">
                            <div className="text-xs text-gray-500 mb-2">
                              {date.getDate()}일
                            </div>
                            {meetingCount > 0 && (
                              <div className="space-y-1">
                                <div className="text-xs font-medium text-blue-600 mb-2">
                                  {meetingCount}개 회의
                                </div>
                                {dayReservations
                                  .slice(0, 3)
                                  .map((reservation) => {
                                    const colorClass = getDepartmentColor(
                                      reservation.meeting_rooms?.name || ""
                                    );
                                    return (
                                      <div
                                        key={reservation.id}
                                        className={`${colorClass} text-white p-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity relative group`}
                                        title={`${reservation.title} - ${reservation.meeting_rooms?.name}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleReservationClick(reservation);
                                        }}
                                      >
                                        <div className="font-semibold truncate">
                                          {reservation.title}
                                        </div>
                                        <div className="text-xs opacity-90 truncate">
                                          {new Date(
                                            reservation.start_time
                                          ).toLocaleTimeString("ko-KR", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </div>
                                        {canEditReservation(reservation) && (
                                          <button
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              if (
                                                confirm(
                                                  "정말로 이 예약을 삭제하시겠습니까?"
                                                )
                                              ) {
                                                try {
                                                  const { error } =
                                                    await supabase
                                                      .from(
                                                        "meeting_reservations"
                                                      )
                                                      .delete()
                                                      .eq("id", reservation.id);

                                                  if (error) throw error;

                                                  // 예약 목록 새로고침
                                                  loadReservations();
                                                } catch (error) {
                                                  console.error(
                                                    "예약 삭제 오류:",
                                                    error
                                                  );
                                                  alert(
                                                    "예약 삭제 중 오류가 발생했습니다."
                                                  );
                                                }
                                              }
                                            }}
                                            className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-600 rounded"
                                            title="예약 삭제"
                                          >
                                            <Trash2 className="w-2 h-2" />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                {dayReservations.length > 3 && (
                                  <div
                                    className="text-xs text-gray-500 text-center cursor-pointer hover:text-gray-700 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoreReservationsClick(
                                        dayReservations,
                                        date,
                                        "전체"
                                      );
                                    }}
                                  >
                                    +{dayReservations.length - 3}개 더
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  // 주간 보기: 기존 시간별 표시
                  <>
                    {/* 시간 슬롯 */}
                    <div className="border-r border-gray-200">
                      {getTimeSlots().map((timeSlot) => (
                        <div
                          key={timeSlot}
                          className="h-20 border-b border-gray-100 flex items-center justify-center"
                        >
                          <span className="text-sm text-gray-500">
                            {timeSlot}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* 회의실별 예약 슬롯 */}
                    {getWeekDates().map((date, dateIndex) => (
                      <div key={dateIndex} className="border-r border-gray-200">
                        {getTimeSlots().map((timeSlot, timeIndex) => {
                          // 선택된 회의실에 따라 예약을 필터링하고 정렬
                          const allReservations = reservations
                            .filter((reservation) => {
                              // 회의실 필터링
                              if (
                                selectedRoom &&
                                reservation.room_id !== selectedRoom
                              ) {
                                return false;
                              }

                              // 시간 필터링
                              const resStart = new Date(reservation.start_time);
                              const resEnd = new Date(reservation.end_time);
                              const slotStart = new Date(date);
                              const [hour] = timeSlot.split(":").map(Number);
                              slotStart.setHours(hour, 0, 0, 0);
                              const slotEnd = new Date(slotStart);
                              slotEnd.setHours(hour + 1, 0, 0, 0);

                              return resStart < slotEnd && resEnd > slotStart;
                            })
                            .sort(
                              (a, b) =>
                                new Date(a.start_time).getTime() -
                                new Date(b.start_time).getTime()
                            );

                          return (
                            <div
                              key={timeIndex}
                              className="h-20 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors relative"
                              onClick={() => {
                                if (selectedRoom) {
                                  handleDateClick(selectedRoom, date, timeSlot);
                                }
                              }}
                            >
                              {allReservations.length > 0 && (
                                <div className="absolute inset-0 p-1">
                                  {allReservations.length > 2 ? (
                                    // 2개 이상 겹칠 때는 축약 표시
                                    <div className="space-y-0.5">
                                      {allReservations
                                        .slice(0, 1)
                                        .map((reservation, index) => {
                                          const colorClass = getDepartmentColor(
                                            reservation.meeting_rooms?.name ||
                                              ""
                                          );

                                          return (
                                            <div
                                              key={reservation.id}
                                              className={`${colorClass} text-white p-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity shadow-sm relative group`}
                                              title={`${reservation.title} - ${reservation.meeting_rooms?.name} (${reservation.meeting_rooms?.location})`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleReservationClick(
                                                  reservation
                                                );
                                              }}
                                            >
                                              <div className="font-semibold truncate">
                                                {reservation.title}
                                              </div>
                                              {canEditReservation(
                                                reservation
                                              ) && (
                                                <button
                                                  onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (
                                                      confirm(
                                                        "정말로 이 예약을 삭제하시겠습니까?"
                                                      )
                                                    ) {
                                                      try {
                                                        const { error } =
                                                          await supabase
                                                            .from(
                                                              "meeting_reservations"
                                                            )
                                                            .delete()
                                                            .eq(
                                                              "id",
                                                              reservation.id
                                                            );

                                                        if (error) throw error;

                                                        // 예약 목록 새로고침
                                                        loadReservations();
                                                      } catch (error) {
                                                        console.error(
                                                          "예약 삭제 오류:",
                                                          error
                                                        );
                                                        alert(
                                                          "예약 삭제 중 오류가 발생했습니다."
                                                        );
                                                      }
                                                    }
                                                  }}
                                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-600 rounded"
                                                  title="예약 삭제"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </button>
                                              )}
                                            </div>
                                          );
                                        })}
                                      <div
                                        className="bg-gray-500 text-white p-1 rounded text-xs text-center cursor-pointer hover:bg-gray-600 transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMoreReservationsClick(
                                            allReservations,
                                            date,
                                            timeSlot
                                          );
                                        }}
                                      >
                                        +{allReservations.length - 1}개 더
                                      </div>
                                    </div>
                                  ) : (
                                    // 2개 이하일 때는 전체 표시
                                    <div className="space-y-0.5">
                                      {allReservations.map(
                                        (reservation, index) => {
                                          const colorClass = getDepartmentColor(
                                            reservation.meeting_rooms?.name ||
                                              ""
                                          );

                                          return (
                                            <div
                                              key={reservation.id}
                                              className={`${colorClass} text-white p-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity shadow-sm relative group`}
                                              title={`${reservation.title} - ${reservation.meeting_rooms?.name} (${reservation.meeting_rooms?.location})`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleReservationClick(
                                                  reservation
                                                );
                                              }}
                                            >
                                              <div className="font-semibold truncate">
                                                {reservation.title}
                                              </div>
                                              <div className="text-xs opacity-90 truncate">
                                                {reservation.meeting_rooms
                                                  ?.name || ""}
                                              </div>
                                              {canEditReservation(
                                                reservation
                                              ) && (
                                                <button
                                                  onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (
                                                      confirm(
                                                        "정말로 이 예약을 삭제하시겠습니까?"
                                                      )
                                                    ) {
                                                      try {
                                                        const { error } =
                                                          await supabase
                                                            .from(
                                                              "meeting_reservations"
                                                            )
                                                            .delete()
                                                            .eq(
                                                              "id",
                                                              reservation.id
                                                            );

                                                        if (error) throw error;

                                                        // 예약 목록 새로고침
                                                        loadReservations();
                                                      } catch (error) {
                                                        console.error(
                                                          "예약 삭제 오류:",
                                                          error
                                                        );
                                                        alert(
                                                          "예약 삭제 중 오류가 발생했습니다."
                                                        );
                                                      }
                                                    }
                                                  }}
                                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-600 rounded"
                                                  title="예약 삭제"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </button>
                                              )}
                                            </div>
                                          );
                                        }
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 예약 모달 */}
      <MeetingRoomBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setIsEditMode(false);
        }}
        onSuccess={handleBookingSuccess}
        initialData={bookingData}
        meetingRooms={meetingRooms}
        user={user}
        isEditMode={isEditMode}
        editReservationId={selectedReservation?.id}
      />

      {/* 예약 상세 모달 */}
      {isReservationModalOpen && selectedReservation && (
        <div
          className="fixed inset-0 bg-[#00000090] flex items-center justify-center z-50"
          onClick={() => {
            setIsReservationModalOpen(false);
            setSelectedReservation(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                회의 상세 정보
              </h2>
              <button
                onClick={() => {
                  setIsReservationModalOpen(false);
                  setSelectedReservation(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  회의 정보
                </h3>
                {canEditReservation(selectedReservation) && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        // 수정 모달 열기
                        setIsReservationModalOpen(false);
                        setIsEditMode(true);
                        setBookingData({
                          roomId: selectedReservation.room_id,
                          date: new Date(selectedReservation.start_time)
                            .toISOString()
                            .split("T")[0],
                          startTime: new Date(selectedReservation.start_time)
                            .toTimeString()
                            .slice(0, 5),
                          endTime: new Date(selectedReservation.end_time)
                            .toTimeString()
                            .slice(0, 5),
                        });
                        setIsBookingModalOpen(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      수정
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm("정말로 이 예약을 삭제하시겠습니까?")) {
                          try {
                            const { error } = await supabase
                              .from("meeting_reservations")
                              .delete()
                              .eq("id", selectedReservation.id);

                            if (error) throw error;

                            // 예약 목록 새로고침
                            loadReservations();
                            setIsReservationModalOpen(false);
                            setSelectedReservation(null);
                          } catch (error) {
                            console.error("예약 삭제 오류:", error);
                            alert("예약 삭제 중 오류가 발생했습니다.");
                          }
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  회의 제목
                </label>
                <p className="text-gray-900">{selectedReservation.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  회의실
                </label>
                <p className="text-gray-900">
                  {selectedReservation.meeting_rooms?.name}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedReservation.meeting_rooms?.location}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  일시
                </label>
                <p className="text-gray-900">
                  {new Date(selectedReservation.start_time).toLocaleString(
                    "ko-KR"
                  )}{" "}
                  -
                  {new Date(selectedReservation.end_time).toLocaleString(
                    "ko-KR"
                  )}
                </p>
              </div>
              {selectedReservation.organizer_name && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    주관자
                  </label>
                  <p className="text-gray-900">
                    {selectedReservation.organizer_name}
                  </p>
                </div>
              )}
              {selectedReservation.attendees && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    참석자
                  </label>
                  <p className="text-gray-900">
                    {selectedReservation.attendees}
                  </p>
                </div>
              )}
              {selectedReservation.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명
                  </label>
                  <p className="text-gray-900">
                    {selectedReservation.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 모든 예약 보기 모달 */}
      {isMoreReservationsModalOpen && (
        <div
          className="fixed inset-0 bg-[#00000090] flex items-center justify-center z-50"
          onClick={() => {
            setIsMoreReservationsModalOpen(false);
            setMoreReservations([]);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {moreReservationsTitle}
              </h2>
              <button
                onClick={() => {
                  setIsMoreReservationsModalOpen(false);
                  setMoreReservations([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 예약 목록 */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-3">
                {moreReservations.map((reservation, index) => {
                  const colorClass = getDepartmentColor(
                    reservation.meeting_rooms?.name || ""
                  );

                  return (
                    <div
                      key={reservation.id}
                      className="bg-gray-50 border border-gray-200 p-4 rounded-lg shadow-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div
                              className={`w-4 h-4 rounded-full ${colorClass}`}
                            ></div>
                            <div className="font-semibold text-lg text-gray-900">
                              {reservation.title}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm text-gray-700">
                              <span className="font-medium">위치:</span>{" "}
                              {reservation.meeting_rooms?.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {reservation.meeting_rooms?.location}
                            </div>
                            <div className="text-sm text-gray-700">
                              <span className="font-medium">시간:</span>{" "}
                              {new Date(reservation.start_time).toLocaleString(
                                "ko-KR"
                              )}{" "}
                              -{" "}
                              {new Date(reservation.end_time).toLocaleString(
                                "ko-KR"
                              )}
                            </div>
                            {reservation.organizer_name && (
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">주관자:</span>{" "}
                                {reservation.organizer_name}
                              </div>
                            )}
                            {reservation.attendees && (
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">참석자:</span>{" "}
                                {reservation.attendees}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => {
                              setIsMoreReservationsModalOpen(false);
                              setMoreReservations([]);
                              setSelectedReservation(reservation);
                              setIsReservationModalOpen(true);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            상세보기
                          </button>
                          {canEditReservation(reservation) && (
                            <button
                              onClick={async () => {
                                if (
                                  confirm("정말로 이 예약을 삭제하시겠습니까?")
                                ) {
                                  try {
                                    const { error } = await supabase
                                      .from("meeting_reservations")
                                      .delete()
                                      .eq("id", reservation.id);

                                    if (error) throw error;

                                    // 예약 목록 새로고침
                                    loadReservations();
                                    // 모달에서도 해당 예약 제거
                                    setMoreReservations((prev) =>
                                      prev.filter(
                                        (r) => r.id !== reservation.id
                                      )
                                    );
                                  } catch (error) {
                                    console.error("예약 삭제 오류:", error);
                                    alert("예약 삭제 중 오류가 발생했습니다.");
                                  }
                                }
                              }}
                              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
