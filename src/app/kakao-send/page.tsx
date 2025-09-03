"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";

interface CRMData {
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
}

export default function KakaoSendPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [crmData, setCrmData] = useState<CRMData[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [dispatchTargets, setDispatchTargets] = useState<CRMData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dispatchSearchTerm, setDispatchSearchTerm] = useState("");

  // CRM 데이터 가져오기
  useEffect(() => {
    if (user) {
      fetchCRMData();
    }
  }, [user]);

  const fetchCRMData = async () => {
    if (!user?.name) return;

    try {
      setIsLoading(true);
      console.log("사용자 이름:", user?.name);

      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("manager", user.name)
        .order("created_at", { ascending: false });

      console.log("Supabase 응답:", { data, error });

      if (error) {
        console.error("Supabase 오류:", error);
        throw error;
      }

      // 데이터베이스 형식을 프론트엔드 형식으로 변환
      const convertedData: CRMData[] =
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
        })) || [];

      setCrmData(convertedData);
      console.log("설정된 CRM 데이터:", convertedData);
    } catch (error) {
      console.error("CRM 데이터 가져오기 실패:", error);
      console.error("오류 상세:", JSON.stringify(error, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  // 고객 선택/해제
  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(customerId)
        ? prev.filter((id) => id !== customerId)
        : [...prev, customerId]
    );
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedCustomers.length === crmData.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(crmData.map((customer) => customer.id));
    }
  };

  // 발송 대상 추가
  const handleAddToDispatch = () => {
    const selectedCustomerData = crmData.filter((customer) =>
      selectedCustomers.includes(customer.id)
    );
    setDispatchTargets((prev) => [...prev, ...selectedCustomerData]);
    setSelectedCustomers([]);
  };

  // 발송 대상 삭제
  const handleRemoveFromDispatch = () => {
    setDispatchTargets([]);
  };

  // 발송 대상에서 개별 삭제
  const handleRemoveDispatchTarget = (customerId: string) => {
    setDispatchTargets((prev) =>
      prev.filter((customer) => customer.id !== customerId)
    );
  };

  const handleNext = () => {
    if (dispatchTargets.length === 0) {
      alert("발송할 고객을 선택해주세요.");
      return;
    }

    // 선택된 고객 데이터를 localStorage에 저장
    const customerData = dispatchTargets.map((customer) => ({
      id: customer.id,
      name: customer.customerName,
      phone: customer.contact,
      type: customer.customerType,
      course: customer.course,
    }));

    localStorage.setItem("selectedCustomers", JSON.stringify(customerData));
    router.push("/kakao-send/message");
  };

  // 검색 필터링
  const filteredCustomers = crmData.filter(
    (customer) =>
      customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contact.includes(searchTerm) ||
      customer.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDispatchTargets = dispatchTargets.filter(
    (customer) =>
      customer.customerName
        .toLowerCase()
        .includes(dispatchSearchTerm.toLowerCase()) ||
      customer.contact.includes(dispatchSearchTerm) ||
      customer.course.toLowerCase().includes(dispatchSearchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>로그인이 필요합니다.</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <button
            onClick={() => router.push("/crm-db")}
            className={styles.backButton}
          >
            ← 뒤로가기
          </button>
          <h1 className={styles.title}>메시지 발송</h1>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className={styles.mainContent}>
        <div className={styles.layout}>
          {/* 왼쪽: 고객 명단 */}
          <div className={styles.customerSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>01. 고객 명단</h2>
              <div className={styles.customerCount}>
                고객 : {crmData.length}명
              </div>
            </div>

            <div className={styles.customerControls}>
              <div className={styles.searchBox}>
                <input
                  type="text"
                  placeholder="이름을 입력하세요."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
                <button className={styles.searchButton}>검색</button>
              </div>

              <div className={styles.actionButtons}>
                <button className={styles.actionButton}>삭제</button>
                <button className={styles.actionButton}>수정</button>
              </div>
            </div>

            <div className={styles.customerList}>
              <div className={styles.tableHeader}>
                <input
                  type="checkbox"
                  checked={
                    selectedCustomers.length === crmData.length &&
                    crmData.length > 0
                  }
                  onChange={handleSelectAll}
                />
                <span>이름</span>
                <span>연락처</span>
                <span>고객유형</span>
                <span>과정</span>
                <span>등록일</span>
              </div>

              {isLoading ? (
                <div className={styles.loading}>로딩 중...</div>
              ) : (
                filteredCustomers.map((customer) => (
                  <div key={customer.id} className={styles.customerRow}>
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(customer.id)}
                      onChange={() => handleCustomerSelect(customer.id)}
                    />
                    <span className={styles.customerName}>
                      {customer.customerName}
                    </span>
                    <span className={styles.customerContact}>
                      {customer.contact}
                    </span>
                    <span
                      className={`${styles.customerType} ${
                        customer.customerType === "계약고객"
                          ? styles.contractCustomer
                          : ""
                      }`}
                    >
                      {customer.customerType}
                    </span>
                    <span className={styles.customerCourse}>
                      {customer.course}
                    </span>
                    <span className={styles.customerDate}>
                      {customer.registrationDate}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 중앙: 액션 버튼 */}
          <div className={styles.actionSection}>
            <button
              onClick={handleAddToDispatch}
              disabled={selectedCustomers.length === 0}
              className={styles.addButton}
            >
              <span className={styles.buttonIcon}>→</span>
              <span className={styles.buttonText}>추가</span>
            </button>
            {dispatchTargets.length > 0 && (
              <button
                onClick={handleRemoveFromDispatch}
                className={styles.removeButton}
              >
                <span className={styles.buttonIcon}>←</span>
                <span className={styles.buttonText}>삭제</span>
              </button>
            )}
          </div>

          {/* 오른쪽: 발송 대상 */}
          <div className={styles.dispatchSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>02. 발송 대상 체크</h2>
            </div>
            <div className={styles.dispatchControls}>
              <div className={styles.dispatchCount}>
                발송대상 : {dispatchTargets.length}명
              </div>

              <div className={styles.searchBox}>
                <input
                  type="text"
                  placeholder="이름을 입력하세요."
                  value={dispatchSearchTerm}
                  onChange={(e) => setDispatchSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
                <button className={styles.searchButton}>검색</button>
              </div>
            </div>

            <div className={styles.dispatchList}>
              <div className={styles.tableHeader}>
                <span>선택</span>
                <span>이름</span>
                <span>연락처</span>
                <span>고객유형</span>
                <span>과정</span>
              </div>

              {filteredDispatchTargets.map((customer) => (
                <div key={customer.id} className={styles.dispatchRow}>
                  <input type="checkbox" checked={true} readOnly />
                  <span className={styles.customerName}>
                    {customer.customerName}
                  </span>
                  <span className={styles.customerContact}>
                    {customer.contact}
                  </span>
                  <span
                    className={`${styles.customerType} ${
                      customer.customerType === "계약고객"
                        ? styles.contractCustomer
                        : ""
                    }`}
                  >
                    {customer.customerType}
                  </span>
                  <span className={styles.customerCourse}>
                    {customer.course}
                  </span>
                  <button
                    onClick={() => handleRemoveDispatchTarget(customer.id)}
                    className={styles.removeTargetButton}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className={styles.footer}>
        <button className={styles.nextButton} onClick={handleNext}>
          다음 →
        </button>
      </div>
    </div>
  );
}
