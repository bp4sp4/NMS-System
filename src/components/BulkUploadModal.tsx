"use client";

import React, { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./BulkUploadModal.module.css";

interface BulkUploadData {
  customerType: string;
  courseType: string;
  course: string;
  institution: string;
  customerName: string;
  contact: string;
  education: string;
  region: string;
  subRegion: string;
  paymentDate: string;
  paymentAmount: string;
  subjectTheoryCount: number;
  subjectFaceToFaceCount: number;
  subjectPracticeCount: number;
  inflowPath: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: {
    name: string;
    branch: string;
    team: string;
  };
}

export default function BulkUploadModal({
  isOpen,
  onClose,
  onSuccess,
  user,
}: BulkUploadModalProps) {
  const [step, setStep] = useState<
    "upload" | "preview" | "processing" | "result"
  >("upload");
  const [uploadedData, setUploadedData] = useState<BulkUploadData[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [processingResults, setProcessingResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  }>({ success: 0, failed: 0, errors: [] });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSV 파일 파싱 (개선된 버전)
  const parseCSV = (csvText: string): BulkUploadData[] => {
    const lines = csvText.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      throw new Error("CSV 파일에 헤더와 데이터가 필요합니다.");
    }

    // 더 견고한 CSV 파싱
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }

      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]);
    const data: BulkUploadData[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);

        // 빈 행 건너뛰기
        if (values.every((v) => !v.trim())) continue;

        const customerType = values[0] || "가망고객";

        // 고객분류에 따라 다른 필드 매핑
        if (customerType === "가망고객") {
          data.push({
            customerType: customerType,
            courseType: values[1] || "학점은행제",
            course: values[2] || "사회복지사2급",
            institution: values[3] || "한평생학점은행",
            customerName: values[4] || "",
            contact: values[5] || "",
            education: values[6] || "고등학교 졸업",
            region: values[7] || "서울",
            subRegion: values[8] || "도봉구",
            paymentDate: "", // 가망고객은 결제 정보 없음
            paymentAmount: "", // 가망고객은 결제 정보 없음
            subjectTheoryCount: 0, // 가망고객은 과목분류 없음
            subjectFaceToFaceCount: 0,
            subjectPracticeCount: 0,
            inflowPath: values[9] || "기타",
          });
        } else {
          // 계약고객
          data.push({
            customerType: customerType,
            courseType: values[1] || "학점은행제",
            course: values[2] || "사회복지사2급",
            institution: values[3] || "한평생학점은행",
            customerName: values[4] || "",
            contact: values[5] || "",
            education: values[6] || "고등학교 졸업",
            region: values[7] || "서울",
            subRegion: values[8] || "도봉구",
            paymentDate: values[9] || "",
            paymentAmount: values[10] || "",
            subjectTheoryCount: parseInt(values[11]) || 0,
            subjectFaceToFaceCount: parseInt(values[12]) || 0,
            subjectPracticeCount: parseInt(values[13]) || 0,
            inflowPath: values[14] || "기타",
          });
        }
      } catch (error) {
        console.warn(`행 ${i + 1} 파싱 오류:`, error);
        // 오류가 있는 행은 건너뛰고 계속 진행
      }
    }

    return data;
  };

  // 데이터 검증
  const validateData = (data: BulkUploadData[]): ValidationError[] => {
    const errors: ValidationError[] = [];

    data.forEach((row, index) => {
      const rowNum = index + 2; // 헤더 포함하여 +2

      if (!row.customerName.trim()) {
        errors.push({
          row: rowNum,
          field: "customerName",
          message: "고객명은 필수입니다",
        });
      }

      if (!row.contact.trim()) {
        errors.push({
          row: rowNum,
          field: "contact",
          message: "연락처는 필수입니다",
        });
      } else if (!/^010-\d{4}-\d{4}$/.test(row.contact)) {
        errors.push({
          row: rowNum,
          field: "contact",
          message: "연락처 형식이 올바르지 않습니다 (010-0000-0000)",
        });
      }

      if (row.customerType === "계약고객") {
        if (!row.paymentDate) {
          errors.push({
            row: rowNum,
            field: "paymentDate",
            message: "계약고객은 결제일자가 필요합니다",
          });
        } else if (!/^\d{4}-\d{2}-\d{2}$/.test(row.paymentDate)) {
          errors.push({
            row: rowNum,
            field: "paymentDate",
            message: "결제일자는 YYYY-MM-DD 형식이어야 합니다 (예: 2025-12-12)",
          });
        }

        if (!row.paymentAmount || parseInt(row.paymentAmount) <= 0) {
          errors.push({
            row: rowNum,
            field: "paymentAmount",
            message: "계약고객은 결제금액이 필요합니다",
          });
        }
      }
    });

    return errors;
  };

  // 파일 업로드 처리
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 확장자 검증
    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("CSV 파일만 업로드 가능합니다.");
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        let csvText = e.target?.result as string;

        if (!csvText) {
          throw new Error("파일을 읽을 수 없습니다.");
        }

        // 인코딩 문제 해결을 위한 전처리
        csvText = preprocessCSV(csvText);

        const parsedData = parseCSV(csvText);
        const errors = validateData(parsedData);

        if (parsedData.length === 0) {
          throw new Error("유효한 데이터가 없습니다. CSV 형식을 확인해주세요.");
        }

        setUploadedData(parsedData);
        setValidationErrors(errors);
        setStep("preview");
      } catch (error) {
        console.error("CSV 파싱 오류:", error);
        alert(
          `CSV 파일 처리 중 오류가 발생했습니다: ${
            error instanceof Error ? error.message : "알 수 없는 오류"
          }`
        );
      }
    };

    reader.onerror = () => {
      alert("파일 읽기 중 오류가 발생했습니다.");
    };

    // UTF-8로 읽기 시도
    reader.readAsText(file, "UTF-8");
  };

  // CSV 전처리 함수
  const preprocessCSV = (csvText: string): string => {
    // BOM 제거
    csvText = csvText.replace(/^\uFEFF/, "");

    // 줄바꿈 정규화
    csvText = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // 빈 줄 제거
    csvText = csvText.replace(/\n\s*\n/g, "\n");

    // 따옴표 처리 개선
    csvText = csvText.replace(/"([^"]*)"([^",\n])/g, '"$1"$2');

    return csvText.trim();
  };

  // 일괄 등록 처리
  const handleBulkSubmit = async () => {
    if (validationErrors.length > 0) {
      alert("검증 오류를 먼저 수정해주세요.");
      return;
    }

    setStep("processing");

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const data of uploadedData) {
      try {
        const paymentAmount =
          parseInt(data.paymentAmount.replace(/,/g, "")) || 0;

        // 수당 계산 (기존 로직 사용)
        const commissionRates = [
          {
            courseType: "학점은행제",
            institution: "한평생학점은행",
            baseAmount: 600000,
            commission: 140000,
          },
          {
            courseType: "학점은행제",
            institution: "올티칭학점은행",
            baseAmount: 600000,
            commission: 120000,
          },
          {
            courseType: "학점은행제",
            institution: "서울사이버평생교육",
            baseAmount: 600000,
            commission: 140000,
          },
          {
            courseType: "학점은행제",
            institution: "드림원격평생교육원",
            baseAmount: 600000,
            commission: 115000,
          },
          {
            courseType: "민간 자격증",
            institution: "한평생직업훈련",
            baseAmount: 500000,
            commission: 120000,
          },
          {
            courseType: "유학",
            institution: "감자유학",
            baseAmount: 800000,
            commission: 200000,
          },
        ];

        const rate = commissionRates.find(
          (r) =>
            r.courseType === data.courseType &&
            r.institution === data.institution
        );
        const commission = rate
          ? Math.round(paymentAmount * (rate.commission / rate.baseAmount))
          : 0;

        const { error } = await supabase.from("customers").insert({
          branch: user.branch || "",
          team: user.team || "",
          manager: user.name,
          customer_type: data.customerType,
          course_type: data.courseType,
          course: data.course,
          institution: data.institution,
          customer_name: data.customerName,
          contact: data.contact,
          education: data.education,
          region: `${data.region} ${data.subRegion}`,
          status: "등록완료",
          payment_date:
            data.customerType === "계약고객" ? data.paymentDate || null : null,
          payment_amount: data.customerType === "계약고객" ? paymentAmount : 0,
          commission: data.customerType === "계약고객" ? commission : 0,
          subject_theory_count:
            data.customerType === "계약고객" && data.courseType === "학점은행제"
              ? data.subjectTheoryCount
              : 0,
          subject_face_to_face_count:
            data.customerType === "계약고객" && data.courseType === "학점은행제"
              ? data.subjectFaceToFaceCount
              : 0,
          subject_practice_count:
            data.customerType === "계약고객" && data.courseType === "학점은행제"
              ? data.subjectPracticeCount
              : 0,
          inflow_path: data.inflowPath,
        });

        if (error) {
          failedCount++;
          errors.push(`${data.customerName}: ${error.message}`);
        } else {
          successCount++;
        }
      } catch (error) {
        failedCount++;
        errors.push(`${data.customerName}: 처리 중 오류 발생`);
      }
    }

    setProcessingResults({
      success: successCount,
      failed: failedCount,
      errors,
    });
    setStep("result");
  };

  // 모달 초기화
  const resetModal = () => {
    setStep("upload");
    setUploadedData([]);
    setValidationErrors([]);
    setProcessingResults({ success: 0, failed: 0, errors: [] });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 모달 닫기
  const handleClose = () => {
    resetModal();
    // 등록 완료 후에는 데이터 새로고침을 위해 onSuccess 호출
    if (step === "result") {
      onSuccess();
    }
    onClose();
  };

  // CSV 템플릿 다운로드
  const downloadTemplate = (customerType: "가망고객" | "계약고객") => {
    let headers: string[];
    let sampleData: string[];

    if (customerType === "가망고객") {
      headers = [
        "고객분류",
        "과정분류",
        "과정",
        "기관",
        "고객명",
        "연락처",
        "최종학력",
        "지역",
        "세부지역",
        "유입경로",
      ];

      sampleData = [
        "가망고객",
        "학점은행제",
        "사회복지사2급",
        "한평생학점은행",
        "홍길동",
        "010-1234-5678",
        "고등학교 졸업",
        "서울",
        "도봉구",
        "기타",
      ];
    } else {
      headers = [
        "고객분류",
        "과정분류",
        "과정",
        "기관",
        "고객명",
        "연락처",
        "최종학력",
        "지역",
        "세부지역",
        "결제일자",
        "결제금액",
        "이론과목",
        "대면과목",
        "실습과목",
        "유입경로",
      ];

      sampleData = [
        "계약고객",
        "학점은행제",
        "사회복지사2급",
        "한평생학점은행",
        "김영희",
        "010-9876-5432",
        "2년제 졸업",
        "부산",
        "해운대구",
        "2025-12-12",
        "600000",
        "5",
        "3",
        "2",
        "제휴카페",
      ];
    }

    // 안전한 CSV 생성
    const escapeCSVField = (field: string): string => {
      // 쉼표, 따옴표, 줄바꿈이 포함된 경우 따옴표로 감싸기
      if (field.includes(",") || field.includes('"') || field.includes("\n")) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };

    const csvContent = [headers, sampleData]
      .map((row) => row.map(escapeCSVField).join(","))
      .join("\n");

    // BOM 추가하여 Excel에서 한글 깨짐 방지
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `CRM_${customerType}_일괄등록_템플릿.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 메모리 정리
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>CRM 일괄등록</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          {step === "upload" && (
            <div className={styles.uploadStep}>
              <div className={styles.uploadArea}>
                <div className={styles.uploadIcon}>📁</div>
                <h3>CSV 파일을 업로드하세요</h3>
                <p>
                  고객 정보가 포함된 CSV 파일을 선택하거나 드래그하여
                  업로드하세요.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className={styles.fileInput}
                />
                <button
                  className={styles.uploadButton}
                  onClick={() => fileInputRef.current?.click()}
                >
                  파일 선택
                </button>
              </div>

              <div className={styles.templateSection}>
                <h4>CSV 템플릿 다운로드</h4>
                <p>고객분류에 따라 다른 형식의 CSV 파일을 사용하세요.</p>
                <div className={styles.templateButtons}>
                  <button
                    className={styles.templateButton}
                    onClick={() => downloadTemplate("가망고객")}
                  >
                    가망고객 템플릿
                  </button>
                  <button
                    className={styles.templateButton}
                    onClick={() => downloadTemplate("계약고객")}
                  >
                    계약고객 템플릿
                  </button>
                </div>
                <div className={styles.templateInfo}>
                  <div className={styles.templateInfoItem}>
                    <strong>가망고객:</strong> 기본 정보만 필요 (결제 정보 제외)
                  </div>
                  <div className={styles.templateInfoItem}>
                    <strong>계약고객:</strong> 결제일자(YYYY-MM-DD), 결제금액,
                    과목분류 필수
                  </div>
                </div>

                <div className={styles.csvTips}>
                  <h5>📋 CSV 파일 사용 팁</h5>
                  <ul>
                    <li>
                      Excel에서 저장 시 "CSV UTF-8(쉼표로 구분)" 형식으로
                      저장하세요
                    </li>
                    <li>
                      한글이 깨지는 경우 템플릿을 다시 다운로드하여 사용하세요
                    </li>
                    <li>
                      쉼표(,)가 포함된 데이터는 자동으로 따옴표로 처리됩니다
                    </li>
                    <li>빈 행은 자동으로 무시됩니다</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className={styles.previewStep}>
              <div className={styles.previewHeader}>
                <h3>데이터 미리보기</h3>
                <div className={styles.previewStats}>
                  <span>총 {uploadedData.length}건</span>
                  {validationErrors.length > 0 && (
                    <span className={styles.errorCount}>
                      오류 {validationErrors.length}건
                    </span>
                  )}
                </div>
              </div>

              {validationErrors.length > 0 && (
                <div className={styles.errorSection}>
                  <h4>검증 오류</h4>
                  <div className={styles.errorList}>
                    {validationErrors.map((error, index) => (
                      <div key={index} className={styles.errorItem}>
                        <span className={styles.errorRow}>행 {error.row}</span>
                        <span className={styles.errorField}>{error.field}</span>
                        <span className={styles.errorMessage}>
                          {error.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.previewTable}>
                <table>
                  <thead>
                    <tr>
                      <th>고객명</th>
                      <th>연락처</th>
                      <th>분류</th>
                      <th>과정분류</th>
                      <th>과정</th>
                      <th>기관</th>
                      <th>학력</th>
                      <th>지역</th>
                      <th>세부지역</th>
                      <th>결제일</th>
                      <th>금액</th>
                      <th>과목</th>
                      <th>경로</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedData.slice(0, 10).map((row, index) => (
                      <tr key={index}>
                        <td>{row.customerName}</td>
                        <td>{row.contact}</td>
                        <td>
                          <span
                            className={`${styles.customerType} ${
                              row.customerType === "계약고객"
                                ? styles.contractCustomer
                                : styles.prospectCustomer
                            }`}
                          >
                            {row.customerType}
                          </span>
                        </td>
                        <td>{row.courseType}</td>
                        <td>{row.course}</td>
                        <td>{row.institution}</td>
                        <td>{row.education}</td>
                        <td>{row.region}</td>
                        <td>{row.subRegion}</td>
                        <td>{row.paymentDate || "-"}</td>
                        <td>
                          {row.paymentAmount ? (
                            <span className={styles.paymentInfo}>
                              {parseInt(row.paymentAmount).toLocaleString()}원 /{" "}
                              {Math.round(
                                parseInt(row.paymentAmount) * 0.1
                              ).toLocaleString()}
                              원
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>
                          {row.customerType === "계약고객" ? (
                            <span className={styles.subjectClassification}>
                              {row.subjectTheoryCount || 0}/
                              {row.subjectFaceToFaceCount || 0}/
                              {row.subjectPracticeCount || 0} (총{" "}
                              {(row.subjectTheoryCount || 0) +
                                (row.subjectFaceToFaceCount || 0) +
                                (row.subjectPracticeCount || 0)}
                              )
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>
                          <span className={styles.inflowPath}>
                            {row.inflowPath}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {uploadedData.length > 10 && (
                  <p className={styles.moreData}>
                    ... 외 {uploadedData.length - 10}건 더
                  </p>
                )}
              </div>

              <div className={styles.previewActions}>
                <button
                  className={styles.backButton}
                  onClick={() => setStep("upload")}
                >
                  다시 선택
                </button>
                <button
                  className={styles.submitButton}
                  onClick={handleBulkSubmit}
                  disabled={validationErrors.length > 0}
                >
                  일괄 등록
                </button>
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className={styles.processingStep}>
              <div className={styles.processingIcon}>⏳</div>
              <h3>데이터 처리 중...</h3>
              <p>고객 정보를 등록하고 있습니다. 잠시만 기다려주세요.</p>
            </div>
          )}

          {step === "result" && (
            <div className={styles.resultStep}>
              <div className={styles.resultHeader}>
                <h3>등록 완료</h3>
                <div className={styles.resultStats}>
                  <div className={styles.successStat}>
                    <span className={styles.statNumber}>
                      {processingResults.success}
                    </span>
                    <span className={styles.statLabel}>성공</span>
                  </div>
                  <div className={styles.failedStat}>
                    <span className={styles.statNumber}>
                      {processingResults.failed}
                    </span>
                    <span className={styles.statLabel}>실패</span>
                  </div>
                </div>
              </div>

              {processingResults.errors.length > 0 && (
                <div className={styles.errorSection}>
                  <h4>실패한 항목</h4>
                  <div className={styles.errorList}>
                    {processingResults.errors.map((error, index) => (
                      <div key={index} className={styles.errorItem}>
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.resultActions}>
                <button
                  className={styles.closeResultButton}
                  onClick={handleClose}
                >
                  닫기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
