import { User, LoginCredentials, LoginResponse } from "@/types/auth";
import { supabase } from "./supabase";

export const loginUser = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.username,
      password: credentials.password,
    });

    if (error) {
      // 이메일 인증 관련 오류 처리
      if (error.message.includes("Email not confirmed")) {
        throw new Error(
          "이메일 인증이 필요합니다. 가입하신 이메일을 확인하여 인증을 완료해주세요."
        );
      }

      // 사용자 존재하지 않음 오류 처리
      if (
        error.message.includes("Invalid login credentials") ||
        error.message.includes("Invalid email or password")
      ) {
        throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
      }

      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("로그인에 실패했습니다.");
    }

    // 기본 사용자 정보만 사용 (프로필 조회 제거)
    const user: User = {
      id: data.user.id,
      username: data.user.email!,
      email: data.user.email!,
      name: data.user.user_metadata?.name || "사용자",
      branch: data.user.user_metadata?.branch || null,
      team: data.user.user_metadata?.team || null,
      avatar: data.user.user_metadata?.avatar_url || null,
    };

    return {
      user,
      token: data.session?.access_token || "",
    };
  } catch (error) {
    console.error("로그인 함수 오류:", error);
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("로그아웃 오류:", error);
      throw error;
    }
  } catch (error) {
    console.error("로그아웃 함수 오류:", error);
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return null;
    }

    // 기본 사용자 정보만 반환 (프로필 조회 제거)
    const user: User = {
      id: session.user.id,
      username: session.user.email!,
      email: session.user.email!,
      name: session.user.user_metadata?.name || "사용자",
      branch: session.user.user_metadata?.branch || null,
      team: session.user.user_metadata?.team || null,
      avatar: session.user.user_metadata?.avatar_url || null,
    };

    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

// Supabase Auth 상태 변경 리스너
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN" && session?.user) {
      // 기본 사용자 정보만 사용
      const user: User = {
        id: session.user.id,
        username: session.user.email!,
        email: session.user.email!,
        name: session.user.user_metadata?.name || "사용자",
        branch: session.user.user_metadata?.branch || null,
        team: session.user.user_metadata?.team || null,
        avatar: session.user.user_metadata?.avatar_url || null,
      };

      callback(user);
    } else if (event === "SIGNED_OUT") {
      callback(null);
    } else if (event === "TOKEN_REFRESHED" && session?.user) {
      // 토큰 갱신 시에도 기본 정보만 사용
      const user: User = {
        id: session.user.id,
        username: session.user.email!,
        email: session.user.email!,
        name: session.user.user_metadata?.name || "사용자",
        branch: session.user.user_metadata?.branch || null,
        team: session.user.user_metadata?.team || null,
        avatar: session.user.user_metadata?.avatar_url || null,
      };

      callback(user);
    } else if (event === "INITIAL_SESSION" && session?.user) {
      // 초기 세션 시에도 기본 정보만 사용
      const user: User = {
        id: session.user.id,
        username: session.user.email!,
        email: session.user.email!,
        name: session.user.user_metadata?.name || "사용자",
        branch: session.user.user_metadata?.branch || null,
        team: session.user.user_metadata?.team || null,
        avatar: session.user.user_metadata?.avatar_url || null,
      };

      callback(user);
    }
  });
};
