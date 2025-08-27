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
      console.error("입력된 이메일:", credentials.username);
      console.error("비밀번호 길이:", credentials.password.length);

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

    console.log("로그인 성공, 기본 사용자 정보 사용:", user.name);

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
    console.log("로그아웃 성공");
  } catch (error) {
    console.error("로그아웃 함수 오류:", error);
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    console.log("Getting current user...");
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      console.log("No session found");
      return null;
    }

    // 기본 사용자 정보 생성
    const basicUser: User = {
      id: session.user.id,
      username: session.user.email!,
      email: session.user.email!,
      name: session.user.user_metadata?.name || "사용자",
      branch: session.user.user_metadata?.branch || null,
      team: session.user.user_metadata?.team || null,
      avatar: session.user.user_metadata?.avatar_url || null,
    };

    // 프로필 정보 조회 시도 (실패해도 기본 정보 반환)
    try {
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (!profileError && profile) {
        console.log("Profile found, using profile data:", profile.name);
        return {
          ...basicUser,
          name: profile.name || basicUser.name,
          branch: profile.branch || basicUser.branch,
          team: profile.team || basicUser.team,
          avatar: profile.avatar || basicUser.avatar,
          hire_date: profile.hire_date,
          position: profile.position,
          contact: profile.contact,
          bank: profile.bank,
          bank_account: profile.bank_account,
          address: profile.address,
          resident_number: profile.resident_number,
          emergency_contact_a: profile.emergency_contact_a,
          emergency_contact_b: profile.emergency_contact_b,
        };
      }
    } catch (profileError) {
      console.log(
        "Profile lookup failed, using basic user info:",
        profileError
      );
    }

    console.log("Using basic user info from session:", basicUser.name);
    return basicUser;
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
      // 기본 사용자 정보 생성
      const basicUser: User = {
        id: session.user.id,
        username: session.user.email!,
        email: session.user.email!,
        name: session.user.user_metadata?.name || "사용자",
        branch: session.user.user_metadata?.branch || null,
        team: session.user.user_metadata?.team || null,
        avatar: session.user.user_metadata?.avatar_url || null,
      };

      // 프로필 정보 조회 시도 (실패해도 기본 정보 반환)
      try {
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (!profileError && profile) {
          const user: User = {
            ...basicUser,
            name: profile.name || basicUser.name,
            branch: profile.branch || basicUser.branch,
            team: profile.team || basicUser.team,
            avatar: profile.avatar || basicUser.avatar,
            hire_date: profile.hire_date,
            position: profile.position,
            contact: profile.contact,
            bank: profile.bank,
            bank_account: profile.bank_account,
            address: profile.address,
            resident_number: profile.resident_number,
            emergency_contact_a: profile.emergency_contact_a,
            emergency_contact_b: profile.emergency_contact_b,
          };
          console.log(
            "SIGNED_IN with profile, calling callback with user:",
            user.name
          );
          callback(user);
          return;
        }
      } catch (profileError) {
        console.log(
          "Profile lookup failed, using basic user info:",
          profileError
        );
      }

      console.log(
        "SIGNED_IN, calling callback with basic user:",
        basicUser.name
      );
      callback(basicUser);
    } else if (event === "SIGNED_OUT") {
      console.log("SIGNED_OUT, calling callback with null");
      callback(null);
    } else if (event === "TOKEN_REFRESHED" && session?.user) {
      // 기본 사용자 정보만 사용 (프로필 조회 제거)
      const basicUser: User = {
        id: session.user.id,
        username: session.user.email!,
        email: session.user.email!,
        name: session.user.user_metadata?.name || "사용자",
        branch: session.user.user_metadata?.branch || null,
        team: session.user.user_metadata?.team || null,
        avatar: session.user.user_metadata?.avatar_url || null,
      };

      console.log(
        "TOKEN_REFRESHED, calling callback with basic user:",
        basicUser.name
      );
      callback(basicUser);
    } else if (event === "USER_UPDATED" && session?.user) {
      // 비밀번호 변경 등의 USER_UPDATED 이벤트는 무시
      // 이는 무한 루프를 방지하기 위함
      console.log("User updated event ignored to prevent infinite loop");
      return;
    } else if (event === "INITIAL_SESSION" && session?.user) {
      // 기본 사용자 정보 생성
      const basicUser: User = {
        id: session.user.id,
        username: session.user.email!,
        email: session.user.email!,
        name: session.user.user_metadata?.name || "사용자",
        branch: session.user.user_metadata?.branch || null,
        team: session.user.user_metadata?.team || null,
        avatar: session.user.user_metadata?.avatar_url || null,
      };

      // 프로필 정보 조회 시도 (실패해도 기본 정보 반환)
      try {
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (!profileError && profile) {
          const user: User = {
            ...basicUser,
            name: profile.name || basicUser.name,
            branch: profile.branch || basicUser.branch,
            team: profile.team || basicUser.team,
            avatar: profile.avatar || basicUser.avatar,
            hire_date: profile.hire_date,
            position: profile.position,
            contact: profile.contact,
            bank: profile.bank,
            bank_account: profile.bank_account,
            address: profile.address,
            resident_number: profile.resident_number,
            emergency_contact_a: profile.emergency_contact_a,
            emergency_contact_b: profile.emergency_contact_b,
          };
          console.log(
            "INITIAL_SESSION with profile, calling callback with user:",
            user.name
          );
          callback(user);
          return;
        }
      } catch (profileError) {
        console.log(
          "INITIAL_SESSION profile lookup failed, using basic user info:",
          profileError
        );
      }

      console.log(
        "INITIAL_SESSION, calling callback with basic user:",
        basicUser.name
      );
      callback(basicUser);
    } else {
      // 기타 이벤트의 경우 null 반환
      console.log("Other event, calling callback with null");
      callback(null);
    }
  });
};
