"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User } from "@/types/auth";
import { logoutUser, onAuthStateChange } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      console.log("refreshUser called - forcing auth state refresh...");
      // onAuthStateChange가 자동으로 처리하므로 강제로 세션 새로고침만 수행
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error("Session refresh error:", error);
        setUser(null);
      }
      // onAuthStateChange가 자동으로 사용자 상태를 업데이트함
    } catch (error) {
      console.error("Error refreshing user:", error);
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let authInitialized = false;

    // Supabase Auth 상태 변경 리스너를 먼저 설정
    const {
      data: { subscription },
    } = onAuthStateChange((user) => {
      console.log(
        "Auth state change callback:",
        user?.email,
        "isMounted:",
        isMounted
      );
      if (isMounted) {
        console.log("Setting user from auth state change:", user?.name);
        setUser(user);
        if (!authInitialized) {
          setIsLoading(false);
          authInitialized = true;
        }
      } else {
        console.log("Component not mounted, skipping state update");
      }
    });

    // onAuthStateChange가 자동으로 초기 세션을 처리하므로 별도 초기화 불필요
    console.log("AuthContext initialized, waiting for auth state change...");

    // 1초 후에도 로딩이 끝나지 않으면 강제로 false로 설정
    const timeout = setTimeout(() => {
      if (isMounted && !authInitialized) {
        console.log("Auth timeout, forcing isLoading to false");
        setIsLoading(false);
        authInitialized = true;
      }
    }, 1000);

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
