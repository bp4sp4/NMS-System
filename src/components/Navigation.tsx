"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import styles from "./Navigation.module.css";

export default function Header() {
  const { user, logout: authLogout } = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      // 로그아웃 버튼 비활성화
      const logoutButton = document.querySelector(
        "[data-logout-button]"
      ) as HTMLButtonElement;
      if (logoutButton) {
        logoutButton.disabled = true;
        logoutButton.textContent = "로그아웃 중...";
      }

      // AuthContext 상태 정리
      await authLogout();

      // Supabase 세션 정리
      await supabase.auth.signOut();

      // 로컬 스토리지 및 세션 스토리지 완전 정리
      localStorage.clear();
      sessionStorage.clear();

      // 쿠키 정리 (가능한 경우)
      document.cookie.split(";").forEach(function (c) {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // 페이지 완전 새로고침으로 모든 상태 초기화
      window.location.replace("/auth/login");
    } catch (error) {
      console.error("로그아웃 오류:", error);
      // 오류가 발생해도 강제로 로그인 페이지로 이동
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace("/auth/login");
    }
  };

  const menuItems = [
    { href: "/", label: "홈" },
    { href: "/ranking", label: "순위" },
    { href: "/crm", label: "CRM" },
    // { href: "/settlement", label: "정산" }, // 임시 비활성화
  ];

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.nav}>
          <div className={styles.leftSection}>
            {/* 로고 */}
            <Link href="/" className={styles.logoSection}>
              <div className={styles.logo}>
                <img
                  src="/images/logo2.png"
                  alt="logo"
                  className={styles.logoImage}
                />
              </div>
              <span className={styles.brandName}>한평생 에듀바이저스</span>
            </Link>

            {/* 메뉴 아이템 */}
            <div className={styles.menuItems}>
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.menuLink} ${
                    pathname === item.href
                      ? styles.menuLinkActive
                      : styles.menuLinkInactive
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* 사용자 정보 및 로그아웃 */}
          <div className={styles.rightSection}>
            <div className={styles.userInfo}>
              <span className={styles.branch}>{user?.branch}</span>
              <span className={styles.team}>{user?.team}</span>
              <Link href="/profile" className={styles.userNameLink}>
                <div className={styles.userProfile}>
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt="프로필 사진"
                      className={styles.userAvatar}
                    />
                  ) : (
                    <div className={styles.userAvatarPlaceholder}>
                      {user?.name?.charAt(0) || "U"}
                    </div>
                  )}
                  <span className={styles.userName}>{user?.name}</span>
                </div>
              </Link>
            </div>
            <button
              onClick={handleLogout}
              className={styles.logoutButton}
              data-logout-button
            >
              <LogOut className={styles.logoutIcon} />
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
