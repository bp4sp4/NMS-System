"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Settings } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  branch: string;
  team: string;
  created_at: string;
  position?: {
    name: string;
    level: number;
  } | null;
}

interface Position {
  id: number;
  name: string;
  level: number;
  description: string;
}

export default function AdminPage() {
  const { user, isLoading, createUser, removeUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [teams, setTeams] = useState<
    { id: string; name: string; branch_id: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    name: "",
    branch: "",
    team: "",
    positionId: 1, // 기본값: 사원
  });
  const [isCreating, setIsCreating] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);

      // 1단계: 사용자 정보 조회
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, email, name, branch, team, position_id, created_at")
        .order("created_at", { ascending: false });

      if (usersError) {
        console.error("사용자 목록 조회 오류:", usersError);
        return;
      }

      // 2단계: 직급 정보 조회
      const { data: positionsData, error: positionsError } = await supabase
        .from("positions")
        .select("id, name, level");

      if (positionsError) {
        console.error("직급 목록 조회 오류:", positionsError);
        setUsers(usersData || []);
        return;
      }

      // 3단계: 데이터 매칭
      const usersWithPositions = (usersData || []).map((user) => {
        const position = positionsData?.find((p) => p.id === user.position_id);
        return {
          ...user,
          position: position || null,
        };
      });

      setUsers(usersWithPositions);
    } catch (error) {
      console.error("사용자 목록 조회 중 오류:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPositions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("positions")
        .select("id, name, level, description")
        .order("level", { ascending: true });

      if (error) {
        console.error("직급 목록 조회 오류:", error);
        return;
      }

      setPositions(data || []);
    } catch (error) {
      console.error("직급 목록 조회 중 오류:", error);
    }
  }, []);

  const loadBranches = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name")
        .eq("status", "active")
        .order("name", { ascending: true });

      if (error) {
        console.error("지점 목록 조회 오류:", error);
        return;
      }

      setBranches(data || []);
    } catch (error) {
      console.error("지점 목록 조회 중 오류:", error);
    }
  }, []);

  const loadTeams = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, branch_id")
        .order("name", { ascending: true });

      if (error) {
        console.error("팀 목록 조회 오류:", error);
        return;
      }

      setTeams(data || []);
    } catch (error) {
      console.error("팀 목록 조회 중 오류:", error);
    }
  }, []);

  // 기존 사용자들에게 기본 직급 설정
  const setupDefaultPositions = useCallback(async () => {
    try {
      // 한 번만 실행되도록 플래그 확인
      const hasRun = sessionStorage.getItem("defaultPositionsSetup");
      if (hasRun) {
        return; // 이미 실행됨
      }

      // position_id가 null인 사용자들에게 기본 직급(사원) 설정
      const { error: updateError } = await supabase
        .from("users")
        .update({ position_id: 1 }) // 사원
        .is("position_id", null);

      if (updateError) {
        console.error("기본 직급 설정 오류:", updateError);
      } else {
        console.log("기본 직급 설정이 완료되었습니다.");
        // 실행 완료 플래그 설정
        sessionStorage.setItem("defaultPositionsSetup", "true");
        // 사용자 목록 새로고침
        loadUsers();
      }
    } catch (error) {
      console.error("기본 직급 설정 중 오류:", error);
    }
  }, [loadUsers]);

  const checkAdminRole = useCallback(async () => {
    try {
      // 이메일 기반으로 관리자 확인 (간단한 방법)
      const isAdmin =
        user?.email?.includes("admin") || user?.email === "admin@korhrd.com";

      if (!isAdmin) {
        console.log("관리자 권한이 없습니다");
        router.replace("/");
        return;
      }

      // 사용자 목록, 직급 목록, 지점 목록, 팀 목록 조회
      await Promise.all([
        loadUsers(),
        loadPositions(),
        loadBranches(),
        loadTeams(),
      ]);
      // 기본 직급 설정은 한 번만 실행
      setupDefaultPositions();
    } catch (error) {
      console.error("관리자 권한 확인 오류:", error);
      router.replace("/");
    }
  }, [
    user,
    router,
    loadUsers,
    loadPositions,
    loadBranches,
    loadTeams,
    setupDefaultPositions,
  ]);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    // 관리자 권한 확인
    checkAdminRole();
  }, [user, isLoading, router, checkAdminRole]);

  const handleCreateUser = async () => {
    if (
      !newUser.email ||
      !newUser.password ||
      !newUser.name ||
      !newUser.branch ||
      !newUser.team
    ) {
      alert("이메일, 비밀번호, 이름, 지점, 팀을 모두 입력해주세요.");
      return;
    }

    setIsCreating(true);
    try {
      console.log("사용자 생성 데이터:", {
        ...newUser,
        position_id: newUser.positionId,
      });

      // 사용자 생성 시 position_id도 함께 설정
      const result = await createUser({
        email: newUser.email,
        password: newUser.password,
        name: newUser.name,
        branch: newUser.branch,
        team: newUser.team,
        position_id: newUser.positionId,
      });

      if (result.success) {
        alert("사용자가 생성되었습니다.");
        setNewUser({
          email: "",
          password: "",
          name: "",
          branch: "",
          team: "",
          positionId: 1,
        });
        loadUsers(); // 목록 새로고침
      } else {
        alert(`사용자 생성 실패: ${result.error}`);
      }
    } catch (error) {
      console.error("사용자 생성 중 오류:", error);
      alert("사용자 생성 중 오류가 발생했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`정말로 "${userName}" 사용자를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      // 사용자 삭제 (CASCADE로 관련 데이터도 자동 삭제)
      const result = await removeUser(userId);

      if (result.success) {
        alert("사용자가 삭제되었습니다.");
        loadUsers(); // 목록 새로고침
      } else {
        alert(`사용자 삭제 실패: ${result.error}`);
      }
    } catch (error) {
      console.error("사용자 삭제 중 오류:", error);
      alert("사용자 삭제 중 오류가 발생했습니다.");
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-gray-300">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* 헤더 */}
      <div className="bg-gray-900 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/")}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>뒤로가기</span>
              </button>
              <div className="w-px h-6 bg-gray-700"></div>
              <div className="flex items-center space-x-2">
                <Settings className="w-6 h-6 text-blue-500" />
                <h1 className="text-xl font-bold text-white">관리자 페이지</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-300">
                <Users className="w-5 h-5" />
                <span className="text-sm">총 {users.length}명의 사용자</span>
              </div>
              <button
                onClick={setupDefaultPositions}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                기본 직급 설정
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 새 사용자 생성 폼 */}
          <div className="bg-gray-900 shadow-lg rounded-lg mb-8 border border-gray-700">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">새 사용자 생성</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <input
                  type="email"
                  placeholder="이메일"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="password"
                  placeholder="비밀번호"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="이름"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <select
                  value={newUser.branch}
                  onChange={(e) =>
                    setNewUser({ ...newUser, branch: e.target.value, team: "" })
                  }
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">지점 선택</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.name}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                <select
                  value={newUser.team}
                  onChange={(e) =>
                    setNewUser({ ...newUser, team: e.target.value })
                  }
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!newUser.branch}
                >
                  <option value="">팀 선택</option>
                  {teams
                    .filter((team) => {
                      const selectedBranch = branches.find(
                        (b) => b.name === newUser.branch
                      );
                      return (
                        selectedBranch && team.branch_id === selectedBranch.id
                      );
                    })
                    .map((team) => (
                      <option key={team.id} value={team.name}>
                        {team.name}
                      </option>
                    ))}
                </select>
                <select
                  value={newUser.positionId}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      positionId: parseInt(e.target.value),
                    })
                  }
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {positions.map((position) => (
                    <option key={position.id} value={position.id}>
                      {position.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleCreateUser}
                  disabled={isCreating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50"
                >
                  {isCreating ? "생성 중..." : "사용자 생성"}
                </button>
              </div>
            </div>
          </div>

          {/* 사용자 목록 */}
          <div className="bg-gray-900 shadow-lg rounded-lg border border-gray-700">
            <div className="px-6 py-4 border-b border-gray-700">
              <h1 className="text-2xl font-bold text-white">사용자 관리</h1>
              <p className="mt-1 text-sm text-gray-400">
                시스템의 모든 사용자를 관리합니다.
              </p>
            </div>

            <div className="p-6">
              {users.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-500 text-6xl mb-4">👥</div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    사용자가 없습니다
                  </h3>
                  <p className="text-gray-400">새 사용자를 생성해보세요.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          사용자 정보
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          소속
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          직급
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          가입일
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          작업
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-900 divide-y divide-gray-700">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-white">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-400">
                                {user.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-300">
                              {user.branch} / {user.team}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-300">
                              {user.position?.name || "직급 미설정"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() =>
                                handleDeleteUser(user.id, user.name)
                              }
                              className="text-red-400 hover:text-red-300"
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
