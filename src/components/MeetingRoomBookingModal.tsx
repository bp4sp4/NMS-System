"use client";

import React, { useState, useEffect } from "react";
import { Calendar, X, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface MeetingRoom {
  id: string;
  name: string;
  location: string;
  capacity: number;
  description: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  dateString: string;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    roomId?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
  };
  meetingRooms: MeetingRoom[];
  user: {
    id: string;
    name: string;
  };
  isEditMode?: boolean;
  editReservationId?: string;
}

export default function MeetingRoomBookingModal({
  isOpen,
  onClose,
  onSuccess,
  initialData = {},
  meetingRooms,
  user,
  isEditMode = false,
  editReservationId,
}: BookingModalProps) {
  const [formData, setFormData] = useState({
    roomId: initialData.roomId || "",
    date: initialData.date || new Date().toISOString().split("T")[0],
    isAllDay: false,
    startTime: initialData.startTime || "10:00",
    endTime: initialData.endTime || "10:30",
    title: "",
    description: "",
    organizerName: "",
    attendees: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  // 초기 데이터가 변경될 때 폼 업데이트
  useEffect(() => {
    if (initialData.roomId) {
      setFormData((prev) => ({
        ...prev,
        roomId: initialData.roomId || "",
        date: initialData.date || new Date().toISOString().split("T")[0],
        startTime: initialData.startTime || "10:00",
        endTime: initialData.endTime || "10:30",
      }));
    }
  }, [initialData]);

  // 모달이 열릴 때마다 현재 날짜로 초기화 (과거 날짜인 경우)
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split("T")[0];
      setFormData((prev) => {
        // 현재 선택된 날짜가 오늘보다 이전이면 오늘로 설정
        const currentDate = prev.date || today;
        const shouldUpdateDate = currentDate < today;

        return {
          ...prev,
          date: shouldUpdateDate ? today : currentDate,
        };
      });
    }
  }, [isOpen]);

  // 달력이 열릴 때 선택된 날짜의 월로 이동
  useEffect(() => {
    if (showCalendar && formData.date) {
      setCalendarDate(new Date(formData.date));
    }
  }, [showCalendar, formData.date]);

  // 달력 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCalendar) {
        const target = event.target as Element;
        if (!target.closest(".calendar-container")) {
          setShowCalendar(false);
        }
      }
    };

    if (showCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showCalendar]);

  // 수정 모드일 때 기존 예약 데이터 로드
  useEffect(() => {
    if (isEditMode && editReservationId && isOpen) {
      const loadExistingReservation = async () => {
        try {
          const { data, error } = await supabase
            .from("meeting_reservations")
            .select("*")
            .eq("id", editReservationId)
            .single();

          if (error) throw error;

          if (data) {
            setFormData({
              roomId: data.room_id,
              date: new Date(data.start_time).toISOString().split("T")[0],
              isAllDay: data.is_all_day,
              startTime: new Date(data.start_time).toTimeString().slice(0, 5),
              endTime: new Date(data.end_time).toTimeString().slice(0, 5),
              title: data.title,
              description: data.description || "",
              organizerName: data.organizer_name || "",
              attendees: data.attendees || "",
            });
          }
        } catch (error) {
          console.error("기존 예약 데이터 로드 오류:", error);
        }
      };

      loadExistingReservation();
    }
  }, [isEditMode, editReservationId, isOpen]);

  const generateTimeOptions = (): string[] => {
    const options: string[] = [];
    for (let hour = 10; hour <= 19; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        options.push(timeString);
      }
    }
    return options;
  };

  // 달력 관련 함수들
  const getCalendarDays = (): CalendarDay[] => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.getTime() === today.getTime();
      const isPast = date < today;

      days.push({
        date,
        isCurrentMonth,
        isToday,
        isPast,
        dateString: `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
      });
    }

    return days;
  };

  const handleDateSelect = (dateString: string) => {
    handleInputChange("date", dateString);
    setShowCalendar(false);
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCalendarDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.roomId) {
      newErrors.roomId = "회의실을 선택해주세요.";
    }

    if (!formData.title.trim()) {
      newErrors.title = "회의 제목을 입력해주세요.";
    }

    // 날짜 검증
    if (!formData.date) {
      newErrors.date = "예약일을 선택해주세요.";
    } else {
      const today = new Date().toISOString().split("T")[0];
      if (formData.date < today) {
        newErrors.date = "오늘 이후의 날짜를 선택해주세요.";
      }
    }

    if (!formData.isAllDay) {
      if (!formData.startTime) {
        newErrors.startTime = "시작 시간을 선택해주세요.";
      }

      if (!formData.endTime) {
        newErrors.endTime = "종료 시간을 선택해주세요.";
      }

      if (formData.startTime && formData.endTime) {
        const start = new Date(`2000-01-01T${formData.startTime}`);
        const end = new Date(`2000-01-01T${formData.endTime}`);

        if (start >= end) {
          newErrors.endTime = "종료 시간은 시작 시간보다 늦어야 합니다.";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // 자체 인증 시스템 확인
      if (!user || !user.id) {
        setErrors({ general: "로그인이 필요합니다. 다시 로그인해주세요." });
        setLoading(false);
        return;
      }
      const startDateTime = new Date(
        `${formData.date}T${
          formData.isAllDay ? "10:00" : formData.startTime
        }:00`
      );
      const endDateTime = new Date(
        `${formData.date}T${formData.isAllDay ? "19:00" : formData.endTime}:00`
      );

      // 중복 예약 확인
      const { data: existingReservations, error: checkError } = await supabase
        .from("meeting_reservations")
        .select("*")
        .eq("room_id", formData.roomId)
        .eq("status", "confirmed")
        .gte("start_time", startDateTime.toISOString())
        .lte("end_time", endDateTime.toISOString());

      if (checkError) throw checkError;

      if (existingReservations && existingReservations.length > 0) {
        setErrors({ general: "해당 시간대에 이미 예약이 있습니다." });
        setLoading(false);
        return;
      }

      // 예약 생성 또는 수정
      const reservationData = {
        room_id: formData.roomId,
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        organizer_name: formData.organizerName,
        attendees: formData.attendees,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        is_all_day: formData.isAllDay,
        repeat_type: "none",
        repeat_count: 1,
      };

      let error;
      if (isEditMode && editReservationId) {
        // 수정 모드
        const { error: updateError } = await supabase
          .from("meeting_reservations")
          .update(reservationData)
          .eq("id", editReservationId);
        error = updateError;
      } else {
        // 생성 모드
        const { error: insertError } = await supabase
          .from("meeting_reservations")
          .insert(reservationData);
        error = insertError;
      }

      if (error) throw error;

      onSuccess();
    } catch (error) {
      console.error("예약 생성 오류:", error);
      setErrors({ general: "예약 생성 중 오류가 발생했습니다." });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: string,
    value: string | boolean | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 에러 메시지 제거
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#00000090] flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditMode ? "예약 수정" : "예약 생성"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 일반 오류 메시지 */}
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* 회의실 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              회의실
            </label>
            <select
              value={formData.roomId}
              onChange={(e) => handleInputChange("roomId", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">회의실을 선택하세요</option>
              {meetingRooms && meetingRooms.length > 0 ? (
                meetingRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  회의실 데이터를 불러오는 중...
                </option>
              )}
            </select>
            {errors.roomId && (
              <p className="mt-1 text-sm text-red-600">{errors.roomId}</p>
            )}
          </div>

          {/* 예약일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              예약일
            </label>
            <div className="relative calendar-container">
              <input
                type="text"
                value={
                  formData.date
                    ? new Date(formData.date).toLocaleDateString("ko-KR")
                    : ""
                }
                onClick={() => setShowCalendar(!showCalendar)}
                readOnly
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                placeholder="날짜를 선택하세요"
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />

              {/* 커스텀 달력 */}
              {showCalendar && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 w-full">
                  {/* 달력 헤더 */}
                  <div className="flex items-center justify-between p-3 border-b border-gray-200">
                    <button
                      type="button"
                      onClick={() => navigateMonth("prev")}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-semibold text-gray-900">
                      {calendarDate.getFullYear()}년{" "}
                      {calendarDate.getMonth() + 1}월
                    </span>
                    <button
                      type="button"
                      onClick={() => navigateMonth("next")}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 요일 헤더 */}
                  <div className="grid grid-cols-7 border-b border-gray-200">
                    {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                      <div
                        key={day}
                        className="p-2 text-center text-sm font-medium text-gray-500"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* 날짜 그리드 */}
                  <div className="grid grid-cols-7">
                    {getCalendarDays().map((day, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() =>
                          !day.isPast && handleDateSelect(day.dateString)
                        }
                        disabled={day.isPast}
                        className={`p-2 text-sm hover:bg-blue-50 transition-colors ${
                          day.isPast
                            ? "text-gray-300 cursor-not-allowed"
                            : day.isCurrentMonth
                            ? "text-gray-900 hover:text-blue-600"
                            : "text-gray-400"
                        } ${
                          day.isToday
                            ? "bg-blue-100 text-blue-600 font-semibold"
                            : ""
                        } ${
                          formData.date === day.dateString
                            ? "bg-blue-600 text-white font-semibold"
                            : ""
                        }`}
                      >
                        {day.date.getDate()}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {errors.date ? (
              <p className="mt-1 text-sm text-red-600">{errors.date}</p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                오늘 이후의 날짜만 선택 가능합니다
              </p>
            )}
          </div>

          {/* 하루 종일 */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="allDay"
              checked={formData.isAllDay}
              onChange={(e) => handleInputChange("isAllDay", e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="allDay"
              className="text-sm font-medium text-gray-700"
            >
              All Day (하루 종일 예약)
            </label>
          </div>

          {/* 시간 선택 */}
          {!formData.isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시작 시간
                </label>
                <select
                  value={formData.startTime}
                  onChange={(e) =>
                    handleInputChange("startTime", e.target.value)
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {generateTimeOptions().map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                {errors.startTime && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.startTime}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  끝 시간
                </label>
                <select
                  value={formData.endTime}
                  onChange={(e) => handleInputChange("endTime", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {generateTimeOptions().map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                {errors.endTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
                )}
              </div>
            </div>
          )}

          {/* 회의 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              회의 목적
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="회의 목적 입력"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* 주관자 정보 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              주관자 이름
            </label>
            <input
              type="text"
              value={formData.organizerName}
              onChange={(e) =>
                handleInputChange("organizerName", e.target.value)
              }
              placeholder="주관자 이름"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 참석자 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              참석자
            </label>
            <textarea
              value={formData.attendees}
              onChange={(e) => handleInputChange("attendees", e.target.value)}
              placeholder="참석자 이름을 쉼표로 구분하여 입력하세요 (예: 홍길동, 김철수, 이영희)"
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 버튼 */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>
                {loading
                  ? isEditMode
                    ? "수정 중..."
                    : "저장 중..."
                  : isEditMode
                  ? "수정"
                  : "저장"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
