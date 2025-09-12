"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/components/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Navigation";
import ApprovalFormRenderer from "@/components/ApprovalFormRenderer";
import {
  getApprovalDocument,
  processApproval,
  getApprovalHistory,
} from "@/lib/approval";
import type { ApprovalDocument } from "@/types/approval";
import { CheckCircle, XCircle, ArrowLeft, Clock, FileText } from "lucide-react";
import styles from "./page.module.css";

function ApprovalDetailContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const documentId = params.id as string;

  const [document, setDocument] = useState<ApprovalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [comment, setComment] = useState("");
  const [approvalHistory, setApprovalHistory] = useState<any[]>([]);

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
        console.log("Document loaded:", result.data);
        console.log("Applicant name:", result.data.applicant_name);
        console.log("Applicant branch:", result.data.applicant_branch);
        setDocument(result.data);

        // 승인 이력도 함께 로드
        const historyResult = await getApprovalHistory(documentId);
        if (historyResult.success && historyResult.data) {
          setApprovalHistory(historyResult.data);
        }
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

  const handleApproval = async (action: "approve" | "reject") => {
    if (!document || !user) return;

    setProcessing(true);
    try {
      const result = await processApproval(
        {
          document_id: document.id,
          action,
          comment: comment.trim() || undefined,
        },
        user.id
      );

      if (result.success) {
        alert(action === "approve" ? "승인되었습니다." : "반려되었습니다.");
        loadDocument(); // 문서 상태 새로고침
      } else {
        alert(result.error || "처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("승인 처리 오류:", error);
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <FileText size={20} className={styles.statusDraft} />;
      case "submitted":
      case "pending":
        return <Clock size={20} className={styles.statusPending} />;
      case "approved":
        return <CheckCircle size={20} className={styles.statusApproved} />;
      case "rejected":
        return <XCircle size={20} className={styles.statusRejected} />;
      default:
        return <FileText size={20} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "draft":
        return "임시저장";
      case "submitted":
        return "제출됨";
      case "pending":
        return "승인대기";
      case "approved":
        return "승인됨";
      case "rejected":
        return "반려됨";
      case "cancelled":
        return "취소됨";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canApprove = () => {
    if (!user || !document) return false;

    // 경영지원본부 실장만 승인 가능
    const isApprover = user.branch === "경영지원본부" && user.name === "경영";

    return (
      isApprover &&
      (document.status === "submitted" || document.status === "pending")
    );
  };

  const canEdit = () => {
    if (!user || !document) return false;
    return document.applicant_id === user.id && document.status === "draft";
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

      <main className={styles.main}>
        <div className={styles.header}>
          <button
            className={styles.backButton}
            onClick={() => router.push("/approval")}
          >
            <ArrowLeft size={20} />
            목록으로
          </button>
          <h1 className={styles.title}>{document.title}</h1>
        </div>

        <div className={styles.documentInfo}>
          <div className={styles.infoRow}>
            <span className={styles.label}>문서 ID:</span>
            <span className={styles.value}>{document.id}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>상태:</span>
            <span
              className={`${styles.status} ${
                styles[
                  `status${
                    document.status.charAt(0).toUpperCase() +
                    document.status.slice(1)
                  }`
                ]
              }`}
            >
              {getStatusIcon(document.status)}
              {getStatusText(document.status)}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>신청자:</span>
            <span className={styles.value}>{document.applicant_name}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>현재 승인자:</span>
            <span className={styles.value}>
              {document.current_approver_name || "-"}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>우선순위:</span>
            <span
              className={`${styles.priority} ${
                styles[
                  `priority${
                    document.priority.charAt(0).toUpperCase() +
                    document.priority.slice(1)
                  }`
                ]
              }`}
            >
              {document.priority === "urgent"
                ? "긴급"
                : document.priority === "high"
                ? "높음"
                : document.priority === "normal"
                ? "보통"
                : "낮음"}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>작성일:</span>
            <span className={styles.value}>
              {formatDate(document.created_at)}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>수정일:</span>
            <span className={styles.value}>
              {formatDate(document.updated_at)}
            </span>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>양식 내용</h2>
          {document.template && (
            <>
              {console.log("Passing documentInfo:", {
                applicant_name: document.applicant_name,
                applicant_branch: document.applicant_branch,
              })}
              <ApprovalFormRenderer
                template={document.template}
                initialData={document.form_data}
                readonly={!canEdit()}
                loading={false}
                onSubmit={() => {}} // 읽기 전용이므로 빈 함수
                onSave={() => {}} // 읽기 전용이므로 빈 함수
                documentInfo={{
                  applicant_name: document.applicant_name,
                  applicant_branch: document.applicant_branch,
                }}
              />
            </>
          )}
        </div>

        {canApprove() && (
          <div className={styles.approvalSection}>
            <h2 className={styles.sectionTitle}>승인 처리</h2>
            <div className={styles.commentSection}>
              <label htmlFor="comment" className={styles.commentLabel}>
                의견 (선택사항)
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="승인 또는 반려 사유를 입력해주세요."
                className={styles.commentTextarea}
                rows={4}
              />
            </div>
            <div className={styles.actionButtons}>
              <button
                className={`${styles.actionButton} ${styles.approveButton}`}
                onClick={() => handleApproval("approve")}
                disabled={processing}
              >
                <CheckCircle size={20} />
                승인
              </button>
              <button
                className={`${styles.actionButton} ${styles.rejectButton}`}
                onClick={() => handleApproval("reject")}
                disabled={processing}
              >
                <XCircle size={20} />
                반려
              </button>
            </div>
          </div>
        )}

        {/* 승인 이력 섹션 */}
        {approvalHistory.length > 0 && (
          <div className={styles.historySection}>
            <h2 className={styles.sectionTitle}>승인 이력</h2>
            <div className={styles.historyList}>
              {approvalHistory.map((history, index) => (
                <div key={history.id} className={styles.historyItem}>
                  <div className={styles.historyHeader}>
                    <div className={styles.historyInfo}>
                      <span className={styles.historyApprover}>
                        {history.approver?.name || "승인자"}
                      </span>
                      <span
                        className={`${styles.historyAction} ${
                          history.action === "approve"
                            ? styles.approved
                            : styles.rejected
                        }`}
                      >
                        {history.action === "approve" ? "승인" : "반려"}
                      </span>
                    </div>
                    <span className={styles.historyDate}>
                      {new Date(history.created_at).toLocaleString("ko-KR")}
                    </span>
                  </div>
                  {history.comment && (
                    <div className={styles.historyComment}>
                      "{history.comment}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {canEdit() && (
          <div className={styles.editSection}>
            <button
              className={styles.editButton}
              onClick={() => router.push(`/approval/${document.id}/edit`)}
            >
              수정하기
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ApprovalDetailPage() {
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
      <ApprovalDetailContent />
    </Suspense>
  );
}
