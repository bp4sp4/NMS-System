"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Upload,
  User,
  FileText,
  Save,
  Send,
  Info,
  X,
} from "lucide-react";
import type {
  FormTemplate,
  FormField,
  DynamicFormProps,
} from "@/types/approval";
import { getApproverTitle, getApproverInfo } from "@/lib/approval";
import { useAuth } from "@/components/AuthContext";
import styles from "./ApprovalFormRenderer.module.css";

export default function ApprovalFormRenderer({
  template,
  initialData = {},
  onSubmit,
  onSave,
  readonly = false,
  loading = false,
  documentInfo,
}: DynamicFormProps & {
  documentInfo?: { applicant_name?: string; applicant_branch?: string };
}) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 휴가 기간 계산
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setFormData((prev) => ({ ...prev, days: diffDays }));
    }
  }, [formData.startDate, formData.endDate]);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));

    // 에러 클리어
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // fields가 배열인지 확인하고 안전하게 처리
    const fields = Array.isArray(template.fields) ? template.fields : [];

    fields.forEach((field) => {
      if (
        field.required &&
        (!formData[field.name] || formData[field.name] === "")
      ) {
        newErrors[field.name] = `${field.label}은(는) 필수 입력 항목입니다.`;
      }

      // 날짜 유효성 검사
      if (field.type === "date" && formData[field.name]) {
        const date = new Date(formData[field.name]);
        if (isNaN(date.getTime())) {
          newErrors[field.name] = "올바른 날짜를 입력해주세요.";
        }
      }

      // 숫자 유효성 검사
      if (field.type === "number" && formData[field.name]) {
        const num = Number(formData[field.name]);
        if (isNaN(num) || num < 0) {
          newErrors[field.name] = "올바른 숫자를 입력해주세요.";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (action: "submit" | "save") => {
    // 결재요청 시에만 유효성 검사
    if (action === "submit" && !validateForm()) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (action === "submit") {
        // 결재요청 - 바로 결재 프로세스 시작
        await onSubmit(formData);
      } else if (action === "save" && onSave) {
        // 임시저장 - 나중에 수정 가능
        await onSave(formData);
      }
    } catch (error) {
      console.error("양식 처리 오류:", error);
      alert("처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name] || "";
    const error = errors[field.name];

    switch (field.type) {
      case "text":
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            disabled={readonly}
            className={`${styles.input} ${error ? styles.inputError : ""}`}
          />
        );

      case "date":
        return (
          <div className={styles.dateInput}>
            <input
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              disabled={readonly}
              className={`${styles.input} ${error ? styles.inputError : ""}`}
            />
            <Calendar size={16} className={styles.dateIcon} />
          </div>
        );

      case "number":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            disabled={readonly}
            className={`${styles.input} ${error ? styles.inputError : ""}`}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case "select":
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            disabled={readonly}
            className={`${styles.select} ${error ? styles.inputError : ""}`}
          >
            <option value="">선택</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case "textarea":
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            disabled={readonly}
            rows={4}
            className={`${styles.textarea} ${error ? styles.inputError : ""}`}
          />
        );

      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return `${date.toLocaleDateString("ko-KR")}(${days[date.getDay()]})`;
  };

  // 동적 결재선 렌더링
  const renderApprovalLine = () => {
    if (!template.approval_flow?.steps) return null;

    return (
      <>
        {/* 승인자들만 표시 */}
        {template.approval_flow.steps.map((step, index) => {
          const title = getApproverTitle(step.approverType);
          const approverInfo = getApproverInfo(step.approverType);

          return (
            <div key={index} className={styles.approverItem}>
              <div className={styles.approverTitle}>{title}</div>
              <div className={styles.approverName}>{approverInfo.name}</div>
              <div className={styles.approverDept}>{approverInfo.dept}</div>
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className={styles.container}>
      {/* 메인 양식 영역 */}
      <div className={styles.formContainer}>
        <div className={styles.formContent}>
          {/* 제목 */}
          <div className={styles.formTitle}>
            <h1>{template.name}</h1>
          </div>

          {/* 작성 정보 및 결재선 */}
          <div className={styles.headerInfo}>
            <div className={styles.writerInfo}>
              <table className={styles.infoTable}>
                <tbody>
                  <tr>
                    <td className={styles.labelCell}>작성일자</td>
                    <td className={styles.valueCell}>
                      {formatDate(new Date().toISOString())}
                    </td>
                  </tr>
                  <tr>
                    <td className={styles.labelCell}>신청부서</td>
                    <td className={styles.valueCell}>
                      {documentInfo?.applicant_branch ||
                        user?.branch ||
                        "부서 미설정"}
                    </td>
                  </tr>
                  <tr>
                    <td className={styles.labelCell}>신청자</td>
                    <td className={styles.valueCell}>
                      {documentInfo?.applicant_name ||
                        user?.name ||
                        "사용자 미설정"}
                    </td>
                  </tr>
                  <tr>
                    <td className={styles.labelCell}>참조자</td>
                    <td className={styles.valueCell}>
                      <input
                        type="text"
                        placeholder="정채림 사원"
                        className={styles.referenceInput}
                        disabled={readonly}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={styles.approvalLine}>
              <div className={styles.approvalLabel}>결재선</div>
              <div className={styles.approverInfo}>{renderApprovalLine()}</div>
            </div>
          </div>

          {/* 양식 필드들 - 테이블 형태 */}
          <div className={styles.formFields}>
            <table className={styles.formTable}>
              <tbody>
                {Array.isArray(template.fields) &&
                  template.fields.map((field) => (
                    <tr key={field.name} className={styles.tableRow}>
                      <td className={styles.tableLabel}>
                        {field.required && (
                          <span className={styles.required}>*</span>
                        )}
                        {field.label}
                      </td>
                      <td className={styles.tableValue}>
                        {renderField(field)}
                        {errors[field.name] && (
                          <div className={styles.errorMessage}>
                            {errors[field.name]}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}

                {/* 휴가 기간 특별 처리 */}
                {template.name === "휴가신청서" && (
                  <tr className={styles.tableRow}>
                    <td className={styles.tableLabel}>
                      <span className={styles.required}>*</span>
                      휴가 기간
                    </td>
                    <td className={styles.tableValue}>
                      <div className={styles.dateRangeInput}>
                        <div className={styles.dateInput}>
                          <input
                            type="date"
                            value={formData.startDate || ""}
                            onChange={(e) =>
                              handleFieldChange("startDate", e.target.value)
                            }
                            disabled={readonly}
                            className={`${styles.input} ${
                              errors.startDate ? styles.inputError : ""
                            }`}
                          />
                          <Calendar size={16} className={styles.dateIcon} />
                        </div>
                        <span className={styles.dateSeparator}>~</span>
                        <div className={styles.dateInput}>
                          <input
                            type="date"
                            value={formData.endDate || ""}
                            onChange={(e) =>
                              handleFieldChange("endDate", e.target.value)
                            }
                            disabled={readonly}
                            className={`${styles.input} ${
                              errors.endDate ? styles.inputError : ""
                            }`}
                          />
                          <Calendar size={16} className={styles.dateIcon} />
                        </div>
                        <div className={styles.daysInfo}>
                          <span>사용일수:</span>
                          <input
                            type="number"
                            value={formData.days || 0}
                            onChange={(e) =>
                              handleFieldChange("days", e.target.value)
                            }
                            disabled={readonly}
                            className={styles.daysInput}
                            min="1"
                          />
                          <span>일</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 첨부파일 안내 */}
          {template.required_attachments &&
            template.required_attachments.length > 0 && (
              <div className={styles.attachmentGuide}>
                <h4>첨부파일 안내</h4>
                <ul>
                  {template.required_attachments.map((attachment, index) => (
                    <li key={index}>{attachment}</li>
                  ))}
                </ul>
              </div>
            )}

          {/* 파일 첨부 영역 */}
          <div className={styles.fileUploadSection}>
            <div className={styles.fileUploadHeader}>
              <label className={styles.fileUploadLabel}>
                파일첨부
                <Info size={14} className={styles.infoIcon} />
              </label>
            </div>
            <div className={styles.fileUploadArea}>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className={styles.fileInput}
                disabled={readonly}
              />
              <div className={styles.fileUploadContent}>
                <Upload size={24} className={styles.uploadIcon} />
                <p>이 곳에 파일을 드래그 하세요. 또는 파일선택 (0MB)</p>
              </div>
            </div>

            {/* 첨부된 파일 목록 */}
            {attachedFiles.length > 0 && (
              <div className={styles.attachedFiles}>
                {attachedFiles.map((file, index) => (
                  <div key={index} className={styles.attachedFile}>
                    <FileText size={16} />
                    <span className={styles.fileName}>{file.name}</span>
                    <span className={styles.fileSize}>
                      ({(file.size / 1024 / 1024).toFixed(2)}MB)
                    </span>
                    {!readonly && (
                      <button
                        onClick={() => removeFile(index)}
                        className={styles.removeFileButton}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 관련 문서 */}
          <div className={styles.relatedDocuments}>
            <label className={styles.relatedDocsLabel}>관련문서</label>
            <button className={styles.documentSearchButton}>문서 검색</button>
          </div>
        </div>

        {/* 우측 사이드바 - 결재선 */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarTabs}>
            <button className={`${styles.sidebarTab} ${styles.activeTab}`}>
              결재선
            </button>
          </div>

          <div className={styles.approvalFlow}>
            {/* 기안자 */}
            <div className={styles.approvalStep}>
              <div className={styles.approverAvatar}>
                <User size={20} />
              </div>
              <div className={styles.approverDetails}>
                <div className={styles.approverName}>
                  {documentInfo?.applicant_name || user?.name || "작성자"}
                </div>
                <div className={styles.approverDept}>
                  {documentInfo?.applicant_branch || user?.branch || "부서"}
                </div>
                <div className={styles.approvalStatus}>기안</div>
              </div>
            </div>

            {/* 동적 결재선 */}
            {template.approval_flow?.steps?.map((step, index) => {
              const title = getApproverTitle(step.approverType);
              const approverInfo = getApproverInfo(step.approverType);

              return (
                <div key={index}>
                  <div className={styles.approvalArrow}>↓</div>
                  <div className={styles.approvalStep}>
                    <div className={styles.approverAvatar}>
                      <User size={20} />
                    </div>
                    <div className={styles.approverDetails}>
                      <div className={styles.approverName}>
                        {approverInfo.name} {title}
                      </div>
                      <div className={styles.approverDept}>
                        {approverInfo.dept}
                      </div>
                      <div className={styles.approvalStatus}>
                        {index === 0 ? "결재 예정" : "결재 대기"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 하단 액션 바 - 읽기 전용이 아닐 때만 표시 */}
      {!readonly && (
        <div className={styles.bottomActions}>
          <div className={styles.leftActions}>
            <button
              className={styles.actionButton}
              onClick={() => handleSubmit("submit")}
              disabled={isSubmitting}
            >
              <Send size={16} />
              {isSubmitting ? "제출 중..." : "결재요청"}
            </button>
            {onSave && (
              <button
                className={styles.actionButton}
                onClick={() => handleSubmit("save")}
                disabled={isSubmitting}
                style={{ backgroundColor: "#6b7280" }}
              >
                <Save size={16} />
                임시저장
              </button>
            )}
          </div>
          <div className={styles.rightActions}>
            <select className={styles.autoSaveSelect}>
              <option>자동저장안함</option>
              <option>5분마다</option>
              <option>10분마다</option>
            </select>
            <button className={styles.listButton}>목록</button>
          </div>
        </div>
      )}
    </div>
  );
}
