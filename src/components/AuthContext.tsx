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
    const getAndSetUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        let userProfile = await getUserProfile(authUser.id);

        // 프로필이 없으면 기본 프로필 생성
        if (!userProfile) {
          try {
            const { error } = await supabase.from("users").insert({
              id: authUser.id,
              email: authUser.email,
              name: "새 사용자",
              branch: "",
              team: "",
            });

            if (error) {
              console.error("기본 프로필 생성 실패:", error);
            } else {
              userProfile = await getUserProfile(authUser.id);
            }
          } catch (error) {
            console.error("기본 프로필 생성 중 오류:", error);
          }
        }

        setUser(userProfile);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    getAndSetUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsLoading(true);
        const authUser = session?.user ?? null;
        if (authUser) {
          let userProfile = await getUserProfile(authUser.id);

          // 프로필이 없으면 기본 프로필 생성
          if (!userProfile) {
            try {
              const { error } = await supabase.from("users").insert({
                id: authUser.id,
                email: authUser.email,
                name: "새 사용자",
                branch: "",
                team: "",
              });

              if (error) {
                console.error("기본 프로필 생성 실패:", error);
              } else {
                userProfile = await getUserProfile(authUser.id);
              }
            } catch (error) {
              console.error("기본 프로필 생성 중 오류:", error);
            }
          }

          setUser(userProfile as User | null);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await authSignIn(email, password);
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
      await authSignUp(userData.email, userData.password, userData);
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
