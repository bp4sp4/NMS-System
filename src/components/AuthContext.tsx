"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signIn as authSignIn,
  signOut as authSignOut,
  getUserProfile,
  createUserByAdmin,
  getAllUsers,
  deleteUser,
} from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types/user";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  createUser: (userData: {
    email: string;
    password: string;
    name: string;
    branch: string;
    team: string;
    position_id?: number;
  }) => Promise<{ success: boolean; error?: string }>;
  getUsers: () => Promise<User[] | null>;
  removeUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  updateUser: (userData: Partial<User>) => void;
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
    const initializeAuth = () => {
      if (typeof window !== "undefined") {
        const sessionData = localStorage.getItem("nms-user-session");

        if (sessionData) {
          try {
            const userSession = JSON.parse(sessionData);

            // 세션 만료 시간 확인 (24시간)
            const sessionTime = new Date(
              userSession.loggedInAt || userSession.created_at
            );
            const currentTime = new Date();
            const diffHours =
              (currentTime.getTime() - sessionTime.getTime()) /
              (1000 * 60 * 60);

            if (diffHours > 24) {
              // 세션이 만료된 경우
              localStorage.removeItem("nms-user-session");
              setUser(null);
            } else {
              // 세션이 유효한 경우
              setUser(userSession);
            }
          } catch (error) {
            // 세션 데이터 파싱 실패 시 제거
            localStorage.removeItem("nms-user-session");
            setUser(null);
          }
        } else {
          setUser(null);
        }

        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await authSignIn(email, password);

      // 로그인 성공 후 세션 확인
      const sessionData = localStorage.getItem("nms-user-session");
      if (sessionData) {
        const userSession = JSON.parse(sessionData);

        // 직급 정보를 포함한 완전한 사용자 정보 조회
        try {
          const { getUserBasicInfo } = await import("@/lib/profile");
          const fullUserInfo = await getUserBasicInfo(userSession.id);
          if (fullUserInfo) {
            setUser(fullUserInfo);
            // 로컬 스토리지도 업데이트
            localStorage.setItem(
              "nms-user-session",
              JSON.stringify(fullUserInfo)
            );
          } else {
            console.warn("직급 정보 조회 실패, 기본 정보로 설정");
            setUser(userSession as User);
          }
        } catch (profileError) {
          console.error("직급 정보 조회 실패, 기본 정보로 설정:", profileError);
          setUser(userSession as User);
        }
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

  const signOut = async () => {
    await authSignOut();
    setUser(null);

    // 로그아웃 후 로그인 페이지로 리다이렉트
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
  };

  const createUser = async (userData: {
    email: string;
    password: string;
    name: string;
    branch: string;
    team: string;
    position_id?: number;
  }) => {
    try {
      const result = await createUserByAdmin(userData);
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "사용자 생성 중 오류가 발생했습니다.";
      return { success: false, error: errorMessage };
    }
  };

  const getUsers = async () => {
    try {
      return await getAllUsers();
    } catch (error) {
      console.error("사용자 목록 조회 오류:", error);
      return null;
    }
  };

  const removeUser = async (userId: string) => {
    try {
      return await deleteUser(userId);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "사용자 삭제 중 오류가 발생했습니다.";
      return { success: false, error: errorMessage };
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);

      // 로컬 스토리지도 업데이트
      const sessionData = localStorage.getItem("nms-user-session");
      if (sessionData) {
        const userSession = JSON.parse(sessionData);
        const updatedSession = { ...userSession, ...userData };
        localStorage.setItem(
          "nms-user-session",
          JSON.stringify(updatedSession)
        );
      }
    }
  };

  const value = {
    user,
    isLoading,
    signIn,
    signOut,
    createUser,
    getUsers,
    removeUser,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
