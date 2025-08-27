"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User } from "@/types/auth";
import { getCurrentUser, logoutUser, onAuthStateChange } from "@/lib/auth";

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
      const currentUser = await getCurrentUser();
      setUser(currentUser);
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

    // 초기 세션 확인
    const initAuth = async () => {
      try {
        console.log("Initializing auth...");
        const currentUser = await getCurrentUser();
        if (isMounted && !authInitialized) {
          console.log("Setting initial user:", currentUser?.name);
          setUser(currentUser);
          setIsLoading(false);
          authInitialized = true;
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (isMounted && !authInitialized) {
          setUser(null);
          setIsLoading(false);
          authInitialized = true;
        }
      }
    };

    // 즉시 초기화 실행
    initAuth();

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
