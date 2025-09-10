"use client";

import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/Navigation";
import ProfileAvatar from "@/components/ProfileAvatar";
import { getRecentPosts } from "@/lib/board";
import { checkIn, checkOut, getTodayAttendance } from "@/lib/attendance";
import { getRecentMeetingReservations } from "@/lib/meetingRooms";
import { getDepartmentColor } from "@/lib/utils";
import type { Attendance } from "@/types/attendance";
import type { MeetingReservation } from "@/lib/meetingRooms";
import { Clock, Mail, FileText, Search, ChevronRight } from "lucide-react";
import Link from "next/link";

interface DashboardData {
  todayEmails: number;
  pendingDocuments: number;
  workHours: string;
  clockInTime: string;
  clockOutTime: string;
  isClockedIn: boolean;
}

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  author: string;
  position: string;
  branch: string;
  team: string;
}

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [recentMeetingReservations, setRecentMeetingReservations] = useState<
    MeetingReservation[]
  >([]);
  const [meetingReservationsLoading, setMeetingReservationsLoading] =
    useState(true);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(
    null
  );
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 프리랜서 여부 확인
  const isFreelancer = user?.position === "프리랜서";

  const [dashboardData] = useState<DashboardData>({
    todayEmails: 0,
    pendingDocuments: 0,
    workHours: "6h 30m",
    clockInTime: "미등록",
    clockOutTime: "미등록",
    isClockedIn: false,
  });

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!user) {
      const sessionData = localStorage.getItem("nms-user-session");
      if (!sessionData) {
        router.replace("/auth/login");
        return;
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 오늘 출근 기록 가져오기
  useEffect(() => {
    const fetchTodayAttendance = async () => {
      if (!user) return;

      try {
        const attendance = await getTodayAttendance(user.id);
        setTodayAttendance(attendance);
      } catch (error) {
        console.error("오늘 출근 기록 조회 오류:", error);
        setMessage({
          type: "error",
          text: "출근 기록을 불러오는 중 오류가 발생했습니다.",
        });
      }
    };

    fetchTodayAttendance();
  }, [user]);

  // 메시지 자동 제거
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // 최근 게시글 가져오기
  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        setPostsLoading(true);
        console.log("메인 페이지: 최근 게시글 조회 시작...");

        const result = await getRecentPosts(5);
        console.log("메인 페이지: getRecentPosts 결과:", result);

        if (result.success && result.posts) {
          console.log("메인 페이지: 게시글 데이터:", result.posts);
          setRecentPosts(result.posts);
        } else {
          console.error("메인 페이지: 게시글 조회 실패:", result.error);
        }
      } catch (error) {
        console.error("메인 페이지: 게시글 조회 중 오류:", error);
      } finally {
        setPostsLoading(false);
      }
    };

    if (user) {
      console.log("메인 페이지: 사용자 확인됨, 게시글 조회 시작");
      fetchRecentPosts();
    } else {
      console.log("메인 페이지: 사용자 정보 없음");
    }
  }, [user]);

  // 최근 회의실 예약 가져오기
  useEffect(() => {
    const fetchRecentMeetingReservations = async () => {
      try {
        setMeetingReservationsLoading(true);
        const reservations = await getRecentMeetingReservations(3);
        setRecentMeetingReservations(reservations);
      } catch (error) {
        console.error("메인 페이지: 회의실 예약 조회 중 오류:", error);
      } finally {
        setMeetingReservationsLoading(false);
      }
    };

    if (user) {
      fetchRecentMeetingReservations();
    }
  }, [user]);

  // 카테고리별 게시글 필터링
  const filteredPosts = recentPosts.filter((post) => {
    if (selectedCategory === "전체") return true;

    switch (selectedCategory) {
      case "공지사항":
        return post.category === "공지사항";
      case "업무 공지":
        return post.category === "업무 공지";
      case "회사 알림":
        return post.category === "회사 알림";
      default:
        return true;
    }
  });

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    const weekday = weekdays[date.getDay()];
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    return `${year}년 ${month}월 ${day}일 (${weekday}) ${hours}:${minutes}:${seconds}`;
  };

  const handleCheckIn = async () => {
    if (!user) return;

    setAttendanceLoading(true);
    try {
      const result = await checkIn(user.id);

      if (result.success) {
        setTodayAttendance(result.data || null);
        setMessage({ type: "success", text: "출근이 완료되었습니다!" });
        setCurrentTime(new Date());
      } else {
        setMessage({
          type: "error",
          text: result.error || "출근 처리 중 오류가 발생했습니다.",
        });
      }
    } catch (error) {
      console.error("출근 처리 오류:", error);
      setMessage({ type: "error", text: "출근 처리 중 오류가 발생했습니다." });
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user) return;

    setAttendanceLoading(true);
    try {
      const result = await checkOut(user.id);

      if (result.success) {
        setTodayAttendance(result.data || null);
        setMessage({ type: "success", text: "퇴근이 완료되었습니다!" });
        setCurrentTime(new Date());
      } else {
        setMessage({
          type: "error",
          text: result.error || "퇴근 처리 중 오류가 발생했습니다.",
        });
      }
    } catch (error) {
      console.error("퇴근 처리 오류:", error);
      setMessage({ type: "error", text: "퇴근 처리 중 오류가 발생했습니다." });
    } finally {
      setAttendanceLoading(false);
    }
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로그인 페이지로 이동 중...</p>
        </div>
      </div>
    );
  }

  // 출근 상태에 따른 UI 데이터 계산
  const getAttendanceDisplayData = () => {
    if (!todayAttendance) {
      return {
        clockInTime: "미등록",
        clockOutTime: "미등록",
        workHours: "0h 0m",
        isClockedIn: false,
        canCheckIn: true,
        canCheckOut: false,
        status: "미출근",
        progressPercentage: 0,
        currentWorkHours: 0,
      };
    }

    const clockInTime = todayAttendance.check_in_time
      ? new Date(todayAttendance.check_in_time).toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "미등록";

    const clockOutTime = todayAttendance.check_out_time
      ? new Date(todayAttendance.check_out_time).toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "미등록";

    // 현재 근무시간 계산
    let currentWorkHours = 0;
    if (todayAttendance.work_hours) {
      // 퇴근한 경우
      currentWorkHours = todayAttendance.work_hours;
    } else if (todayAttendance.check_in_time) {
      // 출근했지만 퇴근하지 않은 경우 - 실시간 계산
      const checkInTime = new Date(todayAttendance.check_in_time);
      const now = new Date();
      currentWorkHours =
        (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    }

    const workHours = `${Math.floor(currentWorkHours)}h ${Math.round(
      (currentWorkHours % 1) * 60
    )}m`;

    // 진행률 계산 (9시간 기준)
    const progressPercentage = Math.min((currentWorkHours / 9) * 100, 100);

    const isClockedIn = !!todayAttendance.check_in_time;
    const isClockedOut = !!todayAttendance.check_out_time;

    return {
      clockInTime,
      clockOutTime,
      workHours,
      isClockedIn,
      canCheckIn: !isClockedIn,
      canCheckOut: isClockedIn && !isClockedOut,
      status:
        todayAttendance.status === "present"
          ? "정상 출근"
          : todayAttendance.status === "late"
          ? "지각"
          : todayAttendance.status === "early_leave"
          ? "조기 퇴근"
          : "결근",
      progressPercentage,
      currentWorkHours,
    };
  };

  const attendanceData = getAttendanceDisplayData();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* 메시지 표시 */}
      {message && (
        <div
          className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg ${
            message.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽 컬럼 - 사용자 정보 및 근태관리 */}
          <div className="space-y-6">
            {/* 사용자 프로필 카드 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-4">
                <ProfileAvatar user={user} size="lg" showStatus={true} />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {user.name} {user.position || "사원"}
                  </h3>
                  <p className="text-sm text-gray-600">{user.branch}</p>
                  {user.team && (
                    <p className="text-xs text-gray-500 mt-1">{user.team}</p>
                  )}
                </div>
                <Link
                  href="/profile"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  프로필
                </Link>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>오늘 온 메일</span>
                  <span className="font-semibold text-gray-900">
                    {dashboardData.todayEmails}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>결재할 문서</span>
                  <span className="font-semibold text-gray-900">
                    {dashboardData.pendingDocuments}
                  </span>
                </div>
              </div>
            </div>

            {/* 근태관리 카드 - 프리랜서가 아닌 경우에만 표시 */}
            {!isFreelancer && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  근태관리
                </h3>

                <div className="text-center mb-6">
                  <p className="text-sm text-gray-600 mb-2">
                    {formatDate(currentTime)}
                  </p>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {attendanceData.workHours}
                  </div>
                  <div className="text-sm text-gray-500 mb-2">
                    상태: {attendanceData.status}
                  </div>

                  {/* 근무 시간 진행률 */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        attendanceData.progressPercentage >= 100
                          ? "bg-green-500"
                          : attendanceData.progressPercentage >= 80
                          ? "bg-blue-500"
                          : "bg-orange-500"
                      }`}
                      style={{ width: `${attendanceData.progressPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0h</span>
                    <span>9h (목표)</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">출근시간</span>
                    <span className="font-medium">
                      {attendanceData.clockInTime}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">퇴근시간</span>
                    <span className="font-medium">
                      {attendanceData.clockOutTime}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleCheckIn}
                    disabled={!attendanceData.canCheckIn || attendanceLoading}
                    className="bg-blue-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {attendanceLoading ? "처리 중..." : "출근하기"}
                  </button>
                  <button
                    onClick={handleCheckOut}
                    disabled={!attendanceData.canCheckOut || attendanceLoading}
                    className="bg-gray-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {attendanceLoading ? "처리 중..." : "퇴근하기"}
                  </button>
                </div>

                <Link
                  href="/attendance"
                  className="w-full mt-3 bg-gray-100 text-gray-700 py-2 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors text-center block"
                >
                  출근관리 상세보기
                </Link>
              </div>
            )}

            {/* 진행중인 설문 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                진행중인 설문
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="이름/아이디/부서/직위/직책/..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* 중앙 컬럼 - 전사게시판 및 캘린더 */}
          <div className="space-y-6">
            {/* 전사게시판 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    전사게시판 최근글
                  </h3>
                  <div className="flex items-center space-x-3">
                    <Link
                      href="/board"
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                    >
                      전체보기 →
                    </Link>
                  </div>
                </div>
              </div>

              {/* 탭 네비게이션 */}
              <div className="flex border-b border-gray-100">
                {["전체", "공지사항", "업무 공지", "회사 알림"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedCategory(tab)}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                      selectedCategory === tab
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* 게시글 목록 */}
              <div className="p-6 space-y-3">
                {postsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500 text-sm">
                      게시글을 불러오는 중...
                    </p>
                  </div>
                ) : filteredPosts.length > 0 ? (
                  filteredPosts.map((post, index) => {
                    const date = new Date(post.created_at);
                    const formattedDate = `${date.getFullYear()}-${String(
                      date.getMonth() + 1
                    ).padStart(2, "0")}-${String(date.getDate()).padStart(
                      2,
                      "0"
                    )} ${String(date.getHours()).padStart(2, "0")}:${String(
                      date.getMinutes()
                    ).padStart(2, "0")}`;

                    return (
                      <Link key={post.id} href={`/board/${post.id}`}>
                        <div className="group cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-relaxed mb-2">
                                {post.title}
                              </h4>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span className="font-medium text-gray-700">
                                  {post.author}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span>{formattedDate}</span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 ml-2 mt-1" />
                          </div>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">
                      {selectedCategory === "전체"
                        ? "등록된 게시글이 없습니다."
                        : `${selectedCategory} 카테고리의 게시글이 없습니다.`}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      첫 번째 게시글을 작성해보세요!
                    </p>
                  </div>
                )}
              </div>

              {/* 더보기 버튼 */}
              {filteredPosts.length > 0 && (
                <div className="p-4 border-t border-gray-100">
                  <Link
                    href="/board"
                    className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>더 많은 게시글 보기</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>

            {/* 캘린더 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">2025.08</h3>
                <div className="flex space-x-1">
                  <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                    ‹
                  </button>
                  <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                    ›
                  </button>
                </div>
              </div>

              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-gray-500 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* 캘린더 그리드 */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }, (_, i) => {
                  const day = i - 3; // 7월 27일부터 시작
                  const isCurrentMonth = day > 0 && day <= 31;
                  const isToday = day === 27; // 8월 27일이 오늘
                  const hasEvent = [
                    6, 7, 8, 13, 14, 18, 19, 20, 21, 22, 25, 28, 29,
                  ].includes(day);
                  const isHoliday = day === 15;

                  return (
                    <div
                      key={i}
                      className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium cursor-pointer transition-colors ${
                        isToday
                          ? "bg-blue-500 text-white"
                          : isHoliday
                          ? "text-red-500"
                          : isCurrentMonth
                          ? "text-gray-900 hover:bg-gray-100"
                          : "text-gray-300"
                      }`}
                    >
                      {isCurrentMonth && (
                        <div className="text-center">
                          <div>{day}</div>
                          {hasEvent && (
                            <div className="w-1 h-1 bg-blue-400 rounded-full mx-auto mt-1"></div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 오른쪽 컬럼 - 명예의 전당 및 알림 */}
          <div className="space-y-6">
            {/* 명예의 전당 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                명예의 전당
              </h3>

              <div className="space-y-4">
                {/* 1위 */}
                <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    1st
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">장은혜</div>
                    <div className="text-xs text-gray-600">
                      한평생교육지원센터 3-1팀
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-yellow-600">133,470,000</div>
                    <div className="text-xs text-gray-500">점수</div>
                  </div>
                </div>

                {/* 2위 */}
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    2nd
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      강도연 주임
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-600">106,950,000</div>
                    <div className="text-xs text-gray-500">점수</div>
                  </div>
                </div>

                {/* 3위 */}
                <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    3rd
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      이규준 이사
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-orange-600">104,760,000</div>
                    <div className="text-xs text-gray-500">점수</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 최근 알림 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  회의 알림
                </h3>
                <Link
                  href="/meeting-rooms"
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  전체보기
                </Link>
              </div>

              <div className="space-y-4">
                {meetingReservationsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-500 text-sm">
                      알림을 불러오는 중...
                    </p>
                  </div>
                ) : (
                  <>
                    {/* 회의실 예약 알림 */}
                    {recentMeetingReservations.length > 0 ? (
                      recentMeetingReservations.map((reservation) => {
                        const startTime = new Date(reservation.start_time);
                        const endTime = new Date(reservation.end_time);
                        const timeString = `${startTime
                          .getHours()
                          .toString()
                          .padStart(2, "0")}:${startTime
                          .getMinutes()
                          .toString()
                          .padStart(2, "0")} - ${endTime
                          .getHours()
                          .toString()
                          .padStart(2, "0")}:${endTime
                          .getMinutes()
                          .toString()
                          .padStart(2, "0")}`;
                        const dateString = `${
                          startTime.getMonth() + 1
                        }-${startTime
                          .getDate()
                          .toString()
                          .padStart(2, "0")} ${timeString}`;

                        const colorClass = getDepartmentColor(
                          reservation.meeting_rooms.name
                        );

                        return (
                          <div
                            key={reservation.id}
                            className="flex items-start space-x-3 group cursor-pointer"
                          >
                            <div
                              className={`w-8 h-8 ${colorClass} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                            >
                              📅
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                [회의 예약] {reservation.title} -{" "}
                                {reservation.meeting_rooms.name}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-gray-500">
                                  {reservation.meeting_rooms.location}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {dateString}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          📅
                        </div>
                        <p className="text-sm text-gray-500">
                          예정된 회의실 예약이 없습니다
                        </p>
                      </div>
                    )}

                    {/* 기존 알림들 */}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
