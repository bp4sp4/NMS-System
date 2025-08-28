"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  getUserProfile,
} from "@/lib/auth";
import type { User } from "@/types/user";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signUp: (userData: {
    email: string;
    password: string;
    name: string;
    branch: string;
    team: string;
  }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  register: (userData: {
    email: string;
    password: string;
    name: string;
    branch: string;
    team: string;
  }) => Promise<{ success: boolean; error?: string }>;
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

  useEffect(() => {
    // 로컬 스토리지에서 사용자 세션 확인
    const checkUserSession = () => {
      try {
        setIsLoading(true);
        const sessionData = localStorage.getItem("nms-user-session");
        console.log("AuthContext 초기화 - 세션 데이터:", sessionData);

        if (sessionData) {
          const userSession = JSON.parse(sessionData);
          console.log("AuthContext - 사용자 세션 설정:", userSession);
          setUser(userSession as User);

          // 세션 유효성 확인
          if (userSession.loggedInAt) {
            const loginTime = new Date(userSession.loggedInAt);
            const now = new Date();
            const diffHours =
              (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);

            // 24시간 이상 지난 세션은 삭제
            if (diffHours > 24) {
              console.log("세션이 만료됨, 삭제:", diffHours, "시간");
              localStorage.removeItem("nms-user-session");
              setUser(null);
            } else {
              console.log("세션 유효함:", diffHours, "시간 경과");
            }
          }
        } else {
          console.log("AuthContext - 세션 데이터 없음, 사용자 null 설정");
          setUser(null);
        }
      } catch (error) {
        console.error("AuthContext - 세션 확인 오류:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await authSignIn(email, password);

      // 로그인 성공 후 사용자 상태 업데이트
      const sessionData = localStorage.getItem("nms-user-session");
      console.log("로그인 후 세션 데이터:", sessionData);

      if (sessionData) {
        const userSession = JSON.parse(sessionData);
        console.log("사용자 세션 설정:", userSession);
        setUser(userSession as User);

        // 상태 업데이트 확인을 위한 추가 로그
        setTimeout(() => {
          console.log("AuthContext 상태 업데이트 확인:", {
            user: userSession,
            isLoading: false,
          });
        }, 100);
      } else {
        console.log("세션 데이터가 없습니다");
      }

      return { success: true };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "로그인 중 오류가 발생했습니다.";
      return { success: false, error: errorMessage };
    }
  };

  const signUp = async (userData: {
    email: string;
    password: string;
    name: string;
    branch: string;
    team: string;
  }) => {
    try {
      await authSignUp(userData.email, userData.password, {
        name: userData.name,
        branch: userData.branch,
        team: userData.team,
      });

      // 회원가입 성공 후 사용자 상태 업데이트
      const sessionData = localStorage.getItem("nms-user-session");
      if (sessionData) {
        const userSession = JSON.parse(sessionData);
        setUser(userSession as User);
      }

      return { success: true };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "회원가입 중 오류가 발생했습니다.";
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    await authSignOut();
    setUser(null);
    // 로컬 스토리지에서 세션 제거
    localStorage.removeItem("nms-user-session");
  };

  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    register: signUp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
