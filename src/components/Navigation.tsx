"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import styles from "./Navigation.module.css";

export default function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    // Force page refresh to clear any cached state
    window.location.href = "/auth/login";
  };

  const menuItems = [
    { href: "/", label: "홈" },
    { href: "/ranking", label: "순위" },
    { href: "/crm", label: "CRM" },
    { href: "/settlement", label: "정산" },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.nav}>
          <div className={styles.leftSection}>
            {/* 로고 */}
            <div className={styles.logoSection}>
              <div className={styles.logo}>
                <img
                  src="/images/logo2.png"
                  alt="logo"
                  className={styles.logoImage}
                />
              </div>
              <span className={styles.brandName}>한평생 에듀바이저스</span>
            </div>

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
              <span className={styles.userName}>{user?.name}</span>
            </div>
            <button onClick={handleLogout} className={styles.logoutButton}>
              <LogOut className={styles.logoutIcon} />
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
