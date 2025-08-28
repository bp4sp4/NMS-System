"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface PendingUser {
  id: string;
  email: string;
  name: string;
  branch: string;
  team: string;
  created_at: string;
  is_approved: boolean;
}

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalNotes, setApprovalNotes] = useState<{ [key: string]: string }>(
    {}
  );

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
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user?.id)
        .single();

      if (error || !data) {
        console.error("사용자 정보 조회 실패:", error);
        router.replace("/");
        return;
      }

      if (data.role !== "admin" && data.role !== "super_admin") {
        console.log("관리자 권한이 없습니다");
        router.replace("/");
        return;
      }

      // 승인 대기 사용자 목록 조회
      loadPendingUsers();
    } catch (error) {
      console.error("관리자 권한 확인 오류:", error);
      router.replace("/");
    }
  };

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_pending_users");

      if (error) {
        console.error("승인 대기 사용자 조회 오류:", error);
        return;
      }

      setPendingUsers(data || []);
    } catch (error) {
      console.error("승인 대기 사용자 조회 중 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      const notes = approvalNotes[userId] || "";
      const { error } = await supabase.rpc("approve_user", {
        user_id: userId,
        admin_id: user?.id,
        approval_notes: notes,
      });

      if (error) {
        console.error("사용자 승인 오류:", error);
        alert("승인 중 오류가 발생했습니다.");
        return;
      }

      alert("사용자가 승인되었습니다.");
      setApprovalNotes((prev) => ({ ...prev, [userId]: "" }));
      loadPendingUsers(); // 목록 새로고침
    } catch (error) {
      console.error("사용자 승인 중 오류:", error);
      alert("승인 중 오류가 발생했습니다.");
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm("정말로 이 사용자를 거부하시겠습니까?")) {
      return;
    }

    try {
      const notes = approvalNotes[userId] || "";
      const { error } = await supabase.rpc("reject_user", {
        user_id: userId,
        admin_id: user?.id,
        rejection_notes: notes,
      });

      if (error) {
        console.error("사용자 거부 오류:", error);
        alert("거부 중 오류가 발생했습니다.");
        return;
      }

      alert("사용자가 거부되었습니다.");
      setApprovalNotes((prev) => ({ ...prev, [userId]: "" }));
      loadPendingUsers(); // 목록 새로고침
    } catch (error) {
      console.error("사용자 거부 중 오류:", error);
      alert("거부 중 오류가 발생했습니다.");
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
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">관리자 승인</h1>
            <p className="mt-1 text-sm text-gray-600">
              승인 대기 중인 사용자들을 관리합니다.
            </p>
          </div>

          <div className="p-6">
            {pendingUsers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">✓</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  승인 대기 중인 사용자가 없습니다
                </h3>
                <p className="text-gray-600">
                  모든 사용자가 승인되었거나 대기 중인 사용자가 없습니다.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="border border-gray-200 rounded-lg p-6 bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">
                              {user.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {user.email}
                            </p>
                            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                              <span>지점: {user.branch}</span>
                              <span>팀: {user.team}</span>
                              <span>
                                신청일:{" "}
                                {new Date(user.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            승인/거부 메모 (선택사항)
                          </label>
                          <textarea
                            value={approvalNotes[user.id] || ""}
                            onChange={(e) =>
                              setApprovalNotes((prev) => ({
                                ...prev,
                                [user.id]: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            rows={2}
                            placeholder="승인 또는 거부 사유를 입력하세요..."
                          />
                        </div>
                      </div>

                      <div className="ml-6 flex flex-col space-y-2">
                        <button
                          onClick={() => handleApprove(user.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleReject(user.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          거부
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
