"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { getMonthlyAttendance, getAttendanceStats } from "@/lib/attendance";
import type { AttendanceRecord, AttendanceStats } from "@/types/attendance";
import styles from "./page.module.css";

interface WeeklyData {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  records: AttendanceRecord[];
  totalHours: number;
  overtimeHours: number;
}

export default function AttendancePage() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyRecords, setMonthlyRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  // 데이터 로드
  useEffect(() => {
    if (user) {
      loadAttendanceData();
    }
  }, [user, currentMonth]);

  const loadAttendanceData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const [monthlyData, statsData] = await Promise.all([
        getMonthlyAttendance(
          user.id,
          currentMonth.getFullYear(),
          currentMonth.getMonth() + 1
        ),
        getAttendanceStats(
          user.id,
          currentMonth.getFullYear(),
          currentMonth.getMonth() + 1
        ),
      ]);

      setMonthlyRecords(monthlyData);
      setStats(statsData);
      processWeeklyData(monthlyData);
    } catch (error) {
      console.error("출근 데이터 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const processWeeklyData = (records: AttendanceRecord[]) => {
    const weeks: WeeklyData[] = [];
    const firstDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const lastDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    );

    const currentWeekStart = new Date(firstDay);
    let weekNumber = 1;

    while (currentWeekStart <= lastDay) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekRecords = records.filter((record) => {
        const recordDate = new Date(record.date);
        return recordDate >= currentWeekStart && recordDate <= weekEnd;
      });

      const totalHours = weekRecords.reduce(
        (sum, record) => sum + (record.workHours || 0),
        0
      );
      const overtimeHours = Math.max(0, totalHours - 40); // 주 40시간 기준

      weeks.push({
        weekNumber,
        startDate: new Date(currentWeekStart),
        endDate: new Date(weekEnd),
        records: weekRecords,
        totalHours,
        overtimeHours,
      });

      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      weekNumber++;
    }

    setWeeklyData(weeks);
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "-";
    return new Date(timeString).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    const dayName = dayNames[date.getDay()];
    return `${day} ${dayName}`;
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    const s = Math.floor(((hours - h) * 60 - m) * 60);
    return `${h}h ${m}m ${s}s`;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newMonth = new Date(currentMonth);
    if (direction === "prev") {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const toggleWeek = (weekNumber: number) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekNumber)) {
      newExpanded.delete(weekNumber);
    } else {
      newExpanded.add(weekNumber);
    }
    setExpandedWeeks(newExpanded);
  };

  const generateTimeline = (record: AttendanceRecord) => {
    if (!record.checkIn || !record.checkOut) return null;

    const checkInHour = new Date(record.checkIn).getHours();
    const checkOutHour = new Date(record.checkOut).getHours();
    const workHours = record.workHours || 0;

    return (
      <div className={styles.timeline}>
        <div className={styles.timelineBar}>
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className={styles.timelineHour}>
              {i >= checkInHour && i < checkOutHour ? (
                <div className={styles.workPeriod} />
              ) : (
                <div className={styles.nonWorkPeriod} />
              )}
            </div>
          ))}
        </div>
        <div className={styles.timelineLabels}>
          <span className={styles.workLabel}>출근</span>
          <span className={styles.breakLabel}>휴게</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <h1 className={styles.title}>근태현황</h1>
        <div className={styles.dateNavigation}>
          <button
            className={styles.navButton}
            onClick={() => navigateMonth("prev")}
          >
            &lt;
          </button>
          <span className={styles.currentMonth}>
            {currentMonth.getFullYear()}.
            {(currentMonth.getMonth() + 1).toString().padStart(2, "0")}
          </span>
          <button
            className={styles.navButton}
            onClick={() => navigateMonth("next")}
          >
            &gt;
          </button>
          <button className={styles.todayButton} onClick={goToToday}>
            오늘
          </button>
        </div>
        <button className={styles.downloadButton}>
          <span>↓ 목록 다운로드</span>
        </button>
      </div>

      {/* 직원 정보 */}
      <div className={styles.employeeInfo}>
        <span>정직원 10:00:59 ~ 18:00:59</span>
        <span className={styles.infoIcon}>i</span>
      </div>

      {/* 통계 카드 */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>이번주 누적</div>
          <div className={styles.statValue}>
            {formatHours(stats?.totalWorkHours || 0)}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>이번주 초과</div>
          <div className={styles.statValue}>{formatHours(0)}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>이번주 잔여</div>
          <div className={styles.statValue}>
            {formatHours(40 - (stats?.totalWorkHours || 0))}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>이번달 누적</div>
          <div className={styles.statValue}>
            {formatHours(stats?.totalWorkHours || 0)}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>이번달 연장</div>
          <div className={styles.statValue}>{formatHours(0)}</div>
        </div>
      </div>

      {/* 주차별 데이터 */}
      <div className={styles.weeklySection}>
        {weeklyData.map((week) => (
          <div key={week.weekNumber} className={styles.weekCard}>
            <div
              className={styles.weekHeader}
              onClick={() => toggleWeek(week.weekNumber)}
            >
              <div className={styles.weekTitle}>
                <span className={styles.weekIcon}>
                  {expandedWeeks.has(week.weekNumber) ? "▲" : "√"}
                </span>
                <span>{week.weekNumber}주차</span>
              </div>
              <div className={styles.weekSummary}>
                누적 근무시간 {formatHours(week.totalHours)} (초과 근무시간{" "}
                {formatHours(week.overtimeHours)})
              </div>
            </div>

            {expandedWeeks.has(week.weekNumber) && (
              <div className={styles.weekContent}>
                <table className={styles.attendanceTable}>
                  <thead>
                    <tr>
                      <th>일자</th>
                      <th>업무시작</th>
                      <th>업무종료</th>
                      <th>총 근무시간</th>
                      <th>근무시간 상세</th>
                      <th>승인요청내역</th>
                    </tr>
                  </thead>
                  <tbody>
                    {week.records.map((record) => (
                      <tr key={record.date}>
                        <td>{formatDate(record.date)}</td>
                        <td>
                          {formatTime(record.checkIn)}
                          <span className={styles.infoIcon}>i</span>
                        </td>
                        <td>
                          {formatTime(record.checkOut)}
                          <span className={styles.infoIcon}>i</span>
                        </td>
                        <td>{formatHours(record.workHours || 0)}</td>
                        <td>
                          기본 {formatHours(record.workHours || 0)}/연장 0h 0m
                          0s/야간 0h 0m 0s
                        </td>
                        <td>-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 타임라인 차트 */}
                {week.records.length > 0 && (
                  <div className={styles.timelineSection}>
                    {week.records.map((record) => (
                      <div key={record.date} className={styles.timelineRow}>
                        <div className={styles.timelineDate}>
                          {formatDate(record.date)}
                        </div>
                        {generateTimeline(record)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
