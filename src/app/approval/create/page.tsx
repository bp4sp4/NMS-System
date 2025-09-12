"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/components/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Navigation";
import ApprovalFormRenderer from "@/components/ApprovalFormRenderer";
import { getFormTemplate, createApprovalDocument } from "@/lib/approval";
import type { FormTemplate } from "@/types/approval";
import styles from "./page.module.css";

function CreateApprovalContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");

  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 템플릿 로드
  useEffect(() => {
    if (templateId) {
      loadTemplate();
    } else {
      setError("양식 템플릿이 선택되지 않았습니다.");
      setLoading(false);
    }
  }, [templateId]);

  const loadTemplate = async () => {
    if (!templateId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getFormTemplate(templateId);

      if (result.success && result.data) {
        setTemplate(result.data);
      } else {
        setError(result.error || "양식 템플릿을 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("템플릿 로드 오류:", error);
      setError("양식 템플릿을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: Record<string, any>) => {
    if (!template) return;

    // 제출 시에만 로그인 체크
    if (!user) {
      alert("결재 문서를 제출하려면 로그인이 필요합니다.");
      router.push("/auth/login");
      return;
    }

    try {
      // 제목 생성 (양식명 + 날짜)
      const today = new Date().toLocaleDateString("ko-KR");
      const title = `${template.name} - ${today}`;

      const result = await createApprovalDocument(
        {
          template_id: template.id,
          title,
          form_data: formData,
          priority: "normal",
        },
        user.id
      );

      if (result.success) {
        // 성공 시 결재 문서 상세 페이지로 이동
        router.push(`/approval/${result.data?.id}`);
      } else {
        alert(result.error || "결재 문서 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("문서 제출 오류:", error);
      alert("결재 문서 제출 중 오류가 발생했습니다.");
    }
  };

  const handleSave = async (formData: Record<string, any>) => {
    if (!template) return;

    // 임시저장 시에도 로그인 체크
    if (!user) {
      alert("임시저장하려면 로그인이 필요합니다.");
      router.push("/auth/login");
      return;
    }

    try {
      // 제목 생성 (양식명 + 날짜)
      const today = new Date().toLocaleDateString("ko-KR");
      const title = `${template.name} - ${today} (임시저장)`;

      const result = await createApprovalDocument(
        {
          template_id: template.id,
          title,
          form_data: formData,
          priority: "normal",
        },
        user.id
      );

      if (result.success) {
        alert("임시저장되었습니다.");
      } else {
        alert(result.error || "임시저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("임시저장 오류:", error);
      alert("임시저장 중 오류가 발생했습니다.");
    }
  };

  const handleCancel = () => {
    if (confirm("작성 중인 내용이 사라집니다. 정말 취소하시겠습니까?")) {
      router.push("/approval");
    }
  };

  if (isLoading || loading) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.loadingContainer}>
          <div className={styles.loading}>양식을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.errorContainer}>
          <div className={styles.error}>
            <h2>오류가 발생했습니다</h2>
            <p>{error}</p>
            <button
              className={styles.backButton}
              onClick={() => router.push("/approval")}
            >
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header />
      <ApprovalFormRenderer
        template={template}
        onSubmit={handleSubmit}
        onSave={handleSave}
        readonly={false}
        loading={false}
        documentInfo={{
          applicant_name: user?.name,
          applicant_branch: user?.branch,
        }}
      />
    </div>
  );
}

export default function CreateApprovalPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.container}>
          <Header />
          <div className={styles.loadingContainer}>
            <div className={styles.loading}>양식을 불러오는 중...</div>
          </div>
        </div>
      }
    >
      <CreateApprovalContent />
    </Suspense>
  );
}
