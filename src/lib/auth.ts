import { User, LoginCredentials, LoginResponse } from "@/types/auth";
import { supabase } from "./supabase";

export const loginUser = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  try {
    console.log("로그인 시도:", credentials.username);
    console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log(
      "Supabase Key 존재:",
      !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.username, // username 필드에 이메일이 들어옴
      password: credentials.password,
    });

    if (error) {
      console.error("Auth 오류:", error);
      console.error("오류 코드:", error.status);
      console.error("오류 메시지:", error.message);

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

      // 기타 오류 처리
      if (error.message.includes("User already registered")) {
        throw new Error("이미 가입된 이메일입니다. 로그인해주세요.");
      }

      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("로그인에 실패했습니다.");
    }

    console.log("Auth 성공, 사용자 ID:", data.user.id);
    console.log("사용자 이메일:", data.user.email);
    console.log("사용자 메타데이터:", data.user.user_metadata);

    // 사용자 프로필 정보 가져오기
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    console.log("프로필 조회 결과:", { profile, profileError });

    if (profileError) {
      console.error("프로필 조회 오류:", profileError);
      console.error("프로필 오류 코드:", profileError.code);
      console.error("프로필 오류 메시지:", profileError.message);
    }

    if (profileError || !profile) {
      console.log("프로필이 없음, 새로 생성 시도");

      // 프로필이 없으면 새로 생성 (upsert 사용으로 중복 방지)
      const { data: newProfile, error: insertError } = await supabase
        .from("users")
        .upsert(
          {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name || "사용자",
            branch: data.user.user_metadata?.branch || null,
            team: data.user.user_metadata?.team || null,
          },
          {
            onConflict: "id",
          }
        )
        .select()
        .single();

      if (insertError) {
        console.error("프로필 생성 오류:", insertError);
        console.error("삽입 오류 코드:", insertError.code);
        console.error("삽입 오류 메시지:", insertError.message);
        console.error("삽입 오류 세부사항:", insertError.details);

        // 중복 키 오류인 경우 다시 조회 시도
        if (insertError.code === "23505") {
          console.log("중복 키 오류, 기존 프로필 조회 시도");
          const { data: existingProfile, error: retryError } = await supabase
            .from("users")
            .select("*")
            .eq("id", data.user.id)
            .single();

          if (retryError || !existingProfile) {
            throw new Error(
              `프로필 생성에 실패했습니다: ${insertError.message}`
            );
          }

          console.log("기존 프로필 조회 성공:", existingProfile);

          const user: User = {
            id: existingProfile.id,
            username: existingProfile.email,
            email: existingProfile.email,
            name: existingProfile.name,
            branch: existingProfile.branch,
            team: existingProfile.team,
            avatar: existingProfile.avatar,
          };

          return {
            user,
            token: data.session?.access_token || "",
          };
        }

        throw new Error(`프로필 생성에 실패했습니다: ${insertError.message}`);
      }

      console.log("새 프로필 생성됨:", newProfile);

      const user: User = {
        id: newProfile.id,
        username: newProfile.email, // 이메일을 username으로 사용
        email: newProfile.email,
        name: newProfile.name,
        branch: newProfile.branch,
        team: newProfile.team,
        avatar: newProfile.avatar,
      };

      return {
        user,
        token: data.session?.access_token || "",
      };
    }

    const user: User = {
      id: profile.id,
      username: profile.email, // 이메일을 username으로 사용
      email: profile.email,
      name: profile.name,
      branch: profile.branch,
      team: profile.team,
      avatar: profile.avatar,
    };

    return {
      user,
      token: data.session?.access_token || "",
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
    // Supabase Auth 로그아웃
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "로그아웃에 실패했습니다."
    );
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    console.log("Getting current user...");

    // Supabase Auth에서 현재 세션 가져오기
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Session error:", error);
      return null;
    }

    if (!session) {
      console.log("No session found");
      return null;
    }

    console.log("Session found for user:", session.user.email);

    // 사용자 프로필 정보 가져오기
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileError) {
      console.error("Profile error:", profileError);
      return null;
    }

    if (!profile) {
      console.log("No profile found for user:", session.user.email);
      return null;
    }

    console.log("Profile found:", profile.name);

    return {
      id: profile.id,
      username: profile.email, // 이메일을 username으로 사용
      email: profile.email,
      name: profile.name,
      branch: profile.branch,
      team: profile.team,
      avatar: profile.avatar,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

// Supabase Auth 상태 변경 리스너
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    console.log("Auth state change:", event, session?.user?.email);

    if (event === "SIGNED_IN" && session?.user) {
      // 사용자 프로필 정보 가져오기
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        callback({
          id: profile.id,
          username: profile.email, // 이메일을 username으로 사용
          email: profile.email,
          name: profile.name,
          branch: profile.branch,
          team: profile.team,
          avatar: profile.avatar,
        });
      } else {
        callback(null);
      }
    } else if (event === "SIGNED_OUT") {
      callback(null);
    } else if (event === "TOKEN_REFRESHED" && session?.user) {
      // 토큰 갱신 시에도 사용자 정보 업데이트
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        callback({
          id: profile.id,
          username: profile.email,
          email: profile.email,
          name: profile.name,
          branch: profile.branch,
          team: profile.team,
          avatar: profile.avatar,
        });
      } else {
        callback(null);
      }
    } else if (event === "USER_UPDATED" && session?.user) {
      // 사용자 정보 업데이트 시
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        callback({
          id: profile.id,
          username: profile.email,
          email: profile.email,
          name: profile.name,
          branch: profile.branch,
          team: profile.team,
          avatar: profile.avatar,
        });
      } else {
        callback(null);
      }
    } else {
      // 기타 이벤트의 경우 null 반환
      callback(null);
    }
  });
};
