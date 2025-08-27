"use client";

import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Navigation";

interface RankingData {
  rank: number;
  branch: string;
  team: string;
  manager: string;
  managerAvatar?: string;
  totalPaymentAmount: number;
  totalCommission: number;
  customerCount: number;
}

interface BranchRankingData {
  rank: number;
  branch: string;
  totalPaymentAmount: number;
  totalCommission: number;
  customerCount: number;
}

interface FilterState {
  year: string;
  branch: string;
  month: string;
  team: string;
  searchName: string;
}

export default function RankingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [individualRankingData, setIndividualRankingData] = useState<
    RankingData[]
  >([]);
  const [branchRankingData, setBranchRankingData] = useState<
    BranchRankingData[]
  >([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [individualFilters, setIndividualFilters] = useState<FilterState>({
    year: new Date().getFullYear().toString(),
    branch: "전체 지점",
    month: (new Date().getMonth() + 1).toString(),
    team: "전체",
    searchName: "",
  });

  const [branchFilters, setBranchFilters] = useState<FilterState>({
    year: new Date().getFullYear().toString(),
    branch: "전체 지점",
    month: (new Date().getMonth() + 1).toString(),
    team: "전체",
    searchName: "",
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  // CRM 데이터에서 순위 계산
  const fetchRankingData = async () => {
    setIsLoadingData(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("순위 데이터 가져오기 오류:", error);
        return;
      }

      // 담당자별로 데이터 그룹화
      const managerStats = new Map<
        string,
        {
          branch: string;
          team: string;
          manager: string;
          managerAvatar?: string;
          totalPaymentAmount: number;
          totalCommission: number;
          customerCount: number;
        }
      >();

      // 지점별로 데이터 그룹화
      const branchStats = new Map<
        string,
        {
          totalPaymentAmount: number;
          totalCommission: number;
          customerCount: number;
        }
      >();

      data?.forEach((item) => {
        // 담당자별 통계
        const managerKey = item.manager;
        if (!managerStats.has(managerKey)) {
          managerStats.set(managerKey, {
            branch: item.branch,
            team: item.team,
            manager: item.manager,
            totalPaymentAmount: 0,
            totalCommission: 0,
            customerCount: 0,
          });
        }
        const managerStat = managerStats.get(managerKey)!;
        managerStat.totalPaymentAmount += item.payment_amount || 0;
        managerStat.totalCommission += item.commission || 0;
        managerStat.customerCount += 1;

        // 지점별 통계
        const branchKey = item.branch;
        if (!branchStats.has(branchKey)) {
          branchStats.set(branchKey, {
            totalPaymentAmount: 0,
            totalCommission: 0,
            customerCount: 0,
          });
        }
        const branchStat = branchStats.get(branchKey)!;
        branchStat.totalPaymentAmount += item.payment_amount || 0;
        branchStat.totalCommission += item.commission || 0;
        branchStat.customerCount += 1;
      });

      // 사용자 아바타 정보 가져오기
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("name, avatar")
        .in("name", Array.from(managerStats.keys()));

      if (usersError) {
        console.error("사용자 아바타 정보 가져오기 오류:", usersError);
      }

      // 아바타 정보를 담당자별로 매핑
      const avatarMap = new Map<string, string>();
      usersData?.forEach((user) => {
        if (user.name && user.avatar) {
          avatarMap.set(user.name, user.avatar);
        }
      });

      // 담당자별 순위 (총 결제금액 기준)
      const sortedIndividualData = Array.from(managerStats.values())
        .sort((a, b) => b.totalPaymentAmount - a.totalPaymentAmount)
        .map((item, index) => ({
          rank: index + 1,
          ...item,
          managerAvatar: avatarMap.get(item.manager),
        }));

      // 지점별 순위 (총 결제금액 기준)
      const sortedBranchData = Array.from(branchStats.entries())
        .map(([branch, stats]) => ({
          rank: 0, // 임시
          branch,
          ...stats,
        }))
        .sort((a, b) => b.totalPaymentAmount - a.totalPaymentAmount)
        .map((item, index) => ({
          ...item,
          rank: index + 1,
        }));

      setIndividualRankingData(sortedIndividualData);
      setBranchRankingData(sortedBranchData);
    } catch (error) {
      console.error("순위 데이터 가져오기 오류:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRankingData();
    }
  }, [user]);

  // 필터링된 데이터 계산
  const filteredIndividualData = individualRankingData.filter((item) => {
    // 지점 필터
    if (
      individualFilters.branch !== "전체 지점" &&
      item.branch !== individualFilters.branch
    )
      return false;

    // 팀 필터
    if (
      individualFilters.team !== "전체" &&
      item.team !== individualFilters.team
    )
      return false;

    // 이름 검색 필터
    if (
      individualFilters.searchName &&
      !item.manager.includes(individualFilters.searchName)
    )
      return false;

    return true;
  });

  const filteredBranchData = branchRankingData.filter((item) => {
    // 지점 필터
    if (
      branchFilters.branch !== "전체 지점" &&
      item.branch !== branchFilters.branch
    )
      return false;

    // 이름 검색 필터
    if (
      branchFilters.searchName &&
      !item.branch.includes(branchFilters.searchName)
    )
      return false;

    return true;
  });

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">순위 데이터를 불러오는 중...</p>
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

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            순위
            <span className="text-sm font-normal text-gray-500 ml-3">
              {new Date().toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })}{" "}
              기준
            </span>
          </h1>
          <p className="text-gray-600">
            개인별 및 지점별 실적 순위를 확인하세요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 개인 순위 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">개인 순위</h2>
              <div className="flex items-center space-x-2">
                <select
                  className="bg-gray-50 border-0 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  value={individualFilters.year}
                  onChange={(e) =>
                    setIndividualFilters({
                      ...individualFilters,
                      year: e.target.value,
                    })
                  }
                >
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>

                <select
                  className="bg-gray-50 border-0 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  value={individualFilters.month}
                  onChange={(e) =>
                    setIndividualFilters({
                      ...individualFilters,
                      month: e.target.value,
                    })
                  }
                >
                  <option value="1">1월</option>
                  <option value="2">2월</option>
                  <option value="3">3월</option>
                  <option value="4">4월</option>
                  <option value="5">5월</option>
                  <option value="6">6월</option>
                  <option value="7">7월</option>
                  <option value="8">8월</option>
                  <option value="9">9월</option>
                  <option value="10">10월</option>
                  <option value="11">11월</option>
                  <option value="12">12월</option>
                </select>
              </div>
            </div>

            {/* 검색 및 필터 */}
            <div className="mb-6 flex flex-wrap gap-3">
              <select
                className="bg-gray-50 border-0 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                value={individualFilters.branch}
                onChange={(e) =>
                  setIndividualFilters({
                    ...individualFilters,
                    branch: e.target.value,
                  })
                }
              >
                <option value="전체 지점">전체 지점</option>
                <option value="AIO">AIO</option>
                <option value="위드업">위드업</option>
              </select>

              <select
                className="bg-gray-50 border-0 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                value={individualFilters.team}
                onChange={(e) =>
                  setIndividualFilters({
                    ...individualFilters,
                    team: e.target.value,
                  })
                }
              >
                <option value="전체">전체</option>
                <option value="1팀">1팀</option>
                <option value="2팀">2팀</option>
                <option value="3팀">3팀</option>
                <option value="4팀">4팀</option>
              </select>

              <input
                type="text"
                placeholder="담당자명 검색"
                className="bg-gray-50 border-0 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all flex-1 min-w-0"
                value={individualFilters.searchName}
                onChange={(e) =>
                  setIndividualFilters({
                    ...individualFilters,
                    searchName: e.target.value,
                  })
                }
              />
            </div>

            {/* 개인 순위 리스트 */}
            <div className="space-y-3">
              {filteredIndividualData.map((item, index) => (
                <div
                  key={item.manager}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold text-white">
                      {item.rank === 1 ? (
                        <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                          🥇
                        </div>
                      ) : item.rank === 2 ? (
                        <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                          🥈
                        </div>
                      ) : item.rank === 3 ? (
                        <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                          🥉
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                          {item.rank}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      {item.managerAvatar ? (
                        <img
                          src={item.managerAvatar}
                          alt={`${item.manager} 프로필`}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-sm border-2 border-white shadow-sm">
                          {item.manager.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {item.manager}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.branch} • {item.team} • {item.customerCount}명
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-gray-900">
                      {item.totalPaymentAmount.toLocaleString()}원
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 지점 순위 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">지점 순위</h2>
              <div className="flex items-center space-x-2">
                <select
                  className="bg-gray-50 border-0 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  value={branchFilters.year}
                  onChange={(e) =>
                    setBranchFilters({
                      ...branchFilters,
                      year: e.target.value,
                    })
                  }
                >
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>

                <select
                  className="bg-gray-50 border-0 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  value={branchFilters.month}
                  onChange={(e) =>
                    setBranchFilters({
                      ...branchFilters,
                      month: e.target.value,
                    })
                  }
                >
                  <option value="1">1월</option>
                  <option value="2">2월</option>
                  <option value="3">3월</option>
                  <option value="4">4월</option>
                  <option value="5">5월</option>
                  <option value="6">6월</option>
                  <option value="7">7월</option>
                  <option value="8">8월</option>
                  <option value="9">9월</option>
                  <option value="10">10월</option>
                  <option value="11">11월</option>
                  <option value="12">12월</option>
                </select>
              </div>
            </div>

            {/* 검색 및 필터 */}
            <div className="mb-6 flex flex-wrap gap-3">
              <select
                className="bg-gray-50 border-0 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                value={branchFilters.branch}
                onChange={(e) =>
                  setBranchFilters({
                    ...branchFilters,
                    branch: e.target.value,
                  })
                }
              >
                <option value="전체 지점">전체 지점</option>
                <option value="AIO">AIO</option>
                <option value="위드업">위드업</option>
              </select>

              <input
                type="text"
                placeholder="지점명 검색"
                className="bg-gray-50 border-0 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all flex-1 min-w-0"
                value={branchFilters.searchName}
                onChange={(e) =>
                  setBranchFilters({
                    ...branchFilters,
                    searchName: e.target.value,
                  })
                }
              />
            </div>

            {/* 지점 순위 리스트 */}
            <div className="space-y-3">
              {filteredBranchData.map((item) => (
                <div
                  key={item.branch}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold text-white">
                      {item.rank === 1 ? (
                        <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                          🥇
                        </div>
                      ) : item.rank === 2 ? (
                        <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                          🥈
                        </div>
                      ) : item.rank === 3 ? (
                        <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                          🥉
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                          {item.rank}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {item.branch}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.customerCount}명
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-gray-900">
                      {item.totalPaymentAmount.toLocaleString()}원
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
