"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import {
  sendKakaoMessage,
  sendKakaoTestMessage,
  sendKakaoBulkMessage,
  createMessageTemplate,
  getDelayBySpeed,
  KakaoMessage,
} from "@/lib/kakao";
import { sendSMSByUser, SMSMessage } from "@/lib/sms";
import {
  sendUserKakaoMessage,
  sendUserKakaoBulkMessage,
  UserKakaoMessage,
} from "@/lib/userKakao";
import { useAuth } from "@/components/AuthContext";

export default function MessagePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("없음");
  const [sendingSpeed, setSendingSpeed] = useState("보통");
  const [batchPolite, setBatchPolite] = useState(true);
  const [addTitle, setAddTitle] = useState(false);
  const [webMagazine, setWebMagazine] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResults, setSendResults] = useState<any[]>([]);

  const [politeMessage, setPoliteMessage] = useState(
    "8월도 어느새 끝자락에 다가섰습니다. 휴가를 다녀오셨든, 아직 기다리고 계시든, 늦여름의 흐름 속에서 잠시 숨을 고르시며 여유를 찾으시면 좋겠습니다. 흐리고 후텁지근한 날씨가 이어지지만, 마음만은 한결 산뜻하고 가벼운 나날들이 되시길 바랍니다."
  );

  const [informalMessage, setInformalMessage] = useState(
    "8월도 어느새 끝자락에 다가왔어. 휴가를 다녀왔든, 아직 기다리고 있든, 늦여름의 흐름 속에서 잠시 숨 좀 고르면서, 너만의 여유를 찾아보면 좋겠어. 흐리고 후텁지근한 날씨가 계속되지만, 마음만큼은 한결 산뜻하고 가벼운 하루하루가 되길 바랄게."
  );

  const tabs = ["없음", "보케어 자료", "이미지", "파일"];
  const cardNews = ["보험카드", "일상카드", "헬스케어"];
  const speeds = ["느림", "보통", "빠름", "매우 빠름"];

  // 테스트 발송 함수
  const handleTestSend = async (isPolite: boolean) => {
    try {
      setIsSending(true);
      const message = isPolite ? politeMessage : informalMessage;
      const result = await sendKakaoTestMessage(message, isPolite);

      if (result.success) {
        alert("테스트 메시지가 성공적으로 발송되었습니다!");
      } else {
        alert(`테스트 발송 실패: ${result.error}`);
      }
    } catch (error) {
      alert("테스트 발송 중 오류가 발생했습니다.");
      console.error("테스트 발송 오류:", error);
    } finally {
      setIsSending(false);
    }
  };

  // 실제 발송 함수 (사용자별 카카오톡/SMS 발송)
  const handleSendToCustomers = async () => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      setIsSending(true);

      // 발송할 고객 목록 (실제로는 이전 페이지에서 전달받아야 함)
      const customers = [
        { name: "홍길동", phone: "010-1234-5678" },
        { name: "김철수", phone: "010-2345-6789" },
      ];

      const results = [];

      for (const customer of customers) {
        const baseMessage = batchPolite ? politeMessage : informalMessage;
        const finalMessage = createMessageTemplate(
          baseMessage,
          customer.name,
          addTitle
        );

        // 사용자별 카카오톡 API 설정이 있는지 확인
        try {
          // 카카오톡으로 발송 시도
          const kakaoResult = await sendUserKakaoMessage({
            userId: user.id,
            phoneNumber: customer.phone,
            message: finalMessage,
            customerName: customer.name,
          });

          results.push(kakaoResult);
        } catch (kakaoError) {
          // 카카오톡 발송 실패 시 SMS로 대체
          console.log("카카오톡 발송 실패, SMS로 대체:", kakaoError);

          const smsResult = await sendSMSByUser(
            {
              phoneNumber: customer.phone,
              message: finalMessage,
              customerName: customer.name,
            },
            user.id,
            user.name
          );

          results.push(smsResult);
        }

        // 발송 속도 조절
        const delay = getDelayBySpeed(sendingSpeed);
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

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
          <h1 className={styles.title}>카톡 대량 발송</h1>
          <div className={styles.headerButtons}>
            <button className={styles.installButton}>① 프로그램 설치</button>
            <button className={styles.methodButton}>발송 방법</button>
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
              <button className={styles.monthlyButton}>이달의 메시지</button>
            </div>

            {/* 메시지 편집 영역 */}
            <div className={styles.messageEditArea}>
              <div className={styles.messageButtons}>
                <button className={styles.messageButton}>이전 멘트</button>
                <button className={styles.messageButton}>저장 멘트</button>
              </div>

              <div className={styles.messageFields}>
                <div className={styles.messageField}>
                  <div className={styles.fieldHeader}>
                    <span className={styles.fieldTitle}>존대 1명</span>
                    <span className={styles.charCount}>
                      {politeMessage.length}/2000
                    </span>
                  </div>
                  <textarea
                    value={politeMessage}
                    onChange={(e) => setPoliteMessage(e.target.value)}
                    className={styles.messageTextarea}
                    placeholder="존대 문구를 입력하세요..."
                    maxLength={2000}
                  />
                </div>

                <div className={styles.messageField}>
                  <div className={styles.fieldHeader}>
                    <span className={styles.fieldTitle}>반말 0명</span>
                    <span className={styles.charCount}>
                      {informalMessage.length}/2000
                    </span>
                  </div>
                  <textarea
                    value={informalMessage}
                    onChange={(e) => setInformalMessage(e.target.value)}
                    className={styles.messageTextarea}
                    placeholder="반말 문구를 입력하세요..."
                    maxLength={2000}
                  />
                </div>
              </div>
            </div>

            {/* 파일 첨부 */}
            <div className={styles.fileSection}>
              <h3 className={styles.subTitle}>파일 첨부</h3>
              <div className={styles.tabs}>
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    className={`${styles.tab} ${
                      activeTab === tab ? styles.activeTab : ""
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* 카드뉴스 선택 */}
            <div className={styles.cardNewsSection}>
              <h3 className={styles.subTitle}>카드뉴스 선택</h3>
              <div className={styles.cardNewsButtons}>
                {cardNews.map((card) => (
                  <button key={card} className={styles.cardNewsButton}>
                    {card}
                  </button>
                ))}
              </div>
            </div>

            {/* 체크박스 옵션 */}
            <div className={styles.checkboxSection}>
              <div className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  id="batchPolite"
                  checked={batchPolite}
                  onChange={(e) => setBatchPolite(e.target.checked)}
                />
                <label htmlFor="batchPolite">
                  일괄존대 - 선택 고객에게 존대 문구로 발송됩니다.
                </label>
              </div>
              <div className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  id="addTitle"
                  checked={addTitle}
                  onChange={(e) => setAddTitle(e.target.checked)}
                />
                <label htmlFor="addTitle">호칭추가</label>
              </div>
              <div className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  id="webMagazine"
                  checked={webMagazine}
                  onChange={(e) => setWebMagazine(e.target.checked)}
                />
                <label htmlFor="webMagazine">웹매거진 URL발송</label>
              </div>
            </div>
          </div>

          {/* 오른쪽: 메시지 발송 */}
          <div className={styles.sendingSection}>
            <h2 className={styles.sectionTitle}>04. 메시지 발송</h2>

            {/* 메시지 미리보기 */}
            <div className={styles.messagePreview}>
              <div className={styles.previewItem}>
                <h4 className={styles.previewTitle}>존대</h4>
                <div className={styles.messageBubble}>{politeMessage}</div>
              </div>
              <div className={styles.previewItem}>
                <h4 className={styles.previewTitle}>반말</h4>
                <div className={styles.messageBubble}>{informalMessage}</div>
              </div>
            </div>

            {/* 테스트 발송 버튼 */}
            <div className={styles.testButtons}>
              <button
                className={styles.testButtonPrimary}
                onClick={() => handleTestSend(true)}
                disabled={isSending}
              >
                {isSending ? "발송 중..." : "존대 문구 나에게 테스트 발송"}
              </button>
              <button
                className={styles.testButtonSecondary}
                onClick={() => handleTestSend(false)}
                disabled={isSending}
              >
                {isSending ? "발송 중..." : "반말 문구 나에게 테스트 발송"}
              </button>
            </div>

            {/* 발송 속도 선택 */}
            <div className={styles.speedSection}>
              <h3 className={styles.subTitle}>카카오톡 발송 속도 선택</h3>
              <div className={styles.speedOptions}>
                {speeds.map((speed) => (
                  <label key={speed} className={styles.speedOption}>
                    <input
                      type="radio"
                      name="speed"
                      value={speed}
                      checked={sendingSpeed === speed}
                      onChange={(e) => setSendingSpeed(e.target.value)}
                    />
                    <span>{speed}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 발송 버튼 */}
            <div className={styles.sendButtonContainer}>
              <button
                className={styles.sendButton}
                onClick={handleSendToCustomers}
                disabled={isSending}
              >
                {isSending ? "발송 중..." : "[2명] 고객에게 발송 →"}
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

      {/* 플로팅 아이콘 */}
      <div className={styles.floatingIcon}>💬</div>
    </div>
  );
}
