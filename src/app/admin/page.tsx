"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string;
  branch: string;
  team: string;
  created_at: string;
}

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    name: "",
    branch: "",
    team: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    // 관리자 권한 확인
    checkAdminRole();
  }, [user, isLoading, router]);

  const checkAdminRole = async () => {
    try {
      // 이메일 기반으로 관리자 확인 (간단한 방법)
      const isAdmin =
        user?.email?.includes("admin") || user?.email === "admin@korhrd.com";

      if (!isAdmin) {
        console.log("관리자 권한이 없습니다");
        router.replace("/");
        return;
      }

      // 사용자 목록 조회
      loadUsers();
    } catch (error) {
      console.error("관리자 권한 확인 오류:", error);
      router.replace("/");
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("id, email, name, branch, team, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("사용자 목록 조회 오류:", error);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error("사용자 목록 조회 중 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.name) {
      alert("이메일, 비밀번호, 이름을 모두 입력해주세요.");
      return;
    }

    setIsCreating(true);
    try {
      const { createUser } = useAuth();
      const result = await createUser(newUser);

      if (result.success) {
        alert("사용자가 생성되었습니다.");
        setNewUser({ email: "", password: "", name: "", branch: "", team: "" });
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
      const { removeUser } = useAuth();
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 새 사용자 생성 폼 */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">새 사용자 생성</h2>
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
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="password"
                placeholder="비밀번호"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="이름"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="지점"
                value={newUser.branch}
                onChange={(e) =>
                  setNewUser({ ...newUser, branch: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="팀"
                value={newUser.team}
                onChange={(e) =>
                  setNewUser({ ...newUser, team: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleCreateUser}
                disabled={isCreating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isCreating ? "생성 중..." : "사용자 생성"}
              </button>
            </div>
          </div>
        </div>

        {/* 사용자 목록 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
            <p className="mt-1 text-sm text-gray-600">
              시스템의 모든 사용자를 관리합니다.
            </p>
          </div>

          <div className="p-6">
            {users.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">👥</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  사용자가 없습니다
                </h3>
                <p className="text-gray-600">새 사용자를 생성해보세요.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사용자 정보
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        소속
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        가입일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {user.branch} / {user.team}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="text-red-600 hover:text-red-900"
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
  );
}
