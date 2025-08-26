"use client";

import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Header from "@/components/Navigation";

interface RankingData {
  rank: number;
  branch: string;
  team: string;
  manager: string;
  creditsOther: number;
  creditsNew: number;
  creditsExisting: number;
  totalSales: number;
}

interface BranchRankingData {
  rank: number;
  branch: string;
  branchManager: string;
  totalSales: number;
}

interface FilterState {
  year: string;
  branch: string;
  month: string;
  team: string;
  searchName: string;
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [individualFilters, setIndividualFilters] = useState<FilterState>({
    year: "2025",
    branch: "전체 지점",
    month: "전체",
    team: "전체",
    searchName: "",
  });

  const [branchFilters, setBranchFilters] = useState<FilterState>({
    year: "2025",
    branch: "전체 지점",
    month: "전체",
    team: "전체",
    searchName: "",
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  // 샘플 데이터
  const individualRankingData: RankingData[] = [
    {
      rank: 1,
      branch: "위드업 지점",
      team: "1팀",
      manager: "홍길동",
      creditsOther: 500000,
      creditsNew: 20000000,
      creditsExisting: 15000000,
      totalSales: 35500000,
    },
    {
      rank: 2,
      branch: "AIO 지점",
      team: "2팀",
      manager: "김철수",
      creditsOther: 600000,
      creditsNew: 22000000,
      creditsExisting: 16000000,
      totalSales: 38600000,
    },
    {
      rank: 3,
      branch: "위드업 지점",
      team: "1-1팀",
      manager: "이영희",
      creditsOther: 400000,
      creditsNew: 18000000,
      creditsExisting: 14000000,
      totalSales: 32400000,
    },
    {
      rank: 4,
      branch: "AIO 지점",
      team: "3팀",
      manager: "박민수",
      creditsOther: 700000,
      creditsNew: 25000000,
      creditsExisting: 17000000,
      totalSales: 42700000,
    },
    {
      rank: 5,
      branch: "위드업 지점",
      team: "1팀",
      manager: "최지영",
      creditsOther: 300000,
      creditsNew: 15000000,
      creditsExisting: 12000000,
      totalSales: 27300000,
    },
    {
      rank: 6,
      branch: "AIO 지점",
      team: "2팀",
      manager: "정수민",
      creditsOther: 800000,
      creditsNew: 28000000,
      creditsExisting: 19000000,
      totalSales: 47800000,
    },
    {
      rank: 7,
      branch: "위드업 지점",
      team: "1-1팀",
      manager: "강동원",
      creditsOther: 450000,
      creditsNew: 19000000,
      creditsExisting: 15500000,
      totalSales: 34950000,
    },
    {
      rank: 8,
      branch: "AIO 지점",
      team: "3팀",
      manager: "윤서연",
      creditsOther: 550000,
      creditsNew: 21000000,
      creditsExisting: 16500000,
      totalSales: 38050000,
    },
    {
      rank: 9,
      branch: "위드업 지점",
      team: "1팀",
      manager: "임태현",
      creditsOther: 650000,
      creditsNew: 23000000,
      creditsExisting: 17500000,
      totalSales: 41150000,
    },
    {
      rank: 10,
      branch: "AIO 지점",
      team: "2팀",
      manager: "한소희",
      creditsOther: 350000,
      creditsNew: 16000000,
      creditsExisting: 13000000,
      totalSales: 29350000,
    },
    {
      rank: 11,
      branch: "위드업 지점",
      team: "1-1팀",
      manager: "송민호",
      creditsOther: 750000,
      creditsNew: 26000000,
      creditsExisting: 18500000,
      totalSales: 45250000,
    },
    {
      rank: 12,
      branch: "AIO 지점",
      team: "3팀",
      manager: "조은영",
      creditsOther: 400000,
      creditsNew: 17000000,
      creditsExisting: 13500000,
      totalSales: 30900000,
    },
    {
      rank: 13,
      branch: "위드업 지점",
      team: "1팀",
      manager: "백준호",
      creditsOther: 600000,
      creditsNew: 24000000,
      creditsExisting: 18000000,
      totalSales: 42600000,
    },
    {
      rank: 14,
      branch: "AIO 지점",
      team: "2팀",
      manager: "유미라",
      creditsOther: 500000,
      creditsNew: 20000000,
      creditsExisting: 15000000,
      totalSales: 35500000,
    },
  ];

  const branchRankingData: BranchRankingData[] = [
    {
      rank: 1,
      branch: "위드업 지점",
      branchManager: "홍길동",
      totalSales: 2000000000,
    },
    {
      rank: 2,
      branch: "AIO 지점",
      branchManager: "아무개",
      totalSales: 1000000000,
    },
    { rank: 3, branch: "OO지점", branchManager: "", totalSales: 0 },
    { rank: 4, branch: "OO지점", branchManager: "", totalSales: 0 },
    { rank: 5, branch: "OO지점", branchManager: "", totalSales: 0 },
    { rank: 6, branch: "OO지점", branchManager: "", totalSales: 0 },
    { rank: 7, branch: "OO지점", branchManager: "", totalSales: 0 },
    { rank: 8, branch: "OO지점", branchManager: "", totalSales: 0 },
    { rank: 9, branch: "OO지점", branchManager: "", totalSales: 0 },
    { rank: 10, branch: "OO지점", branchManager: "", totalSales: 0 },
    { rank: 11, branch: "OO지점", branchManager: "", totalSales: 0 },
    { rank: 12, branch: "OO지점", branchManager: "", totalSales: 0 },
    { rank: 13, branch: "OO지점", branchManager: "", totalSales: 0 },
    { rank: 14, branch: "OO지점", branchManager: "", totalSales: 0 },
  ];

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("ko-KR").format(num);
  };

  // 필터링된 데이터 계산
  const filteredIndividualData = individualRankingData.filter((item) => {
    // 년도 필터 (현재는 모든 데이터가 2025년으로 가정)
    if (individualFilters.year !== "2025") return false;

    // 월 필터 (현재는 모든 데이터가 전체로 가정)
    if (individualFilters.month !== "전체") return false;

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

  const filteredBranchData = branchRankingData.filter(() => {
    // 년도 필터 (현재는 모든 데이터가 2025년으로 가정)
    if (branchFilters.year !== "2025") return false;

    // 월 필터 (현재는 모든 데이터가 전체로 가정)
    if (branchFilters.month !== "전체") return false;

    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
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

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* 순위 테이블 */}
        <div className="grid grid-cols-4 gap-8">
          {/* 개인 순위 */}
          <div className="bg-white rounded-lg shadow col-span-3">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">개인 순위</h2>
              <p className="text-sm text-gray-900">25.00.00 기준</p>

              {/* 개인 순위 필터 */}
              <div className="mt-3">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-900">년도:</label>
                    <select
                      className="text-sm border border-gray-300 rounded px-3 py-2 bg-white text-gray-900"
                      value={individualFilters.year}
                      onChange={(e) =>
                        setIndividualFilters({
                          ...individualFilters,
                          year: e.target.value,
                        })
                      }
                    >
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                      <option value="2028">2028</option>
                      <option value="2029">2029</option>
                      <option value="2030">2030</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-900">월:</label>
                    <select
                      className="text-sm border border-gray-300 rounded px-3 py-2 bg-white text-gray-900"
                      value={individualFilters.month}
                      onChange={(e) =>
                        setIndividualFilters({
                          ...individualFilters,
                          month: e.target.value,
                        })
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
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-900">지점:</label>
                    <select
                      className="text-sm border border-gray-300 rounded px-3 py-2 bg-white text-gray-900"
                      value={individualFilters.branch}
                      onChange={(e) =>
                        setIndividualFilters({
                          ...individualFilters,
                          branch: e.target.value,
                        })
                      }
                    >
                      <option value="전체 지점">전체 지점</option>
                      <option value="위드업 지점">위드업 지점</option>
                      <option value="AIO 지점">AIO 지점</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-900">팀:</label>
                    <select
                      className="text-sm border border-gray-300 rounded px-3 py-2 bg-white text-gray-900"
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
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-900">이름:</label>
                    <input
                      type="text"
                      className="text-sm border border-gray-300 rounded px-3 py-2 bg-white text-gray-900"
                      placeholder="이름 검색"
                      value={individualFilters.searchName}
                      onChange={(e) =>
                        setIndividualFilters({
                          ...individualFilters,
                          searchName: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      순위
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      지점
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      소속팀
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      담당자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      학점 외
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      학점(신규)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      학점(기존)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      총 매출
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredIndividualData.map((item) => (
                    <tr key={item.rank} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.rank}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.branch}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.team}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.manager}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(item.creditsOther)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(item.creditsNew)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(item.creditsExisting)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatNumber(item.totalSales)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 지점 순위 */}
          <div className="bg-white rounded-lg shadow col-span-1">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">지점 순위</h2>
              <p className="text-sm text-gray-900">25.00.00 기준</p>

              {/* 지점 순위 필터 */}
              <div className="mt-3">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-900">년도:</label>
                    <select
                      className="text-sm border border-gray-300 rounded px-3 py-2 bg-white text-gray-900"
                      value={branchFilters.year}
                      onChange={(e) =>
                        setBranchFilters({
                          ...branchFilters,
                          year: e.target.value,
                        })
                      }
                    >
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                      <option value="2028">2028</option>
                      <option value="2029">2029</option>
                      <option value="2030">2030</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-900">월:</label>
                    <select
                      className="text-sm border border-gray-300 rounded px-3 py-2 bg-white text-gray-900"
                      value={branchFilters.month}
                      onChange={(e) =>
                        setBranchFilters({
                          ...branchFilters,
                          month: e.target.value,
                        })
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
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      순위
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      지점
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      지점장
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      총 매출
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBranchData.map((item) => (
                    <tr key={item.rank} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.rank}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {item.branch}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {item.branchManager}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatNumber(item.totalSales)}
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
  );
}
