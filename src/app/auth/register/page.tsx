"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getEmailRedirectUrl } from "@/lib/utils";
import styles from "./page.module.css";

function RegisterForm() {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
    branch: "",
    team: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 파라미터에서 메시지 확인
  useEffect(() => {
    const message = searchParams.get("message");
    if (message) {
      setSuccessMessage(message);
      // 3초 후 메시지 제거
      const timer = setTimeout(() => {
        setSuccessMessage("");
        // URL에서 메시지 파라미터 제거
        const url = new URL(window.location.href);
        url.searchParams.delete("message");
        window.history.replaceState({}, "", url.toString());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // 성공 메시지 자동 제거
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      setIsLoading(false);
      return;
    }

    // 비밀번호 길이 확인
    if (formData.password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      setIsLoading(false);
      return;
    }

    // 지점 선택 확인
    if (!formData.branch) {
      setError("지점을 선택해주세요.");
      setIsLoading(false);
      return;
    }

    // 팀 선택 확인
    if (!formData.team) {
      setError("팀을 선택해주세요.");
      setIsLoading(false);
      return;
    }

    try {
      // 이메일 인증 리다이렉트 URL 생성
      const redirectUrl = getEmailRedirectUrl(
        "/auth/login?message=이메일 인증을 진행 해주세요."
      );

      // Supabase Auth로 사용자 계정 생성
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            branch: formData.branch,
            team: formData.team,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        // 이메일 중복 오류 처리
        if (
          error.message.includes("User already registered") ||
          error.message.includes("already been registered")
        ) {
          throw new Error(
            "이미 가입된 이메일입니다. 다른 이메일을 사용하거나 로그인해주세요."
          );
        }
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error("회원가입에 실패했습니다.");
      }

      // 회원가입 성공 시 바로 로그인 페이지로 이동
      router.push("/auth/login?message=이메일 인증을 진행 해주세요.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입에 실패했습니다.");
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
              <div className={styles.formField}>
                <label htmlFor="email" className={styles.label}>
                  이메일 *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={styles.input}
                  placeholder="이메일을 입력하세요"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              {/* 이름 */}
              <div className={styles.formField}>
                <label htmlFor="name" className={styles.label}>
                  이름 *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className={styles.input}
                  placeholder="이름을 입력하세요"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              {/* 지점 */}
              <div className={styles.formField}>
                <label htmlFor="branch" className={styles.label}>
                  지점 *
                </label>
                <select
                  id="branch"
                  name="branch"
                  className={styles.select}
                  value={formData.branch}
                  onChange={(e) =>
                    setFormData({ ...formData, branch: e.target.value })
                  }
                  required
                >
                  <option value="">지점을 선택하세요</option>
                  <option value="AIO">AIO</option>
                  <option value="위드업">위드업</option>
                </select>
              </div>

              {/* 팀 */}
              <div className={styles.formField}>
                <label htmlFor="team" className={styles.label}>
                  팀 *
                </label>
                <select
                  id="team"
                  name="team"
                  className={styles.select}
                  value={formData.team}
                  onChange={(e) =>
                    setFormData({ ...formData, team: e.target.value })
                  }
                  required
                >
                  <option value="">팀을 선택하세요</option>
                  <option value="1팀">1팀</option>
                  <option value="2팀">2팀</option>
                  <option value="3팀">3팀</option>
                  <option value="4팀">4팀</option>
                </select>
              </div>

              {/* 비밀번호 */}
              <div className={styles.formField}>
                <label htmlFor="password" className={styles.label}>
                  비밀번호 *
                </label>
                <div className={styles.passwordContainer}>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className={`${styles.input} ${styles.passwordInput}`}
                    placeholder="비밀번호를 입력하세요"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
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

              {/* 비밀번호 확인 */}
              <div className={styles.formField}>
                <label htmlFor="confirmPassword" className={styles.label}>
                  비밀번호 확인 *
                </label>
                <div className={styles.passwordContainer}>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    className={`${styles.input} ${styles.passwordInput}`}
                    placeholder="비밀번호를 다시 입력하세요"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                  <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className={`${styles.message} ${styles.successMessage}`}>
                <div>
                  <h3 className={styles.successText}>{successMessage}</h3>
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

            <button
              type="submit"
              disabled={isLoading}
              className={styles.registerButton}
            >
              {isLoading ? (
                <div className={styles.registerButtonContent}>
                  <Loader2 className={`h-5 w-5 ${styles.spinner}`} />
                  회원가입 중...
                </div>
              ) : (
                "회원가입"
              )}
            </button>

            <div className={styles.backLink}>
              <Link href="/auth/login">
                <ArrowLeft className={styles.backIcon} />
                로그인으로 돌아가기
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-300">로딩 중...</p>
          </div>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
