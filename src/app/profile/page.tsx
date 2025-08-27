"use client";

import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Navigation";
import {
  Camera,
  Upload,
  Save,
  Lock,
  User,
  MessageSquare,
  Settings,
} from "lucide-react";

interface ProfileFormData {
  name: string;
  branch: string;
  team: string;
  hireDate: string;
  position: string;
  contact: string;
  bank: string;
  bankAccount: string;
  address: string;
  residentNumber: string;
  emergencyContactA: string;
  emergencyContactB: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const { user, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    branch: "",
    team: "",
    hireDate: "",
    position: "",
    contact: "",
    bank: "",
    bankAccount: "",
    address: "",
    residentNumber: "",
    emergencyContactA: "",
    emergencyContactB: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("basic");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        branch: user.branch || "",
        team: user.team || "",
        hireDate: user.hire_date || "",
        position: user.position || "",
        contact: user.contact || "",
        bank: user.bank || "",
        bankAccount: user.bank_account || "",
        address: user.address || "",
        residentNumber: user.resident_number || "",
        emergencyContactA: user.emergency_contact_a || "",
        emergencyContactB: user.emergency_contact_b || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setAvatarUrl(user.avatar || null);
    }
  }, [user]);

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setAvatarUrl(publicUrl);

      // 데이터베이스에 아바타 URL 업데이트
      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar: publicUrl })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      setMessage({ type: "success", text: "프로필 사진이 업로드되었습니다." });
      await refreshUser();
    } catch (error) {
      console.error("Avatar upload error:", error);
      setMessage({ type: "error", text: "프로필 사진 업로드에 실패했습니다." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: formData.name,
          branch: formData.branch,
          team: formData.team,
          hire_date: formData.hireDate || null,
          position: formData.position,
          contact: formData.contact,
          bank: formData.bank,
          bank_account: formData.bankAccount,
          address: formData.address,
          resident_number: formData.residentNumber,
          emergency_contact_a: formData.emergencyContactA,
          emergency_contact_b: formData.emergencyContactB,
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      setMessage({ type: "success", text: "프로필이 저장되었습니다." });
      await refreshUser();
    } catch (error) {
      console.error("Profile update error:", error);
      setMessage({ type: "error", text: "프로필 저장에 실패했습니다." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: "error", text: "새 비밀번호가 일치하지 않습니다." });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({ type: "error", text: "비밀번호는 6자 이상이어야 합니다." });
      return;
    }

    setIsChangingPassword(true);
    setMessage({ type: "", text: "" });

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("세션이 없습니다. 다시 로그인해주세요.");
      }

      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (error) {
        throw error;
      }

      // 성공 메시지 표시
      setMessage({ type: "success", text: "비밀번호가 변경되었습니다." });

      // 폼 초기화
      setFormData({
        ...formData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // 3초 후 성공 메시지 자동 제거
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 3000);
    } catch (error) {
      console.error("Password change error:", error);
      setMessage({
        type: "error",
        text: "비밀번호 변경에 실패했습니다. 다시 시도해주세요.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
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

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            개인정보 수정
          </h1>
          <p className="text-gray-600">프로필 정보와 비밀번호를 관리하세요</p>
        </div>

        {/* 메시지 표시 */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* 토스 스타일 탭 네비게이션 */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("basic")}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "basic"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  기본정보 수정
                </div>
              </button>
              <button
                onClick={() => setActiveTab("greeting")}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "greeting"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  인사카드 기록
                </div>
              </button>
              <button
                onClick={() => setActiveTab("password")}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "password"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center">
                  <Lock className="w-4 h-4 mr-2" />
                  비밀번호 변경
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          {/* 기본정보 수정 탭 */}
          {activeTab === "basic" && (
            <div className="space-y-6">
              {/* 프로필 사진 섹션 */}
              <div className="text-center mb-8">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden mb-4 mx-auto">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-gray-400" />
                    )}
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center mx-auto"
                  >
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {isUploading ? "업로드 중..." : "사진 변경"}
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* 기본 정보 폼 */}
              <div className="max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  기본 정보
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이름
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full bg-gray-50 border-0 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      지점
                    </label>
                    <input
                      type="text"
                      value={formData.branch}
                      onChange={(e) =>
                        setFormData({ ...formData, branch: e.target.value })
                      }
                      className="w-full bg-gray-50 border-0 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      팀
                    </label>
                    <input
                      type="text"
                      value={formData.team}
                      onChange={(e) =>
                        setFormData({ ...formData, team: e.target.value })
                      }
                      className="w-full bg-gray-50 border-0 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center"
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isSaving ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          )}

          {/* 인사카드 기록 탭 */}
          {activeTab === "greeting" && (
            <div className="max-w-4xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                인사카드 기록
              </h3>

              <div className="space-y-6">
                {/* 기본 정보 섹션 */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    기본 정보
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        입사일자
                      </label>
                      <input
                        type="date"
                        value={formData.hireDate}
                        onChange={(e) =>
                          setFormData({ ...formData, hireDate: e.target.value })
                        }
                        className="w-full bg-white border-0 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        직급
                      </label>
                      <select
                        value={formData.position}
                        onChange={(e) =>
                          setFormData({ ...formData, position: e.target.value })
                        }
                        className="w-full bg-white border-0 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 transition-all"
                      >
                        <option value="">직급을 선택하세요</option>
                        <option value="대표이사">대표이사</option>
                        <option value="이사">이사</option>
                        <option value="실장">실장</option>
                        <option value="대리">대리</option>
                        <option value="주임">주임</option>
                        <option value="사원">사원</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        은행
                      </label>
                      <select
                        value={formData.bank}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bank: e.target.value,
                          })
                        }
                        className="w-full bg-white border-0 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 transition-all"
                      >
                        <option value="">은행을 선택하세요</option>
                        <option value="KB국민은행">KB국민은행</option>
                        <option value="신한은행">신한은행</option>
                        <option value="우리은행">우리은행</option>
                        <option value="하나은행">하나은행</option>
                        <option value="NH농협은행">NH농협은행</option>
                        <option value="IBK기업은행">IBK기업은행</option>
                        <option value="케이뱅크">케이뱅크</option>
                        <option value="카카오뱅크">카카오뱅크</option>
                        <option value="토스뱅크">토스뱅크</option>
                        <option value="새마을금고">새마을금고</option>
                        <option value="신협">신협</option>
                        <option value="우체국">우체국</option>
                        <option value="기타">기타</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        계좌번호
                      </label>
                      <input
                        type="text"
                        value={formData.bankAccount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bankAccount: e.target.value,
                          })
                        }
                        placeholder="계좌번호를 입력하세요"
                        className="w-full bg-white border-0 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        연락처
                      </label>
                      <input
                        type="tel"
                        value={formData.contact}
                        onChange={(e) =>
                          setFormData({ ...formData, contact: e.target.value })
                        }
                        placeholder="010-0000-0000"
                        className="w-full bg-white border-0 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* 주소 정보 섹션 */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    주소 정보
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        주소
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        placeholder="주소를 입력하세요"
                        className="w-full bg-white border-0 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        주민번호
                      </label>
                      <input
                        type="text"
                        value={formData.residentNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            residentNumber: e.target.value,
                          })
                        }
                        placeholder="000000-0000000"
                        maxLength={14}
                        className="w-full bg-white border-0 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* 비상연락망 섹션 */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    비상연락망
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        비상연락망 A
                      </label>
                      <input
                        type="tel"
                        value={formData.emergencyContactA}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergencyContactA: e.target.value,
                          })
                        }
                        placeholder="010-0000-0000"
                        className="w-full bg-white border-0 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        비상연락망 B
                      </label>
                      <input
                        type="tel"
                        value={formData.emergencyContactB}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergencyContactB: e.target.value,
                          })
                        }
                        placeholder="010-0000-0000"
                        className="w-full bg-white border-0 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* 저장 버튼 */}
                <div className="text-center">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center mx-auto"
                  >
                    {isSaving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {isSaving ? "저장 중..." : "인사카드 정보 저장"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 비밀번호 변경 탭 */}
          {activeTab === "password" && (
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                비밀번호 변경
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    새 비밀번호
                  </label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, newPassword: e.target.value })
                    }
                    placeholder="새 비밀번호를 입력하세요"
                    className="w-full bg-gray-50 border-0 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    새 비밀번호 확인
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="새 비밀번호를 다시 입력하세요"
                    className="w-full bg-gray-50 border-0 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={
                    isChangingPassword ||
                    !formData.newPassword ||
                    !formData.confirmPassword
                  }
                  className="w-full bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isChangingPassword ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Lock className="w-4 h-4 mr-2" />
                  )}
                  {isChangingPassword ? "변경 중..." : "비밀번호 변경"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
