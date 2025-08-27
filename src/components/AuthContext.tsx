"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/types/auth";
import { onAuthStateChange } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChange((user) => {
      if (!mounted) return;

      setUser(user);

      // 첫 번째 인증 상태 변경 시에만 로딩 완료
      if (!authInitialized) {
        setAuthInitialized(true);
        // 약간의 지연을 두어 UI가 안정적으로 렌더링되도록 함
        setTimeout(() => {
          if (mounted) {
            setIsLoading(false);
          }
        }, 100);
      }
    });

    // 컴포넌트 언마운트 시 정리
    return () => {
      mounted = false;
      unsubscribe.data.subscription.unsubscribe();
    };
  }, [authInitialized]);

  // refreshUser 함수 - 실제 API 호출 없이 상태만 업데이트
  const refreshUser = () => {
    // onAuthStateChange가 자동으로 처리하므로 별도 작업 불필요
  };

  const value = {
    user,
    isLoading,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
