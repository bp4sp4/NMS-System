"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { loginUser } from "@/lib/auth";
import { useAuth } from "@/components/AuthContext";
import styles from "./page.module.css";

function LoginForm() {
  const [credentials, setCredentials] = useState({
    username: "", // Supabase Auth에서는 email을 사용하지만 기존 인터페이스 유지
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const messageParam = searchParams.get("message");
    if (messageParam) {
      setMessage(messageParam);
      // 3초 후 메시지 제거
      const timer = setTimeout(() => {
        setMessage("");
        // URL에서 메시지 파라미터 제거
        const url = new URL(window.location.href);
        url.searchParams.delete("message");
        window.history.replaceState({}, "", url.toString());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await loginUser(credentials);

      // Supabase Auth가 자동으로 세션을 관리하므로 로컬 스토리지 저장 불필요
      // refreshUser()를 호출하여 AuthContext 업데이트
      await refreshUser();

      // Redirect to home
      router.push("/");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "로그인에 실패했습니다.";

      // 이메일 인증 관련 오류 메시지 개선
      if (
        errorMessage.includes("Email not confirmed") ||
        errorMessage.includes("이메일이 확인되지 않았습니다")
      ) {
        setError(
          "이메일 인증이 필요합니다. 가입하신 이메일을 확인하여 인증을 완료해주세요."
        );
      } else {
        setError(errorMessage);
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
          <h1 className={styles.title}>로그인</h1>
        </div>

        {/* Message */}
        {message && (
          <div className={`${styles.message} ${styles.successMessage}`}>
            <div>
              <h3 className={styles.successText}>{message}</h3>
            </div>
          </div>
        )}

        {/* Login container */}
        <div className={styles.loginContainer}>
          <form className={styles.form} onSubmit={handleSubmit}>
            {/* Input fields */}
            <div className={styles.inputGroup}>
              <input
                id="username"
                name="username"
                type="email"
                required
                className={styles.input}
                placeholder="이메일을 입력하세요"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials({ ...credentials, username: e.target.value })
                }
              />
              <div className={styles.passwordContainer}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className={`${styles.input} ${styles.passwordInput}`}
                  placeholder="비밀번호"
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials({ ...credentials, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className={`${styles.message} ${styles.errorMessage}`}>
                <div>
                  <h3 className={styles.errorText}>{error}</h3>
                </div>
              </div>
            )}

            {/* Login button */}
            <button
              type="submit"
              disabled={isLoading}
              className={styles.loginButton}
            >
              {isLoading ? (
                <div className={styles.loginButtonContent}>
                  <Loader2 className={`h-5 w-5 ${styles.spinner}`} />
                  로그인 중...
                </div>
              ) : (
                "로그인"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.footerText}>아직 회원이 아닌가요? </span>
          <Link href="/auth/register" className={styles.footerLink}>
            가입하기
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.loadingContainer}>
          <div>
            <div className={styles.loadingSpinner}></div>
            <p className={styles.loadingText}>로딩 중...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
