"use client";

import { useAuth } from "@/components/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/Navigation";
import { getPostById, updatePost, deleteAttachment } from "@/lib/board";
import { ArrowLeft, Save, X, Trash2 } from "lucide-react";
import styles from "./page.module.css";

export default function EditPostPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    is_pinned: false,
  });
  const [post, setPost] = useState<any>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isAuthor, setIsAuthor] = useState(false);

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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

  // 새로 첨부된 파일 제거
  const handleFileRemove = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 첨부파일 삭제
  const handleDeleteAttachment = async (
    attachmentId: string,
    fileName: string
  ) => {
    if (!confirm(`"${fileName}" 첨부파일을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const result = await deleteAttachment(attachmentId);

      if (result.success) {
        // 로컬 상태에서 첨부파일 제거
        setPost((prev: any) =>
          prev
            ? {
                ...prev,
                attachments:
                  prev.attachments?.filter(
                    (att: any) => att.id !== attachmentId
                  ) || [],
              }
            : null
        );

        alert("첨부파일이 삭제되었습니다.");
      } else {
        alert(result.error || "첨부파일 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("첨부파일 삭제 오류:", error);
      alert("첨부파일 삭제 중 오류가 발생했습니다.");
    }
  };

  const categories = ["공지사항", "업무 공지", "회사 알림", "일반"];

  // 게시글 조회
  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;

      try {
        setLoading(true);
        const postData = await getPostById(postId);

        if (postData) {
          console.log("=== 게시글 수정 권한 디버깅 ===");
          console.log("현재 사용자 ID:", user?.id);
          console.log("게시글 작성자 ID:", postData.user_id);
          console.log("게시글 데이터:", postData);
          console.log("================================");

          // 작성자 여부 확인 (user_id 필드 사용)
          if (user?.id !== postData.user_id) {
            console.error("권한 확인 실패:", {
              currentUser: user?.id,
              postAuthor: postData.user_id,
              isEqual: user?.id === postData.user_id,
            });
            alert("수정 권한이 없습니다.");
            router.push(`/board/${postId}`);
            return;
          }

          setIsAuthor(true);
          setPost(postData);
          setFormData({
            title: postData.title,
            content: postData.content,
            category: postData.category,
            is_pinned: postData.is_pinned,
          });
        } else {
          alert("게시글을 찾을 수 없습니다.");
          router.push("/board");
        }
      } catch (error) {
        console.error("게시글 조회 오류:", error);
        alert("게시글을 불러오는 중 오류가 발생했습니다.");
        router.push("/board");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPost();
    }
  }, [postId, user, router]);

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("로그인이 필요합니다.");
      return;
    }

    if (!isAuthor) {
      setError("수정 권한이 없습니다.");
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
      setSaving(true);
      setError("");

      const result = await updatePost(postId, formData, attachedFiles);

      if (result.success) {
        alert("게시글이 성공적으로 수정되었습니다!");
        router.push(`/board/${postId}`);
      } else {
        setError(result.error || "게시글 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("게시글 수정 오류:", error);
      setError("게시글 수정 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 취소
  const handleCancel = () => {
    if (formData.title.trim() || formData.content.trim()) {
      if (confirm("수정 중인 내용이 있습니다. 정말 취소하시겠습니까?")) {
        router.push(`/board/${postId}`);
      }
    } else {
      router.push(`/board/${postId}`);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">게시글을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">수정 권한이 없습니다.</p>
        </div>
      </div>
    );
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
          <h1 className={styles.title}>게시글 수정</h1>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* 카테고리 선택 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>카테고리</label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, category: e.target.value }))
              }
              className={styles.select}
              disabled={saving}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* 제목 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              제목 <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className={styles.input}
              placeholder="제목을 입력하세요"
              disabled={saving}
              required
            />
          </div>

          {/* 내용 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              내용 <span className={styles.required}>*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              className={styles.textarea}
              placeholder="내용을 입력하세요"
              disabled={saving}
              required
            />
          </div>

          {/* 고정 여부 */}
          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="is_pinned"
              checked={formData.is_pinned}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  is_pinned: e.target.checked,
                }))
              }
              className={styles.checkbox}
              disabled={saving}
            />
            <label htmlFor="is_pinned" className={styles.checkboxLabel}>
              상단 고정
            </label>
          </div>

          {/* 기존 첨부파일 표시 */}
          {post?.attachments && post.attachments.length > 0 && (
            <div className={styles.existingAttachments}>
              <h3 className={styles.existingAttachmentsTitle}>기존 첨부파일</h3>
              <div className={styles.attachmentList}>
                {post.attachments.map((attachment: any, index: number) => (
                  <div key={index} className={styles.attachmentItem}>
                    <div className={styles.attachmentInfo}>
                      <div className={styles.attachmentIcon}>
                        {attachment.file_name.split(".").pop()?.toUpperCase() ||
                          "FILE"}
                      </div>
                      <span className={styles.attachmentName}>
                        {attachment.file_name}
                      </span>
                    </div>
                    <div className={styles.attachmentActions}>
                      <span className={styles.attachmentSize}>
                        {formatFileSize(attachment.file_size)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteAttachment(
                            attachment.id,
                            attachment.file_name
                          )
                        }
                        className={styles.deleteAttachmentButton}
                        title="첨부파일 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className={styles.attachmentNote}>
                * 기존 첨부파일은 수정 시 유지됩니다.
              </p>
            </div>
          )}

          {/* 새로운 파일 첨부 */}
          <div className={styles.fileSection}>
            <label className={styles.label}>새 파일 첨부</label>
            <div className={styles.fileUploadRow}>
              <input
                type="file"
                multiple
                onChange={handleFileAttach}
                className={styles.fileInput}
                id="file-upload-edit"
                disabled={saving}
              />
              <label htmlFor="file-upload-edit" className={styles.fileButton}>
                파일 선택
              </label>
              <span className={styles.fileInfo}>
                최대 5개, 총 10MB까지 첨부 가능
              </span>
            </div>

            {/* 새로 첨부된 파일 목록 */}
            {attachedFiles.length > 0 && (
              <div className={styles.attachedFiles}>
                <h4 className={styles.attachedFilesTitle}>새로 첨부할 파일</h4>
                <div className={styles.fileList}>
                  {attachedFiles.map((file, index) => (
                    <div key={index} className={styles.fileItem}>
                      <div className={styles.fileInfo}>
                        <div className={styles.fileIcon}>
                          {file.name.split(".").pop()?.toUpperCase() || "FILE"}
                        </div>
                        <div className={styles.fileDetails}>
                          <p className={styles.fileName}>{file.name}</p>
                          <p className={styles.fileSize}>
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFileRemove(index)}
                        className={styles.removeButton}
                        disabled={saving}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 오류 메시지 */}
          {error && (
            <div className={styles.errorMessage}>
              <p className={styles.errorText}>{error}</p>
            </div>
          )}

          {/* 버튼 */}
          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className={styles.cancelButton}
            >
              <X className="w-4 h-4" />
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className={styles.submitButton}
            >
              {saving ? (
                <>
                  <div className={styles.loadingSpinner}></div>
                  수정 중...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  수정하기
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
