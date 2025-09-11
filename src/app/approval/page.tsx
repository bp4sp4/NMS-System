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
    "my-documents" | "pending-approvals" | "all-documents"
  >("my-documents");

  // 인증 상태 확인 및 리다이렉트
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  // 문서 목록 로드
  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user, activeTab]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      // 실제 구현에서는 API 호출
      // 임시 데이터
      const mockDocuments: ApprovalDocument[] = [
        {
          id: "1",
          title: "휴가신청서",
          status: "pending",
          priority: "normal",
          applicant_name: user?.name || "사용자",
          current_approver_name: "김부장",
          created_at: "2024-01-15T09:00:00Z",
          updated_at: "2024-01-15T09:00:00Z",
        },
        {
          id: "2",
          title: "출장신청서",
          status: "approved",
          priority: "high",
          applicant_name: user?.name || "사용자",
          created_at: "2024-01-14T14:30:00Z",
          updated_at: "2024-01-14T16:45:00Z",
        },
        {
          id: "3",
          title: "경비정산서",
          status: "draft",
          priority: "normal",
          applicant_name: user?.name || "사용자",
          created_at: "2024-01-13T11:20:00Z",
          updated_at: "2024-01-13T11:20:00Z",
        },
      ];

      // 탭별 필터링
      let filteredDocuments = mockDocuments;
      if (activeTab === "my-documents") {
        filteredDocuments = mockDocuments.filter(
          (doc) => doc.applicant_name === user?.name
        );
      } else if (activeTab === "pending-approvals") {
        filteredDocuments = mockDocuments.filter(
          (doc) =>
            doc.status === "pending" && doc.current_approver_name === user?.name
        );
      }

      setDocuments(filteredDocuments);
    } catch (error) {
      console.error("문서 로드 오류:", error);
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

        <div className={styles.actions}>
          <button
            className={styles.createButton}
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={20} />새 결재 작성
          </button>
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
          <button
            className={`${styles.tab} ${
              activeTab === "pending-approvals" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("pending-approvals")}
          >
            승인 대기
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "all-documents" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("all-documents")}
          >
            전체 문서
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
                {activeTab === "my-documents" &&
                  "아직 작성한 결재 문서가 없습니다."}
                {activeTab === "pending-approvals" &&
                  "승인 대기 중인 문서가 없습니다."}
                {activeTab === "all-documents" && "전체 문서가 없습니다."}
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
      />
    </div>
  );
}
