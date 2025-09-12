"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/components/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Navigation";
import ApprovalFormRenderer from "@/components/ApprovalFormRenderer";
import { getApprovalDocument, updateApprovalDocument } from "@/lib/approval";
import type { ApprovalDocument } from "@/types/approval";
import { ArrowLeft } from "lucide-react";
import styles from "./page.module.css";

function EditApprovalContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const documentId = params.id as string;

  const [document, setDocument] = useState<ApprovalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 문서 로드
  useEffect(() => {
    if (documentId) {
      loadDocument();
    }
  }, [documentId]);

  const loadDocument = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getApprovalDocument(documentId, user?.id);

      if (result.success && result.data) {
        // 수정 권한 확인
        if (result.data.applicant_id !== user?.id) {
          setError("이 문서를 수정할 권한이 없습니다.");
          return;
        }

        if (result.data.status !== "draft") {
          setError("임시저장된 문서만 수정할 수 있습니다.");
          return;
        }

        setDocument(result.data);
      } else {
        setError(result.error || "문서를 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("문서 로드 오류:", error);
      setError("문서를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: Record<string, any>) => {
    if (!document || !user) return;

    setSaving(true);
    try {
      const result = await updateApprovalDocument(document.id, {
        form_data: formData,
        updated_at: new Date().toISOString(),
      });

      if (result.success) {
        alert("임시저장되었습니다.");
        setDocument({ ...document, form_data: formData });
      } else {
        alert(result.error || "저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("저장 오류:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (formData: Record<string, any>) => {
    if (!document || !user) return;

    setSaving(true);
    try {
      const result = await updateApprovalDocument(document.id, {
        form_data: formData,
        status: "submitted",
        updated_at: new Date().toISOString(),
      });

      if (result.success) {
        alert("제출되었습니다.");
        router.push(`/approval/${document.id}`);
      } else {
        alert(result.error || "제출에 실패했습니다.");
      }
    } catch (error) {
      console.error("제출 오류:", error);
      alert("제출 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (confirm("작성 중인 내용이 사라집니다. 정말 취소하시겠습니까?")) {
      router.push(`/approval/${documentId}`);
    }
  };

  if (isLoading || loading) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.loadingContainer}>
          <div className={styles.loading}>문서를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.errorContainer}>
          <div className={styles.error}>
            <h2>오류가 발생했습니다</h2>
            <p>{error}</p>
            <button
              className={styles.backButton}
              onClick={() => router.push(`/approval/${documentId}`)}
            >
              문서로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header />

      <main className={styles.main}>
        <div className={styles.header}>
          <button
            className={styles.backButton}
            onClick={() => router.push(`/approval/${documentId}`)}
          >
            <ArrowLeft size={20} />
            문서로 돌아가기
          </button>
          <h1 className={styles.title}>문서 수정</h1>
        </div>

        <div className={styles.documentInfo}>
          <h2 className={styles.documentTitle}>{document.title}</h2>
          <p className={styles.documentStatus}>상태: 임시저장</p>
        </div>

        {document.template && (
          <ApprovalFormRenderer
            template={document.template}
            initialData={document.form_data}
            onSubmit={handleSubmit}
            onSave={handleSave}
            readonly={false}
            loading={saving}
          />
        )}

        <div className={styles.actionButtons}>
          <button
            className={styles.cancelButton}
            onClick={handleCancel}
            disabled={saving}
          >
            취소
          </button>
        </div>
      </main>
    </div>
  );
}

export default function EditApprovalPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.container}>
          <Header />
          <div className={styles.loadingContainer}>
            <div className={styles.loading}>문서를 불러오는 중...</div>
          </div>
        </div>
      }
    >
      <EditApprovalContent />
    </Suspense>
  );
}
