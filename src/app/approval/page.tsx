"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import Header from "@/components/Navigation";
import ApprovalFormSelectModal from "@/components/ApprovalFormSelectModal";
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  getApprovalDocuments,
  getPendingApprovalDocuments,
} from "@/lib/approval";
import styles from "./page.module.css";

interface ApprovalDocument {
  id: string;
  title: string;
  status:
    | "draft"
    | "submitted"
    | "pending"
    | "approved"
    | "rejected"
    | "cancelled";
  priority: "low" | "normal" | "high" | "urgent";
  applicant_name: string;
  current_approver_name?: string;
  created_at: string;
  updated_at: string;
}

interface FormTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  fields: any[];
  approval_flow: any[];
  required_attachments: string[];
}

export default function ApprovalPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [documents, setDocuments] = useState<ApprovalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "my-documents" | "pending-approvals"
  >("my-documents");
  const [canApprove, setCanApprove] = useState(false);

  // 인증 상태 확인 및 리다이렉트
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  // 사용자 직급 확인 및 문서 목록 로드
  useEffect(() => {
    if (user) {
      checkApprovalPermission();
      loadDocuments();
    }
  }, [user, activeTab]);

  const checkApprovalPermission = () => {
    // 경영지원본부는 직급과 관계없이 결재 권한 있음
    if (user?.branch === "경영지원본부") {
      setCanApprove(true);
      return;
    }

    // 그 외는 이사(level 5) 이상만 결재 권한 있음
    if (!user?.positions?.level) {
      setCanApprove(false);
      return;
    }

    setCanApprove(user.positions.level >= 5);
  };

  const loadDocuments = async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        setDocuments([]);
        setLoading(false);
        return;
      }

      let result;

      if (activeTab === "my-documents") {
        // 내가 작성한 문서들 조회
        result = await getApprovalDocuments(user.id);
      } else {
        // 내가 결재해야 할 문서들 조회
        result = await getPendingApprovalDocuments(user.id);
      }

      if (result.success && result.data) {
        // 데이터 변환
        const transformedDocuments: ApprovalDocument[] = result.data.map(
          (doc: any) => ({
            id: doc.id,
            title: doc.title,
            status: doc.status,
            priority: doc.priority,
            applicant_name: doc.applicant?.name || "알 수 없음",
            current_approver_name: doc.current_approver?.name || null,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
          })
        );

        setDocuments(transformedDocuments);
      } else {
        console.error("문서 로드 실패:", result.error);
        setDocuments([]);
      }
    } catch (error) {
      console.error("문서 로드 오류:", error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSelect = (template: FormTemplate) => {
    // 양식 작성 페이지로 이동
    router.push(`/approval/create?template=${template.id}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <FileText size={16} className={styles.statusDraft} />;
      case "submitted":
        return <Clock size={16} className={styles.statusSubmitted} />;
      case "pending":
        return <Clock size={16} className={styles.statusPending} />;
      case "approved":
        return <CheckCircle size={16} className={styles.statusApproved} />;
      case "rejected":
        return <XCircle size={16} className={styles.statusRejected} />;
      case "cancelled":
        return <AlertCircle size={16} className={styles.statusCancelled} />;
      default:
        return <FileText size={16} />;
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return styles.priorityUrgent;
      case "high":
        return styles.priorityHigh;
      case "normal":
        return styles.priorityNormal;
      case "low":
        return styles.priorityLow;
      default:
        return styles.priorityNormal;
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

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>전자결재</h1>
          <p className={styles.subtitle}>
            {user?.branch} - {user?.name}님의 결재 문서를 관리하세요
          </p>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              activeTab === "my-documents" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("my-documents")}
          >
            내 문서
          </button>
          {canApprove && (
            <button
              className={`${styles.tab} ${
                activeTab === "pending-approvals" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("pending-approvals")}
            >
              결재 대기
            </button>
          )}
        </div>

        <div className={styles.actions}>
          <button
            className={styles.createButton}
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={20} />새 결재 작성
          </button>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>문서를 불러오는 중...</div>
          ) : documents.length === 0 ? (
            <div className={styles.emptyState}>
              <FileText size={48} className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>결재할 문서가 없습니다</h3>
              <p className={styles.emptyDescription}>
                아직 작성한 결재 문서가 없습니다.
              </p>
              <button
                className={styles.createButton}
                onClick={() => setIsModalOpen(true)}
              >
                <Plus size={20} />새 결재 작성
              </button>
            </div>
          ) : (
            <div className={styles.documentList}>
              <div className={styles.tableHeader}>
                <div className={styles.headerCell}>긴급</div>
                <div className={styles.headerCell}>제목</div>
                <div className={styles.headerCell}>상태</div>
                <div className={styles.headerCell}>신청자</div>
                <div className={styles.headerCell}>승인자</div>
                <div className={styles.headerCell}>작성일</div>
              </div>

              {documents.map((document) => (
                <div
                  key={document.id}
                  className={styles.documentRow}
                  onClick={() => router.push(`/approval/${document.id}`)}
                >
                  <div className={styles.cell}>
                    <span
                      className={`${styles.priorityBadge} ${getPriorityColor(
                        document.priority
                      )}`}
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
                  <div className={styles.cell}>
                    <div className={styles.documentTitle}>
                      {getStatusIcon(document.status)}
                      {document.title}
                    </div>
                  </div>
                  <div className={styles.cell}>
                    <span
                      className={`${styles.statusBadge} ${
                        styles[
                          `status${
                            document.status.charAt(0).toUpperCase() +
                            document.status.slice(1)
                          }`
                        ]
                      }`}
                    >
                      {getStatusText(document.status)}
                    </span>
                  </div>
                  <div className={styles.cell}>{document.applicant_name}</div>
                  <div className={styles.cell}>
                    {document.current_approver_name || "-"}
                  </div>
                  <div className={styles.cell}>
                    {formatDate(document.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <ApprovalFormSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleFormSelect}
        userBranch={user?.branch}
        userId={user?.id}
      />
    </div>
  );
}
