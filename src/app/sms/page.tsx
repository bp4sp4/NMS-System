"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function SMSPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const handleSendSMS = async () => {
    if (!phoneNumber || !message) {
      alert("전화번호와 메시지를 입력해주세요.");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          message: message,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult("✅ SMS가 성공적으로 전송되었습니다!");
        setPhoneNumber("");
        setMessage("");
      } else {
        setResult(`❌ SMS 전송 실패: ${data.error}`);
      }
    } catch (error) {
      setResult(
        `❌ 오류가 발생했습니다: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>SMS 전송</h1>

      <div className={styles.form}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>받는 사람 번호:</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="010-1234-5678"
            className={styles.input}
            disabled={loading}
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>메시지:</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="전송할 메시지를 입력하세요"
            rows={4}
            className={styles.textarea}
            disabled={loading}
          />
        </div>

        <button
          onClick={handleSendSMS}
          disabled={loading || !phoneNumber || !message}
          className={styles.button}
        >
          {loading ? "전송 중..." : "📱 SMS 보내기"}
        </button>

        {result && (
          <div
            className={`${styles.result} ${
              result.includes("✅") ? styles.resultSuccess : styles.resultError
            }`}
          >
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
