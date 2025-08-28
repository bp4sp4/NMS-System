"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import {
  getUserKakaoSettings,
  saveUserKakaoSettings,
  deleteUserKakaoSettings,
  sendUserKakaoTestMessage,
  UserKakaoSettings,
} from "@/lib/userKakao";
import styles from "./page.module.css";

export default function KakaoSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<UserKakaoSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    kakaoAccessToken: "",
    kakaoBusinessId: "",
    kakaoTemplateId: "",
  });

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    loadSettings();
  }, [user, router]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userSettings = await getUserKakaoSettings(user.id);

      if (userSettings) {
        setSettings(userSettings);
        setFormData({
          kakaoAccessToken: userSettings.kakaoAccessToken,
          kakaoBusinessId: userSettings.kakaoBusinessId || "",
          kakaoTemplateId: userSettings.kakaoTemplateId || "",
        });
      }
    } catch (error) {
      console.error("설정 로드 실패:", error);
      setMessage("설정을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setMessage("");

      const result = await saveUserKakaoSettings({
        userId: user.id,
        kakaoAccessToken: formData.kakaoAccessToken,
        kakaoBusinessId: formData.kakaoBusinessId || undefined,
        kakaoTemplateId: formData.kakaoTemplateId || undefined,
        isActive: true,
      });

      if (result.success) {
        setMessage("설정이 저장되었습니다.");
        await loadSettings(); // 설정 다시 로드
      } else {
        setMessage(`저장 실패: ${result.message}`);
      }
    } catch (error) {
      console.error("설정 저장 실패:", error);
      setMessage("설정 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    if (!confirm("정말로 카카오톡 설정을 삭제하시겠습니까?")) {
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const result = await deleteUserKakaoSettings(user.id);

      if (result.success) {
        setMessage("설정이 삭제되었습니다.");
        setSettings(null);
        setFormData({
          kakaoAccessToken: "",
          kakaoBusinessId: "",
          kakaoTemplateId: "",
        });
      } else {
        setMessage(`삭제 실패: ${result.message}`);
      }
    } catch (error) {
      console.error("설정 삭제 실패:", error);
      setMessage("설정 삭제에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!user || !settings) return;

    try {
      setTesting(true);
      setMessage("");

      const testMessage =
        "안녕하세요! 카카오톡 API 설정이 정상적으로 작동합니다.";
      const result = await sendUserKakaoTestMessage(user.id, testMessage);

      if (result.success) {
        setMessage("테스트 메시지가 성공적으로 발송되었습니다!");
      } else {
        setMessage(`테스트 실패: ${result.error}`);
      }
    } catch (error) {
      console.error("테스트 발송 실패:", error);
      setMessage("테스트 발송에 실패했습니다.");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>설정을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← 뒤로가기
        </button>
        <h1 className={styles.title}>카카오톡 API 설정</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>API 설정</h2>
          <p className={styles.description}>
            개인 카카오톡 API 키를 설정하여 메시지를 발송할 수 있습니다.
          </p>

          <div className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>카카오톡 액세스 토큰 *</label>
              <input
                type="password"
                value={formData.kakaoAccessToken}
                onChange={(e) =>
                  setFormData({ ...formData, kakaoAccessToken: e.target.value })
                }
                placeholder="카카오톡 액세스 토큰을 입력하세요"
                className={styles.input}
              />
              <small className={styles.helpText}>
                카카오 개발자 센터에서 발급받은 액세스 토큰입니다.
              </small>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>비즈니스 ID (선택사항)</label>
              <input
                type="text"
                value={formData.kakaoBusinessId}
                onChange={(e) =>
                  setFormData({ ...formData, kakaoBusinessId: e.target.value })
                }
                placeholder="카카오톡 비즈니스 ID (선택사항)"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>템플릿 ID (선택사항)</label>
              <input
                type="text"
                value={formData.kakaoTemplateId}
                onChange={(e) =>
                  setFormData({ ...formData, kakaoTemplateId: e.target.value })
                }
                placeholder="카카오톡 템플릿 ID (선택사항)"
                className={styles.input}
              />
            </div>

            <div className={styles.buttonGroup}>
              <button
                onClick={handleSave}
                disabled={saving || !formData.kakaoAccessToken}
                className={styles.saveButton}
              >
                {saving ? "저장 중..." : "설정 저장"}
              </button>

              {settings && (
                <button
                  onClick={handleTest}
                  disabled={testing}
                  className={styles.testButton}
                >
                  {testing ? "테스트 중..." : "테스트 발송"}
                </button>
              )}

              {settings && (
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className={styles.deleteButton}
                >
                  설정 삭제
                </button>
              )}
            </div>
          </div>
        </div>

        {message && <div className={styles.message}>{message}</div>}

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>설정 가이드</h2>
          <div className={styles.guide}>
            <h3>1. 카카오 개발자 센터 가입</h3>
            <p>https://developers.kakao.com 에서 계정을 생성하세요.</p>

            <h3>2. 앱 생성</h3>
            <p>새로운 앱을 생성하고 플랫폼을 설정하세요.</p>

            <h3>3. 액세스 토큰 발급</h3>
            <p>앱 설정에서 액세스 토큰을 발급받으세요.</p>

            <h3>4. 권한 설정</h3>
            <p>카카오톡 메시지 발송 권한을 활성화하세요.</p>

            <h3>주의사항</h3>
            <ul>
              <li>카카오톡 친구에게만 메시지를 발송할 수 있습니다.</li>
              <li>하루 100건, 월 1,000건으로 발송이 제한됩니다.</li>
              <li>개인용 API이므로 비즈니스 목적으로는 사용하지 마세요.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
