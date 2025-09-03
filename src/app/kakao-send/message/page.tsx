"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { useAuth } from "@/components/AuthContext";

export default function MessagePage() {
  const router = useRouter();
  const { user } = useAuth();

  // localStorage에서 고객 데이터 받기
  const [selectedCustomers, setSelectedCustomers] = useState<
    Array<{
      id: string;
      name: string;
      phone: string;
      type: string;
      course: string;
    }>
  >([]);
  const [isSending, setIsSending] = useState(false);
  const [sendResults, setSendResults] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [politeMessage, setPoliteMessage] = useState(
    "8월도 어느새 끝자락에 다가섰습니다. 휴가를 다녀오셨든, 아직 기다리고 계시든, 늦여름의 흐름 속에서 잠시 숨을 고르시며 여유를 찾으시면 좋겠습니다. 흐리고 후텁지근한 날씨가 이어지지만, 마음만은 한결 산뜻하고 가벼운 나날들이 되시길 바랍니다."
  );

  // 고객 데이터 로드
  useEffect(() => {
    // localStorage에서 고객 데이터 로드
    const savedCustomers = localStorage.getItem("selectedCustomers");
    if (savedCustomers) {
      try {
        const customers = JSON.parse(savedCustomers);
        setSelectedCustomers(customers);
        console.log("로드된 고객 데이터:", customers);
      } catch (error) {
        console.error("고객 데이터 파싱 오류:", error);
      }
    }
  }, []);

  // 이미지 선택 처리
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 이미지 파일만 허용
      if (file.type.startsWith("image/")) {
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        alert("이미지 파일만 선택할 수 있습니다.");
      }
    }
  };

  // 이미지 제거
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  // 테스트 발송 함수
  const handleTestSend = async () => {
    try {
      setIsSending(true);
      // 테스트 발송 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("테스트 메시지가 성공적으로 발송되었습니다! (시뮬레이션)");
    } catch (error) {
      alert("테스트 발송 중 오류가 발생했습니다.");
      console.error("테스트 발송 오류:", error);
    } finally {
      setIsSending(false);
    }
  };

  // 실제 발송 함수
  const handleSendToCustomers = async () => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (selectedCustomers.length === 0) {
      alert("발송할 고객이 선택되지 않았습니다.");
      return;
    }

    try {
      setIsSending(true);

      // 시뮬레이션 발송
      const results = selectedCustomers.map((customer, index) => {
        const success = Math.random() > 0.1; // 90% 성공률
        return {
          success,
          message: `고객: ${customer.name} (${customer.phone})`,
          data: {
            messageId: `msg_${Date.now()}_${index}`,
            sentAt: new Date().toISOString(),
            customerName: customer.name,
            phoneNumber: customer.phone,
            simulated: true,
          },
        };
      });

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;

      alert(`발송 완료!\n성공: ${successCount}건\n실패: ${failCount}건`);

      setSendResults(results);
    } catch (error) {
      alert("발송 중 오류가 발생했습니다.");
      console.error("발송 오류:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <button
            onClick={() => router.push("/kakao-send")}
            className={styles.backButton}
          >
            ← 뒤로가기
          </button>
          <h1 className={styles.title}>발송</h1>
          {selectedCustomers.length > 0 && (
            <div className={styles.customerInfo}>
              발송 대상: {selectedCustomers.length}명
            </div>
          )}

          {/* 발송 상태 */}
          <div className={styles.kakaoLoginStatus}>
            <div className={styles.loginSuccess}>
              <span>✅ 메시지 발송 준비 완료</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className={styles.refreshButton}
            >
              🔄 새로고침
            </button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className={styles.mainContent}>
        <div className={styles.layout}>
          {/* 왼쪽: 메시지 꾸미기 */}
          <div className={styles.messageSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>03. 메시지 꾸미기</h2>
            </div>

            {/* 메시지 편집 영역 */}
            <div className={styles.messageEditArea}>
              <div className={styles.messageFields}>
                <div className={styles.messageField}>
                  <div className={styles.fieldHeader}>
                    <span className={styles.fieldTitle}>메시지</span>
                    <span className={styles.charCount}>
                      {politeMessage.length}/2000
                    </span>
                  </div>
                  <textarea
                    value={politeMessage}
                    onChange={(e) => setPoliteMessage(e.target.value)}
                    className={styles.messageTextarea}
                    placeholder="메시지를 입력하세요..."
                    maxLength={2000}
                  />
                </div>
              </div>
            </div>

            {/* 이미지 첨부 */}
            <div className={styles.imageSection}>
              <h3 className={styles.subTitle}>이미지 첨부</h3>
              <div className={styles.imageUpload}>
                <div className={styles.fileStatus}>
                  <span className={styles.fileStatusText}>
                    {selectedImage ? selectedImage.name : "선택된 파일 없음"}
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className={styles.imageInput}
                  id="imageUpload"
                />
                <label
                  htmlFor="imageUpload"
                  className={styles.imageUploadButton}
                >
                  이미지 선택
                </label>
              </div>

              {imagePreview && (
                <div className={styles.imagePreview}>
                  <div className={styles.previewHeader}>
                    <span>이미지 미리보기</span>
                    <button
                      onClick={handleRemoveImage}
                      className={styles.removeImageButton}
                    >
                      ✕
                    </button>
                  </div>
                  <img
                    src={imagePreview}
                    alt="미리보기"
                    className={styles.previewImage}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽: 메시지 발송 */}
          <div className={styles.sendingSection}>
            <h2 className={styles.sectionTitle}>04. 메시지 발송</h2>

            {/* 메시지 미리보기 */}
            <div className={styles.messagePreview}>
              <div className={styles.previewItem}>
                <h4 className={styles.previewTitle}>메시지</h4>
                <div className={styles.messageBubble}>{politeMessage}</div>
              </div>

              {/* 이미지 미리보기 */}
              {imagePreview && (
                <div className={styles.previewItem}>
                  <h4 className={styles.previewTitle}>이미지</h4>
                  <div className={styles.imagePreviewBubble}>
                    <img
                      src={imagePreview}
                      alt="첨부 이미지"
                      className={styles.previewBubbleImage}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 테스트 발송 버튼 */}
            <div className={styles.testButtons}>
              <button
                className={styles.testButtonPrimary}
                onClick={handleTestSend}
                disabled={isSending}
              >
                {isSending ? "발송 중..." : "메시지 테스트 발송"}
              </button>
            </div>

            {/* 발송 버튼 */}
            <div className={styles.sendButtonContainer}>
              <button
                className={styles.sendButton}
                onClick={handleSendToCustomers}
                disabled={isSending}
              >
                {isSending
                  ? "발송 중..."
                  : `[${selectedCustomers.length}명] 고객에게 발송 →`}
              </button>
            </div>

            {/* 발송 결과 */}
            {sendResults.length > 0 && (
              <div className={styles.sendResults}>
                <h3 className={styles.subTitle}>발송 결과</h3>
                <div className={styles.resultsList}>
                  {sendResults.map((result, index) => (
                    <div
                      key={index}
                      className={`${styles.resultItem} ${
                        result.success ? styles.success : styles.failed
                      }`}
                    >
                      <span className={styles.resultStatus}>
                        {result.success ? "✅" : "❌"}
                      </span>
                      <span className={styles.resultMessage}>
                        {result.success ? "성공" : "실패"}: {result.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
