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

      // 담당자별 순위 (총 결제금액 기준)
      const sortedIndividualData = Array.from(managerStats.values())
        .sort((a, b) => b.totalPaymentAmount - a.totalPaymentAmount)
        .map((item, index) => ({
          rank: index + 1,
          ...item,
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
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">순위</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 개인 순위 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                개인 순위
              </h2>

              {/* 개인 순위 필터 */}
              <div className="mb-4 flex flex-wrap gap-2">
                <select
                  className="border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white text-sm"
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
                  className="border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white text-sm"
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

                <select
                  className="border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white text-sm"
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
                  className="border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white text-sm"
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
                  placeholder="담당자명으로 검색..."
                  className="border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white text-sm w-40"
                  value={individualFilters.searchName}
                  onChange={(e) =>
                    setIndividualFilters({
                      ...individualFilters,
                      searchName: e.target.value,
                    })
                  }
                />
              </div>

              {/* 개인 순위 테이블 */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                          순위
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                          지점
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                          팀
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                          담당자
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                          고객 수
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                          총 결제금액
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredIndividualData.map((item) => (
                        <tr key={item.manager} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                item.rank === 1
                                  ? "bg-yellow-100 text-yellow-800"
                                  : item.rank === 2
                                  ? "bg-gray-100 text-gray-800"
                                  : item.rank === 3
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {item.rank}위
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {item.branch}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {item.team}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.manager}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {item.customerCount}명
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-purple-600">
                            {item.totalPaymentAmount.toLocaleString()}원
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 지점 순위 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                지점 순위
              </h2>

              {/* 지점 순위 필터 */}
              <div className="mb-4 flex flex-wrap gap-2">
                <select
                  className="border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white text-sm"
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
                  className="border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white text-sm"
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

                <select
                  className="border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white text-sm"
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
                  placeholder="지점명으로 검색..."
                  className="border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white text-sm w-40"
                  value={branchFilters.searchName}
                  onChange={(e) =>
                    setBranchFilters({
                      ...branchFilters,
                      searchName: e.target.value,
                    })
                  }
                />
              </div>

              {/* 지점 순위 테이블 */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                          순위
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                          지점
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                          고객 수
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                          총 결제금액
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredBranchData.map((item) => (
                        <tr key={item.branch} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                item.rank === 1
                                  ? "bg-yellow-100 text-yellow-800"
                                  : item.rank === 2
                                  ? "bg-gray-100 text-gray-800"
                                  : item.rank === 3
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {item.rank}위
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.branch}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {item.customerCount}명
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-purple-600">
                            {item.totalPaymentAmount.toLocaleString()}원
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
