"use client";

import Link from "next/link";
import { useAuth } from "./AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User, ChevronDown } from "lucide-react";
import styles from "./Navigation.module.css";

export default function Navigation() {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  useEffect(() => {
    if (user) {
      // 관리자 권한 확인 (이메일 기반 또는 is_admin 컬럼 기반)
      const checkAdminStatus = () => {
        // 방법 1: 이메일 기반 확인
        const isAdminByEmail =
          user.email?.includes("admin") || user.email === "admin@korhrd.com";

        // 방법 2: is_admin 컬럼 확인 (있는 경우)
        const isAdminByFlag =
          user.is_admin === true || user.is_super_admin === true;

        setIsAdmin(isAdminByEmail || isAdminByFlag);
      };

      checkAdminStatus();

      // 사용자 아바타 가져오기
      const fetchUserAvatar = async () => {
        try {
          const { data, error } = await supabase
            .from("user_profiles")
            .select("avatar")
            .eq("user_id", user.id)
            .single();

          if (!error && data?.avatar) {
            setUserAvatar(data.avatar);
          }
        } catch (error) {
          console.error("아바타 조회 오류:", error);
        }
      };

      fetchUserAvatar();
    } else {
      setIsAdmin(false);
      setUserAvatar(null);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("로그아웃 오류:", error);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <nav className={styles.nav}>
          <div className={styles.leftSection}>
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
            <div className={styles.menuItems}>
              <Link
                href="/"
                className={`${styles.menuLink} ${styles.menuLinkInactive}`}
              >
                홈
              </Link>
              {/* 고객관리 드롭다운 */}
              <div className={styles.dropdownContainer}>
                <button
                  className={`${styles.menuLink} ${styles.menuLinkInactive} ${styles.dropdownButton}`}
                  onClick={() =>
                    setIsCustomerDropdownOpen(!isCustomerDropdownOpen)
                  }
                  onMouseEnter={() => setIsCustomerDropdownOpen(true)}
                >
                  고객관리
                  <ChevronDown
                    className={`${styles.dropdownIcon} ${
                      isCustomerDropdownOpen ? styles.dropdownIconRotated : ""
                    }`}
                  />
                </button>
                {isCustomerDropdownOpen && (
                  <div
                    className={styles.dropdownMenu}
                    onMouseLeave={() => setIsCustomerDropdownOpen(false)}
                  >
                    <Link href="/crm" className={styles.dropdownItem}>
                      CRM
                    </Link>
                    <Link href="/crm-db" className={styles.dropdownItem}>
                      CRM-DB
                    </Link>
                    <Link href="/kakao-send" className={styles.dropdownItem}>
                      메시지 발송
                    </Link>
                    <Link
                      href="/kakao-settings"
                      className={styles.dropdownItem}
                    >
                      카톡 설정
                    </Link>
                  </div>
                )}
              </div>
              <Link
                href="/ranking"
                className={`${styles.menuLink} ${styles.menuLinkInactive}`}
              >
                랭킹
              </Link>
              <Link
                href="/board"
                className={`${styles.menuLink} ${styles.menuLinkInactive}`}
              >
                게시판
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`${styles.menuLink} ${styles.menuLinkInactive}`}
                >
                  관리자
                </Link>
              )}
            </div>
          </div>

          {/* Desktop Menu */}
          <div className={styles.rightSection}>
            {user ? (
              <div className={styles.userInfo}>
                <span className={styles.userName}>
                  {user.name || "사용자"} ({user.email})
                </span>

                {/* 프로필 사진 */}
                <div className={styles.userProfile}>
                  <div className={styles.userAvatarPlaceholder}>
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt="Profile"
                        className={styles.userAvatar}
                      />
                    ) : (
                      <User className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <Link href="/profile" className={styles.userNameLink}>
                    프로필
                  </Link>
                </div>

                <button onClick={handleLogout} className={styles.logoutButton}>
                  로그아웃
                </button>
              </div>
            ) : (
              <Link href="/auth/login" className={styles.userNameLink}>
                로그인
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className={styles.mobileMenuContainer}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={styles.mobileMenuButton}
            >
              <span className={styles.srOnly}>메뉴 열기</span>
              {/* Hamburger icon */}
              <svg
                className={`${styles.mobileMenuIcon} ${
                  isMenuOpen
                    ? styles.mobileMenuIconHidden
                    : styles.mobileMenuIconVisible
                }`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Close icon */}
              <svg
                className={`${styles.mobileMenuIcon} ${
                  isMenuOpen
                    ? styles.mobileMenuIconVisible
                    : styles.mobileMenuIconHidden
                }`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile menu */}
      <div
        className={`${
          isMenuOpen ? styles.mobileMenuVisible : styles.mobileMenuHidden
        } ${styles.mobileMenuContainer}`}
      >
        <div className={styles.mobileMenuItems}>
          <Link href="/" className={styles.mobileMenuItem}>
            홈
          </Link>
          {/* 모바일에서도 드롭다운 메뉴 */}
          <div className={styles.mobileDropdownContainer}>
            <button
              className={styles.mobileDropdownButton}
              onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
            >
              고객관리
              <ChevronDown
                className={`${styles.mobileDropdownIcon} ${
                  isCustomerDropdownOpen ? styles.dropdownIconRotated : ""
                }`}
              />
            </button>
            {isCustomerDropdownOpen && (
              <div className={styles.mobileDropdownMenu}>
                <Link href="/crm" className={styles.mobileDropdownItem}>
                  CRM
                </Link>
                <Link href="/crm-db" className={styles.mobileDropdownItem}>
                  CRM-DB
                </Link>
                <Link href="/kakao-send" className={styles.mobileDropdownItem}>
                  메시지 발송
                </Link>
                <Link
                  href="/kakao-settings"
                  className={styles.mobileDropdownItem}
                >
                  카톡 설정
                </Link>
              </div>
            )}
          </div>
          <Link href="/ranking" className={styles.mobileMenuItem}>
            랭킹
          </Link>
          {isAdmin && (
            <Link href="/admin" className={styles.mobileMenuItem}>
              관리자
            </Link>
          )}
        </div>
        <div className={styles.mobileUserSection}>
          {user ? (
            <div className={styles.mobileUserInfo}>
              <div className={styles.mobileUserHeader}>
                <div className={styles.mobileUserProfile}>
                  {/* 모바일 프로필 사진 */}
                  <div className={styles.mobileUserAvatar}>
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt="Profile"
                        className={styles.mobileUserAvatarImage}
                      />
                    ) : (
                      <User className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className={styles.mobileUserDetails}>
                    <div className={styles.mobileUserName}>
                      {user.name || "사용자"}
                    </div>
                    <div className={styles.mobileUserEmail}>{user.email}</div>
                  </div>
                </div>
              </div>
              <div className={styles.mobileUserActions}>
                <Link href="/profile" className={styles.mobileUserAction}>
                  프로필
                </Link>
                <button
                  onClick={handleLogout}
                  className={styles.mobileUserAction}
                >
                  로그아웃
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.mobileUserHeader}>
              <Link href="/auth/login" className={styles.mobileLoginButton}>
                로그인
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
