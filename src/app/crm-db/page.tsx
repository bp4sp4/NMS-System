"use client";

import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Navigation";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";

interface CRMDBData {
  id: string;
  branch: string;
  team: string;
  manager: string;
  customerType: string;
  courseType: string;
  course: string;
  institution: string;
  customerName: string;
  contact: string;
  education: string;
  region: string;
  status: string;
  registrationDate: string;
  lastContactDate: string;
  notes: string;
  paymentDate: string;
  paymentAmount: number;
  commission: number;
  // 학점은행제 계약고객용 필드들
  subjectTheoryCount: number;
  subjectFaceToFaceCount: number;
  subjectPracticeCount: number;
  inflowPath: string;
}

export default function CRMDBPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [filters, setFilters] = useState({
    year: "2025",
    month: "전체",
    customerType: "전체",
    courseType: "전체",
  });

  // 업셀링 상태
  const [isUpsellingOpen, setIsUpsellingOpen] = useState(false);
  const [selectedUpsellingCourse, setSelectedUpsellingCourse] = useState("");

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [crmData, setCrmData] = useState<CRMDBData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // 카톡 발송 내역 데이터
  const [kakaoHistory, setKakaoHistory] = useState([
    { id: 1, date: "2025.00.00", content: "25년 3분기 학습자등록 안내" },
    { id: 2, date: "2025.00.00", content: "민간자격증 안내" },
    { id: 3, date: "2025.00.00", content: "25년 4분기 학점인정신청 안내" },
    { id: 4, date: "2025.00.00", content: "사회복지사 자격증 과정 안내" },
    { id: 5, date: "2025.00.00", content: "보육교사 자격증 과정 안내" },
    { id: 6, date: "2025.00.00", content: "한국어교원 자격증 과정 안내" },
    { id: 7, date: "2025.00.00", content: "학점은행제 안내" },
    { id: 8, date: "2025.00.00", content: "유학 프로그램 안내" },
    { id: 9, date: "2025.00.00", content: "평생교육사 자격증 과정 안내" },
    { id: 10, date: "2025.00.00", content: "아동학사 과정 안내" },
    { id: 11, date: "2025.00.00", content: "사회복지학사 과정 안내" },
    { id: 12, date: "2025.00.00", content: "아동전문학사 과정 안내" },
    { id: 13, date: "2025.00.00", content: "사회복지전문학사 과정 안내" },
    { id: 14, date: "2025.00.00", content: "영어연수 프로그램 안내" },
    { id: 15, date: "2025.00.00", content: "일본어연수 프로그램 안내" },
  ]);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [crmCurrentPage, setCrmCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 데이터베이스에서 CRM 데이터 가져오기
  const fetchCRMData = useCallback(async () => {
    if (!user?.name) return;

    setIsLoadingData(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("manager", user.name)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("CRM 데이터 가져오기 오류:", error);
        return;
      }

      // 데이터베이스 형식을 프론트엔드 형식으로 변환
      const convertedData: CRMDBData[] =
        data?.map((item) => ({
          id: item.id,
          branch: item.branch,
          team: item.team,
          manager: item.manager,
          customerType: item.customer_type || "가망고객",
          courseType: item.course_type,
          course: item.course || "",
          institution: item.institution,
          customerName: item.customer_name,
          contact: item.contact,
          education: item.education,
          region: item.region,
          status: item.status,
          registrationDate: item.created_at?.split("T")[0] || "",
          lastContactDate: item.updated_at?.split("T")[0] || "",
          notes: "",
          paymentDate: item.payment_date || "",
          paymentAmount: item.payment_amount || 0,
          commission: item.commission || 0,
          // 학점은행제 계약고객용 필드들
          subjectTheoryCount: item.subject_theory_count || 0,
          subjectFaceToFaceCount: item.subject_face_to_face_count || 0,
          subjectPracticeCount: item.subject_practice_count || 0,
          inflowPath: item.inflow_path || "기타",
        })) || [];

      setCrmData(convertedData);
    } catch (error) {
      console.error("CRM 데이터 가져오기 오류:", error);
    } finally {
      setIsLoadingData(false);
    }
  }, [user?.name]);

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    if (user?.name) {
      fetchCRMData();
    }
  }, [fetchCRMData]);

  // 인증 상태 확인 및 리다이렉트
  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  // 사용자별 데이터 필터링
  const userCRMData = crmData.filter((item) => item.manager === user?.name);

  // 업셀링 과정 목록
  const upsellingCourses = [
    "사회복지사2급",
    "보육교사2급",
    "평생교육사2급",
    "한국어교원2급",
    "아동학사",
    "아동전문학사",
    "사회복지학사",
    "사회복지전문학사",
  ];

  // 업셀링 과정 선택 처리
  const handleUpsellingCourseSelect = (course: string) => {
    setSelectedUpsellingCourse(course);
    setIsUpsellingOpen(false);
  };

  // 필터링된 데이터
  const filteredCRMData = userCRMData.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      item.customerName.toLowerCase().includes(searchLower) ||
      item.contact.includes(searchLower) ||
      item.institution.toLowerCase().includes(searchLower) ||
      item.courseType.toLowerCase().includes(searchLower);

    const matchesCustomerType =
      filters.customerType === "전체" ||
      item.customerType === filters.customerType;

    const matchesCourseType =
      filters.courseType === "전체" || item.courseType === filters.courseType;

    // 업셀링 필터링: 선택된 과정을 제외한 계약고객만 표시
    const matchesUpselling = selectedUpsellingCourse
      ? item.customerType === "계약고객" &&
        item.course !== selectedUpsellingCourse
      : true;

    return (
      matchesSearch &&
      matchesCustomerType &&
      matchesCourseType &&
      matchesUpselling
    );
  });

  // 통계 계산
  const totalCustomers = userCRMData.length;
  const contractCustomers = userCRMData.filter(
    (item) => item.customerType === "계약고객"
  ).length;
  const prospectiveCustomers = userCRMData.filter(
    (item) => item.customerType === "가망고객"
  ).length;

  const totalPaymentAmount = userCRMData.reduce(
    (sum, item) => sum + (item.paymentAmount || 0),
    0
  );
  const totalCommission = userCRMData.reduce(
    (sum, item) => sum + (item.commission || 0),
    0
  );

  // 전체 선택 처리
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      setSelectedItems(filteredCRMData.map((item) => item.id));
      setSelectAll(true);
    }
  };

  // 개별 선택 처리
  const handleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((item) => item !== id));
      setSelectAll(false);
    } else {
      const newSelectedItems = [...selectedItems, id];
      setSelectedItems(newSelectedItems);
      if (newSelectedItems.length === filteredCRMData.length) {
        setSelectAll(true);
      }
    }
  };

  // 카톡 발송 내역 페이지네이션 계산
  const totalPages = Math.ceil(kakaoHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentKakaoItems = kakaoHistory.slice(startIndex, endIndex);

  // CRM 데이터 페이지네이션 계산
  const crmTotalPages = Math.ceil(filteredCRMData.length / itemsPerPage);
  const crmStartIndex = (crmCurrentPage - 1) * itemsPerPage;
  const crmEndIndex = crmStartIndex + itemsPerPage;
  const currentCrmItems = filteredCRMData.slice(crmStartIndex, crmEndIndex);

  // 페이지 변경 함수
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCrmPageChange = (page: number) => {
    setCrmCurrentPage(page);
  };

  // 페이지네이션 번호 생성
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisiblePages = 10;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 5) {
        for (let i = 1; i <= maxVisiblePages; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 4) {
        for (let i = totalPages - maxVisiblePages + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 4; i <= currentPage + 5; i++) {
          pages.push(i);
        }
      }
    }

    return pages;
  };

  // 일괄 삭제 기능
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      alert("삭제할 항목을 선택해주세요.");
      return;
    }

    if (
      !confirm(
        `선택된 ${selectedItems.length}개의 고객 정보를 삭제하시겠습니까?`
      )
    )
      return;

    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .in("id", selectedItems);

      if (error) {
        console.error("CRM 데이터 일괄 삭제 오류:", error);
        alert("데이터 삭제에 실패했습니다.");
        return;
      }

      await fetchCRMData();
      setSelectedItems([]);
      setSelectAll(false);
      alert("선택된 고객 정보가 성공적으로 삭제되었습니다.");
    } catch (error) {
      console.error("CRM 데이터 일괄 삭제 오류:", error);
      alert("데이터 삭제에 실패했습니다.");
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Header />

      <div className={styles.layout}>
        {/* 왼쪽 패널 */}
        <div className={styles.leftPanel}>
          {/* 담당자 정보 */}
          <div className={styles.agentInfo}>
            <div className={styles.agentCard}>
              <div className={styles.agentDetails}>
                <span className={styles.agentBranch}>{user.branch}</span>
                <div className={styles.divider}></div>
                <span className={styles.agentTeam}>{user.team}</span>
                <div className={styles.divider}></div>
                <span className={styles.agentName}>{user.name}</span>
              </div>
            </div>
          </div>

          {/* 카톡 발송 내역 */}
          <div className={styles.kakaoSection}>
            <h3 className={styles.kakaoTitle}>카톡 발송 내역</h3>
            <div className={styles.kakaoList}>
              {currentKakaoItems.map((item) => (
                <div key={item.id} className={styles.kakaoItem}>
                  <div className={styles.kakaoDate}>{item.date}</div>
                  <div className={styles.kakaoContent}>{item.content}</div>
                </div>
              ))}
            </div>
            <div className={styles.pagination}>
              <button
                className={styles.paginationButton}
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                |◀
              </button>
              <button
                className={styles.paginationButton}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                &lt;
              </button>
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  className={`${styles.paginationButton} ${
                    currentPage === page ? styles.paginationButtonActive : ""
                  }`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className={styles.paginationButton}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                &gt;
              </button>
              <button
                className={styles.paginationButton}
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                ▶|
              </button>
            </div>
          </div>
        </div>

        {/* 오른쪽 메인 콘텐츠 */}
        <div className={styles.mainContent}>
          {/* 필터 및 액션 */}
          <div className={styles.filterSection}>
            <div className={styles.filterControls}>
              <select
                className={styles.filterSelect}
                value={filters.year}
                onChange={(e) =>
                  setFilters({ ...filters, year: e.target.value })
                }
              >
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
              <select
                className={styles.filterSelect}
                value={filters.month}
                onChange={(e) =>
                  setFilters({ ...filters, month: e.target.value })
                }
              >
                <option value="전체">전체</option>
                <option value="1월">1월</option>
                <option value="2월">2월</option>
                <option value="3월">3월</option>
                <option value="4월">4월</option>
                <option value="5월">5월</option>
                <option value="6월">6월</option>
                <option value="7월">7월</option>
                <option value="8월">8월</option>
                <option value="9월">9월</option>
                <option value="10월">10월</option>
                <option value="11월">11월</option>
                <option value="12월">12월</option>
              </select>
              <select
                className={styles.filterSelect}
                value={filters.customerType}
                onChange={(e) =>
                  setFilters({ ...filters, customerType: e.target.value })
                }
              >
                <option value="전체">전체 고객</option>
                <option value="계약고객">계약고객</option>
                <option value="가망고객">가망고객</option>
              </select>
              <select
                className={styles.filterSelect}
                value={filters.courseType}
                onChange={(e) =>
                  setFilters({ ...filters, courseType: e.target.value })
                }
              >
                <option value="전체">전체 과정</option>
                <option value="학점은행제">학점은행제</option>
                <option value="민간 자격증">민간 자격증</option>
                <option value="유학">유학</option>
              </select>

              {/* 업셀링 버튼 */}
              <div className={styles.upsellingContainer}>
                <button
                  className={styles.upsellingButton}
                  onClick={() => setIsUpsellingOpen(!isUpsellingOpen)}
                >
                  업셀링
                </button>
                {isUpsellingOpen && (
                  <div className={styles.upsellingDropdown}>
                    {upsellingCourses.map((course) => (
                      <div
                        key={course}
                        className={styles.upsellingOption}
                        onClick={() => handleUpsellingCourseSelect(course)}
                      >
                        {course}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 선택된 업셀링 과정 표시 */}
              {selectedUpsellingCourse && (
                <div className={styles.selectedUpselling}>
                  <span className={styles.selectedUpsellingText}>
                    {selectedUpsellingCourse} 제외
                  </span>
                  <button
                    className={styles.clearUpsellingButton}
                    onClick={() => setSelectedUpsellingCourse("")}
                  >
                    ✕
                  </button>
                </div>
              )}
              <input
                type="text"
                placeholder="고객명, 연락처, 기관명으로 검색..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className={styles.actionButtons}>
              <button
                onClick={() => router.push("/kakao-send")}
                className={styles.kakaoSendButton}
              >
                카톡 발송
              </button>
              {selectedItems.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className={styles.deleteButton}
                >
                  선택 삭제 ({selectedItems.length})
                </button>
              )}
            </div>
          </div>

          {/* 데이터 테이블 */}
          <div className={styles.tableContainer}>
            {isLoadingData ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <div className={styles.loadingText}>
                  데이터를 불러오는 중...
                </div>
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead className={styles.tableHeader}>
                    <tr>
                      <th className={styles.tableHeaderCell}>
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          className={styles.checkbox}
                        />
                      </th>
                      <th className={styles.tableHeaderCell}>번호</th>
                      <th className={styles.tableHeaderCell}>지점</th>
                      <th className={styles.tableHeaderCell}>팀</th>
                      <th className={styles.tableHeaderCell}>담당자</th>
                      <th className={styles.tableHeaderCell}>고객분류</th>
                      <th className={styles.tableHeaderCell}>과정분류</th>
                      <th className={styles.tableHeaderCell}>과정</th>
                      <th className={styles.tableHeaderCell}>기관</th>
                      <th className={styles.tableHeaderCell}>고객명</th>
                      <th className={styles.tableHeaderCell}>연락처</th>
                      <th className={styles.tableHeaderCell}>학력</th>
                      <th className={styles.tableHeaderCell}>지역</th>
                      <th className={styles.tableHeaderCell}>유입경로</th>
                      <th className={styles.tableHeaderCell}>과목분류</th>
                      <th className={styles.tableHeaderCell}>결제일</th>
                      <th className={styles.tableHeaderCell}>금액/수당</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tableBody}>
                    {currentCrmItems.map((item, index) => (
                      <tr
                        key={item.id}
                        className={
                          item.customerType === "계약고객"
                            ? styles.contractCustomerRow
                            : styles.prospectiveCustomerRow
                        }
                      >
                        <td className={styles.tableCell}>
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={() => handleSelectItem(item.id)}
                            className={styles.checkbox}
                          />
                        </td>
                        <td className={styles.tableCell}>
                          {crmStartIndex + index + 1}
                        </td>
                        <td className={styles.tableCell}>{item.branch}</td>
                        <td className={styles.tableCell}>{item.team}</td>
                        <td className={styles.tableCell}>{item.manager}</td>
                        <td className={styles.tableCell}>
                          <span
                            className={
                              item.customerType === "계약고객"
                                ? styles.contractCustomerType
                                : styles.prospectiveCustomerType
                            }
                          >
                            {item.customerType}
                          </span>
                        </td>
                        <td className={styles.tableCell}>{item.courseType}</td>
                        <td className={styles.tableCell}>
                          {item.course || "미선택"}
                        </td>
                        <td className={styles.tableCell}>{item.institution}</td>
                        <td className={styles.tableCell}>
                          {item.customerName}
                        </td>
                        <td className={styles.tableCell}>{item.contact}</td>
                        <td className={styles.tableCell}>{item.education}</td>
                        <td className={styles.tableCell}>{item.region}</td>
                        <td className={styles.tableCell}>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {item.inflowPath}
                          </span>
                        </td>
                        <td className={styles.tableCell}>
                          {item.courseType === "학점은행제" &&
                          item.customerType === "계약고객" ? (
                            <div className="space-y-1">
                              <div className="text-xs">
                                이론: {item.subjectTheoryCount}
                              </div>
                              <div className="text-xs">
                                대면: {item.subjectFaceToFaceCount}
                              </div>
                              <div className="text-xs">
                                실습: {item.subjectPracticeCount}
                              </div>
                              <div className="text-xs font-semibold text-blue-600">
                                총:{" "}
                                {item.subjectTheoryCount +
                                  item.subjectFaceToFaceCount +
                                  item.subjectPracticeCount}
                              </div>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className={styles.tableCell}>
                          {item.paymentDate || "-"}
                        </td>
                        <td className={styles.tableCell}>
                          <div className={styles.paymentInfo}>
                            <div className={styles.paymentAmount}>
                              {item.paymentAmount
                                ? `${item.paymentAmount.toLocaleString()}원`
                                : "-"}
                            </div>
                            <div className={styles.commissionAmount}>
                              {item.commission
                                ? `${item.commission.toLocaleString()}원`
                                : "-"}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* CRM 데이터 페이지네이션 */}
          {!isLoadingData &&
            filteredCRMData.length > 0 &&
            crmTotalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.paginationButton}
                  onClick={() => handleCrmPageChange(1)}
                  disabled={crmCurrentPage === 1}
                >
                  |◀
                </button>
                <button
                  className={styles.paginationButton}
                  onClick={() => handleCrmPageChange(crmCurrentPage - 1)}
                  disabled={crmCurrentPage === 1}
                >
                  &lt;
                </button>
                {Array.from({ length: crmTotalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      className={`${styles.paginationButton} ${
                        crmCurrentPage === page
                          ? styles.paginationButtonActive
                          : ""
                      }`}
                      onClick={() => handleCrmPageChange(page)}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  className={styles.paginationButton}
                  onClick={() => handleCrmPageChange(crmCurrentPage + 1)}
                  disabled={crmCurrentPage === crmTotalPages}
                >
                  &gt;
                </button>
                <button
                  className={styles.paginationButton}
                  onClick={() => handleCrmPageChange(crmTotalPages)}
                  disabled={crmCurrentPage === crmTotalPages}
                >
                  ▶|
                </button>
              </div>
            )}

          {/* 데이터가 없을 때 */}
          {!isLoadingData && filteredCRMData.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📊</div>
              <div className={styles.emptyTitle}>데이터가 없습니다</div>
              <div className={styles.emptyDescription}>
                검색 조건에 맞는 고객 데이터가 없습니다.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
