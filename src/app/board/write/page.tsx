"use client";

import { useAuth } from "@/components/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Header from "@/components/Navigation";
import { createPost, canWritePost } from "@/lib/board";
import { ArrowLeft, Save, X } from "lucide-react";
import styles from "./page.module.css";

function WritePostForm() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultCategory = searchParams.get("category") || "일반";

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: defaultCategory,
    is_pinned: false,
  });
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [error, setError] = useState("");

  const categories = ["공지사항", "업무 공지", "회사 알림", "일반"];

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // 권한 확인
  useEffect(() => {
    const checkPermission = async () => {
      if (!user) return;

      try {
        const hasPermission = await canWritePost(user.id, formData.category);
        setCanWrite(hasPermission);
      } catch (error) {
        console.error("권한 확인 오류:", error);
        setCanWrite(false);
      }
    };

    checkPermission();
  }, [user, formData.category]);

  // 카테고리 변경 시 권한 재확인
  const handleCategoryChange = async (category: string) => {
    setFormData((prev) => ({ ...prev, category }));

    if (user) {
      try {
        const hasPermission = await canWritePost(user.id, category);
        setCanWrite(hasPermission);
      } catch (error) {
        console.error("권한 확인 오류:", error);
        setCanWrite(false);
      }
    }
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("로그인이 필요합니다.");
      return;
    }

    if (!canWrite) {
      setError("해당 카테고리에 글을 쓸 권한이 없습니다.");
      return;
    }

    if (!formData.title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }

    if (!formData.content.trim()) {
      setError("내용을 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await createPost(user.id, formData, attachedFiles);

      if (result.success) {
        alert("게시글이 성공적으로 작성되었습니다!");
        router.push("/board");
      } else {
        setError(result.error || "게시글 작성에 실패했습니다.");
      }
    } catch (error) {
      console.error("게시글 작성 오류:", error);
      setError("게시글 작성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 파일 첨부
  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalSize =
      attachedFiles.reduce((sum, file) => sum + file.size, 0) +
      files.reduce((sum, file) => sum + file.size, 0);

    // 파일 크기 제한 (10MB)
    if (totalSize > 10 * 1024 * 1024) {
      alert("첨부 파일의 총 크기는 10MB를 초과할 수 없습니다.");
      return;
    }

    // 파일 개수 제한 (5개)
    if (attachedFiles.length + files.length > 5) {
      alert("첨부 파일은 최대 5개까지 가능합니다.");
      return;
    }

    setAttachedFiles((prev) => [...prev, ...files]);
    e.target.value = ""; // 파일 입력 초기화
  };

  // 파일 제거
  const handleFileRemove = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 취소
  const handleCancel = () => {
    if (
      formData.title.trim() ||
      formData.content.trim() ||
      attachedFiles.length > 0
    ) {
      if (confirm("작성 중인 내용이 있습니다. 정말 취소하시겠습니까?")) {
        router.push("/board");
      }
    } else {
      router.push("/board");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">인증 상태 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className={styles.container}>
        {/* 헤더 */}
        <div className={styles.header}>
          <button onClick={handleCancel} className={styles.backButton}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className={styles.title}>게시글 작성</h1>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* 카테고리 선택 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>카테고리</label>
            <select
              value={formData.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className={styles.select}
              disabled={loading}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* 제목 입력 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>제목</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className={styles.input}
              placeholder="제목을 입력하세요"
              disabled={loading}
              required
            />
          </div>

          {/* 내용 입력 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>내용</label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              className={styles.textarea}
              placeholder="내용을 입력하세요"
              rows={10}
              disabled={loading}
              required
            />
          </div>

          {/* 고정글 설정 */}
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.is_pinned}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_pinned: e.target.checked,
                  }))
                }
                className={styles.checkbox}
                disabled={loading}
              />
              <span>고정글으로 설정</span>
            </label>
          </div>

          {/* 파일 첨부 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>파일 첨부</label>
            <input
              type="file"
              onChange={handleFileAttach}
              multiple
              className={styles.fileInput}
              disabled={loading}
            />
            <p className={styles.fileHelp}>
              최대 5개 파일, 총 10MB까지 첨부 가능합니다.
            </p>

            {/* 첨부된 파일 목록 */}
            {attachedFiles.length > 0 && (
              <div className="space-y-2">
                {attachedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 text-xs font-medium">
                          {file.name.split(".").pop()?.toUpperCase() || "FILE"}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 truncate max-w-xs">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFileRemove(index)}
                      className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                      disabled={loading}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 오류 메시지 */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <X className="w-4 h-4 inline mr-2" />
              취소
            </button>
            <button
              type="submit"
              disabled={loading || !canWrite}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline mr-2"></div>
                  작성 중...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 inline mr-2" />
                  작성하기
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function WritePostPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WritePostForm />
    </Suspense>
  );
}
