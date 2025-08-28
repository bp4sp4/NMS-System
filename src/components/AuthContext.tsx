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
    // 로컬 스토리지에서 사용자 세션 확인
    const checkUserSession = () => {
      try {
        setIsLoading(true);
        const sessionData = localStorage.getItem("nms-user-session");
        console.log("AuthContext 초기화 - 세션 데이터:", sessionData);

        if (sessionData) {
          const userSession = JSON.parse(sessionData);
          console.log("AuthContext - 사용자 세션 설정:", userSession);

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
              setUser(userSession as User);
            }
          } else {
            setUser(userSession as User);
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

      // 로그인 성공 후 세션 확인
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
          : "로그인 중 오류가 발생했습니다.";
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    await authSignOut();
    setUser(null);
  };

  const createUser = async (userData: {
    email: string;
    password: string;
    name: string;
    branch: string;
    team: string;
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
