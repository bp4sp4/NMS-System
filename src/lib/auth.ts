import { User, LoginCredentials, LoginResponse } from "@/types/auth";
import { supabase } from "./supabase";

export const loginUser = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  try {
    // Get user profile from users table by username
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("username", credentials.username)
      .single();

    if (profileError || !profile) {
      throw new Error("사용자를 찾을 수 없습니다.");
    }

    // 저장된 비밀번호와 비교
    if (credentials.password !== profile.password) {
      throw new Error("비밀번호가 올바르지 않습니다.");
    }

    const user: User = {
      id: profile.id,
      username: profile.username,
      email: profile.email,
      name: profile.name,
      branch: profile.branch,
      team: profile.team,
      avatar: profile.avatar,
    };

    return {
      user,
      token: `local-token-${profile.id}`,
    };
  } catch (error) {
    console.error("Login error:", error);
    throw new Error(
      error instanceof Error ? error.message : "로그인에 실패했습니다."
    );
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    // 로컬 스토리지에서 사용자 정보 삭제
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("auth-token");
    }
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "로그아웃에 실패했습니다."
    );
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    // 로컬 스토리지에서 사용자 정보 가져오기
    if (typeof window === "undefined") return null;

    const userStr = localStorage.getItem("user");
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};
