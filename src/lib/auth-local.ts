import { User, LoginCredentials, LoginResponse } from "@/types/auth";

// 개발용 로컬 인증 (이메일 없이 테스트 가능)
export const loginUserLocal = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  try {
    console.log("로컬 로그인 시도:", credentials.username);

    // 간단한 검증 (실제로는 bcrypt 사용)
    if (credentials.password.length < 6) {
      throw new Error("비밀번호는 최소 6자 이상이어야 합니다.");
    }

    // 테스트용 사용자 생성
    const user: User = {
      id: crypto.randomUUID(),
      username: credentials.username,
      email: credentials.username,
      name: "테스트 사용자",
      branch: "AIO",
      team: "1팀",
      avatar: undefined,
    };

    // 로컬 스토리지에 저장
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("auth-token", `local-token-${user.id}`);

    return {
      user,
      token: `local-token-${user.id}`,
    };
  } catch (error) {
    console.error("Local login error:", error);
    throw new Error(
      error instanceof Error ? error.message : "로그인에 실패했습니다."
    );
  }
};

export const logoutUserLocal = async (): Promise<void> => {
  try {
    localStorage.removeItem("user");
    localStorage.removeItem("auth-token");
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "로그아웃에 실패했습니다."
    );
  }
};

export const getCurrentUserLocal = async (): Promise<User | null> => {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;

    return JSON.parse(userStr);
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};
