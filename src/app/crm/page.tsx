"use client";

import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Navigation";
import { supabase } from "@/lib/supabase";

interface CRMData {
  id: string;
  branch: string;
  team: string;
  manager: string;
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

export default function CRMPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [filters, setFilters] = useState({
    year: "2025",
    month: "전체",
  });
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    courseType: "학점은행제",
    course: "사회복지사2급",
    institution: "한평생학점은행",
    customerName: "",
    contact: "",
    education: "고등학교 졸업",
    region: "서울",
    subRegion: "도봉구",
    paymentDate: "",
    paymentAmount: "",
  });

  const [crmData, setCrmData] = useState<CRMData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 데이터베이스에서 CRM 데이터 가져오기
  const fetchCRMData = useCallback(async () => {
    if (!user?.name) return;

    setIsLoading(true);
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
      const convertedData: CRMData[] =
        data?.map((item) => ({
          id: item.id,
          branch: item.branch,
          team: item.team,
          manager: item.manager,
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
    } catch (error) {
      console.error("CRM 데이터 가져오기 오류:", error);
    } finally {
      setIsLoading(false);
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
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  // 기관별 수당 정보
  const commissionRates = [
    {
      courseType: "학점은행제",
      institution: "한평생학점은행",
      baseAmount: 600000,
      commission: 140000,
    },
    {
      courseType: "학점은행제",
      institution: "올티칭학점은행",
      baseAmount: 600000,
      commission: 120000,
    },
    {
      courseType: "학점은행제",
      institution: "서울사이버평생교육",
      baseAmount: 600000,
      commission: 140000,
    },
    {
      courseType: "학점은행제",
      institution: "드림원격평생교육원",
      baseAmount: 600000,
      commission: 115000,
    },
    {
      courseType: "민간 자격증",
      institution: "한평생직업훈련",
      baseAmount: 500000,
      commission: 120000,
    },
    {
      courseType: "유학",
      institution: "감자유학",
      baseAmount: 800000,
      commission: 200000,
    },
  ];

  // 수당 계산 함수 (결제금액에 따라 계산)
  const calculateCommission = (
    courseType: string,
    institution: string,
    amount: number
  ) => {
    const rate = commissionRates.find(
      (r) => r.courseType === courseType && r.institution === institution
    );

    if (!rate) return 0;

    // 기본 수당 비율 계산 (기본금액 대비 수당 비율)
    const commissionRate = rate.commission / rate.baseAmount;

    // 실제 결제금액에 따른 수당 계산
    return Math.round(amount * commissionRate);
  };

  // 실시간 수당 계산
  const calculatedCommission = calculateCommission(
    formData.courseType,
    formData.institution,
    parseInt(formData.paymentAmount.replace(/,/g, "")) || 0
  );

  // 과정분류별 기관 목록
  const getInstitutionsByCourseType = (courseType: string) => {
    switch (courseType) {
      case "학점은행제":
        return [
          "한평생학점은행",
          "올티칭학점은행",
          "서울사이버평생교육",
          "드림원격평생교육원",
        ];
      case "민간 자격증":
        return ["한평생직업훈련"];
      case "유학":
        return ["감자유학"];
      default:
        return [];
    }
  };

  // 과정분류별 과정 목록
  const getCoursesByCourseType = (courseType: string): string[] => {
    switch (courseType) {
      case "학점은행제":
        return [
          "사회복지사2급",
          "보육교사2급",
          "평생교육사2급",
          "한국어교원2급",
          "아동학사",
          "아동전문학사",
          "사회복지학사",
          "사회복지전문학사",
        ];
      case "민간 자격증":
        return [
          "사회복지사2급",
          "보육교사2급",
          "평생교육사2급",
          "한국어교원2급",
        ];
      case "유학":
        return [
          "영어연수",
          "일본어연수",
          "중국어연수",
          "호주유학",
          "캐나다유학",
          "미국유학",
        ];
      default:
        return ["사회복지사2급"];
    }
  };

  // 등록/수정 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName || !formData.contact) {
      alert("모든 필수 항목을 입력해주세요.");
      return;
    }

    if (!user?.name) {
      alert("로그인이 필요합니다.");
      return;
    }

    // 수정 모드인지 확인
    if (editingItem) {
      await handleUpdate(e);
    } else {
      // 등록 모드
      const paymentAmount =
        parseInt(formData.paymentAmount.replace(/,/g, "")) || 0;
      const commission = calculateCommission(
        formData.courseType,
        formData.institution,
        paymentAmount
      );

      try {
        const { data, error } = await supabase
          .from("customers")
          .insert({
            branch: user.branch || "",
            team: user.team || "",
            manager: user.name,
            course_type: formData.courseType,
            course: formData.course,
            institution: formData.institution,
            customer_name: formData.customerName,
            contact: formData.contact,
            education: formData.education,
            region: `${formData.region} ${formData.subRegion}`,
            status: "등록완료",
            payment_date: formData.paymentDate || null,
            payment_amount: paymentAmount,
            commission: commission,
          })
          .select()
          .single();

        if (error) {
          console.error("CRM 데이터 저장 오류:", error);
          alert("데이터 저장에 실패했습니다.");
          return;
        }

        // 성공적으로 저장되면 데이터 다시 가져오기
        await fetchCRMData();

        // 폼 초기화
        setFormData({
          courseType: "학점은행제",
          course: "사회복지사2급",
          institution: "한평생학점은행",
          customerName: "",
          contact: "",
          education: "고등학교 졸업",
          region: "서울",
          subRegion: "도봉구",
          paymentDate: "",
          paymentAmount: "",
        });

        alert("고객 정보가 성공적으로 등록되었습니다.");
      } catch (error) {
        console.error("CRM 데이터 저장 오류:", error);
        alert("데이터 저장에 실패했습니다.");
      }
    }
  };

  // 일괄등록 처리
  const handleBulkSubmit = () => {
    // 일괄등록 로직 (예시)
    alert("일괄등록 기능은 추후 구현 예정입니다.");
  };

  // 수정 기능
  const handleEdit = (id: string) => {
    const item = userCRMData.find((data) => data.id === id);
    if (item) {
      setFormData({
        courseType: item.courseType,
        course: item.course || "사회복지사2급",
        institution: item.institution,
        customerName: item.customerName,
        contact: item.contact,
        education: item.education,
        region: item.region.split(" ")[0] || "서울",
        subRegion: item.region.split(" ")[1] || "도봉구",
        paymentDate: item.paymentDate,
        paymentAmount: item.paymentAmount.toString(),
      });
      setEditingItem(id);
    }
  };

  // 수정 완료 처리
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !user?.name) return;

    const paymentAmount =
      parseInt(formData.paymentAmount.replace(/,/g, "")) || 0;
    const commission = calculateCommission(
      formData.courseType,
      formData.institution,
      paymentAmount
    );

    try {
      const { error } = await supabase
        .from("customers")
        .update({
          course_type: formData.courseType,
          course: formData.course,
          institution: formData.institution,
          customer_name: formData.customerName,
          contact: formData.contact,
          education: formData.education,
          region: `${formData.region} ${formData.subRegion}`,
          payment_date: formData.paymentDate || null,
          payment_amount: paymentAmount,
          commission: commission,
        })
        .eq("id", editingItem);

      if (error) {
        console.error("CRM 데이터 수정 오류:", error);
        alert("데이터 수정에 실패했습니다.");
        return;
      }

      await fetchCRMData();
      setEditingItem(null);

      // 폼 초기화
      setFormData({
        courseType: "학점은행제",
        course: "사회복지사2급",
        institution: "한평생학점은행",
        customerName: "",
        contact: "",
        education: "고등학교 졸업",
        region: "서울",
        subRegion: "도봉구",
        paymentDate: "",
        paymentAmount: "",
      });

      alert("고객 정보가 성공적으로 수정되었습니다.");
    } catch (error) {
      console.error("CRM 데이터 수정 오류:", error);
      alert("데이터 수정에 실패했습니다.");
    }
  };

  // 삭제 기능
  const handleDelete = async (id: string) => {
    if (!confirm("정말로 이 고객 정보를 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase.from("customers").delete().eq("id", id);

      if (error) {
        console.error("CRM 데이터 삭제 오류:", error);
        alert("데이터 삭제에 실패했습니다.");
        return;
      }

      await fetchCRMData();
      alert("고객 정보가 성공적으로 삭제되었습니다.");
    } catch (error) {
      console.error("CRM 데이터 삭제 오류:", error);
      alert("데이터 삭제에 실패했습니다.");
    }
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

  // 사용자별 데이터 필터링
  const userCRMData = crmData.filter((item) => item.manager === user?.name);

  // 검색 기능
  const filteredCRMData = userCRMData.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.customerName.toLowerCase().includes(searchLower) ||
      item.contact.includes(searchLower) ||
      item.institution.toLowerCase().includes(searchLower) ||
      item.courseType.toLowerCase().includes(searchLower)
    );
  });

  // 고객 수 계산 (사용자별)
  const totalCustomers = userCRMData.length;
  const activeCustomers = userCRMData.filter(
    (item) => item.status === "등록완료"
  ).length;

  // 총 금액 계산
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
      setSelectedItems(userCRMData.map((item) => item.id));
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
      if (newSelectedItems.length === userCRMData.length) {
        setSelectAll(true);
      }
    }
  };

  // 로딩 중이거나 인증 로딩 중일 때
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="flex h-screen">
        {/* 왼쪽 패널 */}
        <div className="w-1/4 bg-gray-50 p-6 overflow-y-auto">
          {/* 담당자 정보 */}
          <div className="mb-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-around">
                <span className="text-base font-semibold text-gray-900">
                  {user.branch}
                </span>
                <div className="w-px h-4 bg-gray-300"></div>
                <span className="text-base font-semibold text-gray-900">
                  {user.team}
                </span>
                <div className="w-px h-4 bg-gray-300"></div>
                <span className="text-lg font-bold text-gray-900">
                  {user.name}
                </span>
              </div>
            </div>
          </div>

          {/* 고객 정보 입력 폼 */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">고객 등록</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 과정 정보 */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    분류
                  </label>
                  <select
                    className="w-full bg-white border-0 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                    value={formData.courseType}
                    onChange={(e) => {
                      const newCourseType = e.target.value;
                      const availableCourses =
                        getCoursesByCourseType(newCourseType);
                      const availableInstitutions =
                        getInstitutionsByCourseType(newCourseType);

                      setFormData({
                        ...formData,
                        courseType: newCourseType,
                        course: availableCourses[0] || "사회복지사2급",
                        institution: availableInstitutions[0] || "",
                      });
                    }}
                    required
                  >
                    <option value="학점은행제">학점은행제</option>
                    <option value="민간 자격증">민간 자격증</option>
                    <option value="유학">유학</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    과정
                  </label>
                  <select
                    className="w-full bg-white border-0 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                    value={formData.course}
                    onChange={(e) =>
                      setFormData({ ...formData, course: e.target.value })
                    }
                    required
                  >
                    <option value="">선택</option>
                    {getCoursesByCourseType(formData.courseType).map(
                      (course) => (
                        <option key={course} value={course}>
                          {course}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    기관
                  </label>
                  <select
                    className="w-full bg-white border-0 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                    value={formData.institution}
                    onChange={(e) =>
                      setFormData({ ...formData, institution: e.target.value })
                    }
                    required
                  >
                    {getInstitutionsByCourseType(formData.courseType).map(
                      (institution) => (
                        <option key={institution} value={institution}>
                          {institution}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* 고객 정보 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    고객명 *
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border-0 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                    value={formData.customerName}
                    onChange={(e) =>
                      setFormData({ ...formData, customerName: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    연락처 *
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border-0 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                    value={formData.contact}
                    onChange={(e) =>
                      setFormData({ ...formData, contact: e.target.value })
                    }
                    placeholder="010-0000-0000"
                    required
                  />
                </div>
              </div>

              {/* 최종학력 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  최종학력 *
                </label>
                <select
                  className="w-full bg-white border-0 rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                  value={formData.education}
                  onChange={(e) =>
                    setFormData({ ...formData, education: e.target.value })
                  }
                  required
                >
                  <option value="고등학교 졸업">고등학교 졸업</option>
                  <option value="2년제 졸업">2년제 졸업</option>
                  <option value="3년제 졸업">3년제 졸업</option>
                  <option value="4년제 졸업">4년제 졸업</option>
                  <option value="2년제 중퇴">2년제 중퇴</option>
                  <option value="3년제 중퇴">3년제 중퇴</option>
                  <option value="4년제 중퇴">4년제 중퇴</option>
                </select>
              </div>

              {/* 지역 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    지역
                  </label>
                  <select
                    className="w-full bg-white border-0 rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                    value={formData.region}
                    onChange={(e) =>
                      setFormData({ ...formData, region: e.target.value })
                    }
                  >
                    <option value="서울">서울</option>
                    <option value="부산">부산</option>
                    <option value="대구">대구</option>
                    <option value="인천">인천</option>
                    <option value="광주">광주</option>
                    <option value="대전">대전</option>
                    <option value="울산">울산</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    세부지역
                  </label>
                  <select
                    className="w-full bg-white border-0 rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                    value={formData.subRegion}
                    onChange={(e) =>
                      setFormData({ ...formData, subRegion: e.target.value })
                    }
                  >
                    <option value="도봉구">도봉구</option>
                    <option value="강남구">강남구</option>
                    <option value="서초구">서초구</option>
                    <option value="마포구">마포구</option>
                    <option value="종로구">종로구</option>
                  </select>
                </div>
              </div>

              {/* 결제일자 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  결제일자
                </label>
                <input
                  type="date"
                  className="w-full bg-white border-0 rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                  value={formData.paymentDate}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentDate: e.target.value })
                  }
                />
              </div>

              {/* 결제금액 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  결제금액
                </label>
                <input
                  type="text"
                  className="w-full bg-white border-0 rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                  value={formData.paymentAmount}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    setFormData({ ...formData, paymentAmount: value });
                  }}
                  placeholder="600,000"
                />
                {formData.paymentAmount && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="text-sm text-blue-600 font-semibold">
                      예상 수당: {calculatedCommission.toLocaleString()}원
                    </div>
                  </div>
                )}
              </div>

              {/* 버튼 */}
              <div className="flex space-x-3 pt-6">
                <button
                  type="button"
                  onClick={handleBulkSubmit}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-all font-semibold shadow-sm"
                >
                  일괄등록
                </button>
                {editingItem ? (
                  <>
                    <button
                      type="submit"
                      className="flex-1 bg-green-500 text-white py-3 px-4 rounded-xl hover:bg-green-600 transition-all font-semibold shadow-sm"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(null);
                        setFormData({
                          courseType: "학점은행제",
                          course: "사회복지사2급",
                          institution: "한평생학점은행",
                          customerName: "",
                          contact: "",
                          education: "고등학교 졸업",
                          region: "서울",
                          subRegion: "도봉구",
                          paymentDate: "",
                          paymentAmount: "",
                        });
                      }}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-all font-semibold shadow-sm"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-xl hover:bg-blue-600 transition-all font-semibold shadow-sm"
                  >
                    등록
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* 기관별 적용 수당 */}
          <div className="mt-4">
            <details className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <summary className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors font-semibold text-gray-700">
                기관별 수당 정보
              </summary>
              <div className="border-t border-gray-100">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 text-left font-medium text-gray-600">
                          과정
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">
                          기관
                        </th>
                        <th className="px-3 py-2 text-center font-medium text-gray-600">
                          기본금액
                        </th>
                        <th className="px-3 py-2 text-center font-medium text-gray-600">
                          수당
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissionRates.map((rate, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-3 py-2 text-gray-900">
                            {rate.courseType}
                          </td>
                          <td className="px-3 py-2 text-gray-900">
                            {rate.institution}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-900">
                            {rate.baseAmount.toLocaleString()}원
                          </td>
                          <td className="px-3 py-2 text-center font-semibold text-blue-600">
                            {rate.commission.toLocaleString()}원
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* 오른쪽 메인 콘텐츠 */}
        <div className="flex-1 p-8 overflow-y-auto min-w-0">
          {/* 필터 및 액션 */}
          <div className="mb-8 flex justify-between items-center">
            <div className="flex space-x-4">
              <select
                className="bg-white border-0 rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
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
                className="bg-white border-0 rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
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
              <input
                type="text"
                placeholder="고객명, 연락처, 기관명으로 검색..."
                className="bg-white border-0 rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex space-x-3">
              {selectedItems.length > 0 && (
                <>
                  <button
                    onClick={handleBulkDelete}
                    className="bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-all font-semibold shadow-sm"
                  >
                    선택 삭제 ({selectedItems.length})
                  </button>
                  <button
                    onClick={() => {
                      if (selectedItems.length === 1) {
                        // 단일 항목 수정
                        handleEdit(selectedItems[0]);
                      } else {
                        // 다중 항목 수정 (예시)
                        alert("다중 수정 기능은 추후 구현 예정입니다.");
                      }
                    }}
                    className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-all font-semibold shadow-sm"
                  >
                    {selectedItems.length === 1
                      ? "수정"
                      : `선택 수정 (${selectedItems.length})`}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 데이터 테이블 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto min-w-full">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      번호
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                      지점
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                      팀
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                      담당자
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                      분류
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                      과정
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                      기관
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                      고객명
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                      연락처
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                      학력
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                      지역
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                      결제일
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                      금액/수당
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredCRMData.map((item, index) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                        {item.branch}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                        {item.team}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                        {item.manager}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                        {item.courseType}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                        {item.course || "미선택"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                        {item.institution}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                        {item.customerName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                        {item.contact}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                        {item.education}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                        {item.region}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                        {item.paymentDate || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                        <div className="space-y-1">
                          <div className="text-gray-900">
                            {item.paymentAmount
                              ? `${item.paymentAmount.toLocaleString()}원`
                              : "-"}
                          </div>
                          <div className="text-blue-600 font-medium">
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
          </div>

          {/* 요약 정보 */}
          <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-700 mb-2">
                  총 결제금액
                </div>
                <div className="text-3xl font-bold text-purple-600">
                  {totalPaymentAmount.toLocaleString()}원
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-700 mb-2">
                  총 수당
                </div>
                <div className="text-3xl font-bold text-orange-600">
                  {totalCommission.toLocaleString()}원
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
