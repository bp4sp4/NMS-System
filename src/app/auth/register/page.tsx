"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import styles from "./page.module.css";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    branch: "",
    team: "",
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // 입력 시 에러 메시지 초기화
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // 입력값 검증
    if (
      !formData.email ||
      !formData.password ||
      !formData.name ||
      !formData.branch ||
      !formData.team
    ) {
      setError("모든 필드를 입력해주세요.");
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    // 비밀번호 길이 확인
    if (formData.password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        branch: formData.branch,
        team: formData.team,
      });

      if (result.success) {
        setSuccessMessage(
          "축하드립니다! 회원가입이 완료되었습니다. 자동으로 로그인됩니다!"
        );
        // 즉시 홈페이지로 이동
        router.push("/");

        // 상태 업데이트를 위해 잠시 후 새로고침
        setTimeout(() => {
          console.log("회원가입 후 새로고침 실행");
          window.location.reload();
        }, 500);
      } else {
        setError(result.error || "회원가입에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (error: unknown) {
      console.error("회원가입 오류:", error);

      // 구체적인 에러 메시지 처리
      const errorMessage = error instanceof Error ? error.message : "";
      if (errorMessage) {
        if (errorMessage.includes("already registered")) {
          setError("이미 등록된 이메일입니다.");
        } else if (errorMessage.includes("password")) {
          setError("비밀번호 형식이 올바르지 않습니다.");
        } else if (errorMessage.includes("email")) {
          setError("이메일 형식이 올바르지 않습니다.");
        } else if (errorMessage.includes("network")) {
          setError("네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.");
        } else {
          setError(`회원가입 중 오류가 발생했습니다: ${errorMessage}`);
        }
      } else {
        setError("회원가입 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoText}>
            <img src="/images/logo2.png" alt="logo" />
          </span>
        </div>
        <span className={styles.brandName}>한평생 에듀바이저스</span>
      </div>

      <div className={styles.content}>
        {/* Main title */}
        <div>
          <h1 className={styles.title}>회원가입</h1>
        </div>

        {/* Register container */}
        <div className={styles.registerContainer}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              {/* 이메일 */}
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className={styles.input}
                placeholder="이메일을 입력하세요"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />

              {/* 이름 */}
              <input
                name="name"
                type="text"
                autoComplete="name"
                required
                className={styles.input}
                placeholder="이름을 입력하세요"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
              />

              {/* 지점 */}
              <select
                name="branch"
                required
                className={styles.input}
                value={formData.branch}
                onChange={handleChange}
                disabled={isLoading}
              >
                <option value="">지점을 선택하세요</option>
                <option value="AIO">AIO</option>
                <option value="위드업">위드업</option>
              </select>

              {/* 팀 */}
              <select
                name="team"
                required
                className={styles.input}
                value={formData.team}
                onChange={handleChange}
                disabled={isLoading}
              >
                <option value="">팀을 선택하세요</option>
                <option value="1팀">1팀</option>
                <option value="2팀">2팀</option>
                <option value="3팀">3팀</option>
                <option value="4팀">4팀</option>
              </select>

              {/* 비밀번호 */}
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className={styles.input}
                placeholder="비밀번호 (6자 이상)"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />

              {/* 비밀번호 확인 */}
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className={styles.input}
                placeholder="비밀번호 확인"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className={`${styles.message} ${styles.successMessage}`}>
                <div>
                  <h3 className={styles.successText}>{successMessage}</h3>
                  <p
                    className={styles.successText}
                    style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}
                  >
                    잠시 후 로그인 페이지로 이동합니다...
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className={`${styles.message} ${styles.errorMessage}`}>
                <div>
                  <h3 className={styles.errorText}>{error}</h3>
                </div>
              </div>
            )}

            {/* Register button */}
            <button
              type="submit"
              disabled={isLoading || !!successMessage}
              className={styles.registerButton}
            >
              {isLoading ? "회원가입 중..." : "회원가입"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.footerText}>이미 계정이 있으신가요? </span>
          <Link href="/auth/login" className={styles.footerLink}>
            로그인하기
          </Link>
        </div>
      </div>
    </div>
  );
}
