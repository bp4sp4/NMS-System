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
            hire_date: existingProfile.hire_date,
            position: existingProfile.position,
            contact: existingProfile.contact,
            bank: existingProfile.bank,
            bank_account: existingProfile.bank_account,
            address: existingProfile.address,
            resident_number: existingProfile.resident_number,
            emergency_contact_a: existingProfile.emergency_contact_a,
            emergency_contact_b: existingProfile.emergency_contact_b,
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
        hire_date: newProfile.hire_date,
        position: newProfile.position,
        contact: newProfile.contact,
        bank: newProfile.bank,
        bank_account: newProfile.bank_account,
        address: newProfile.address,
        resident_number: newProfile.resident_number,
        emergency_contact_a: newProfile.emergency_contact_a,
        emergency_contact_b: newProfile.emergency_contact_b,
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

    // 세션이 있으면 기본 사용자 정보 생성
    const basicUser: User = {
      id: session.user.id,
      username: session.user.email!,
      email: session.user.email!,
      name: session.user.user_metadata?.name || "사용자",
      branch: session.user.user_metadata?.branch || null,
      team: session.user.user_metadata?.team || null,
      avatar: session.user.user_metadata?.avatar_url || null,
    };

    // 사용자 프로필 정보 가져오기 (선택적, 실패해도 기본 정보 반환)
    try {
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (!profileError && profile) {
        console.log("Profile found:", profile.name);
        return {
          id: profile.id,
          username: profile.email,
          email: profile.email,
          name: profile.name,
          branch: profile.branch,
          team: profile.team,
          avatar: profile.avatar,
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
      } else {
        console.log("No profile found, using basic user info");
      }
    } catch (profileError) {
      console.log(
        "Profile lookup failed, using basic user info:",
        profileError
      );
    }

    // 프로필이 없어도 기본 사용자 정보 반환 (회원가입 직후 로그인 시)
    console.log("Using basic user info from session");
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
      // 기본 사용자 정보 먼저 생성 (프로필 조회 실패 시에도 사용)
      const basicUser: User = {
        id: session.user.id,
        username: session.user.email!,
        email: session.user.email!,
        name: session.user.user_metadata?.name || "사용자",
        branch: session.user.user_metadata?.branch || null,
        team: session.user.user_metadata?.team || null,
        avatar: session.user.user_metadata?.avatar_url || null,
      };

      try {
        // 사용자 프로필 정보 가져오기 (선택적)
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (!profileError && profile) {
          const user: User = {
            id: profile.id,
            username: profile.email,
            email: profile.email,
            name: profile.name,
            branch: profile.branch,
            team: profile.team,
            avatar: profile.avatar,
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
          console.log("Profile found, calling callback with user:", user.name);
          callback(user);
        } else {
          // 프로필이 없어도 기본 사용자 정보 반환
          console.log(
            "No profile found, calling callback with basic user:",
            basicUser.name
          );
          callback(basicUser);
        }
      } catch (profileError) {
        // 프로필 조회 실패 시에도 기본 사용자 정보 반환
        console.log(
          "Profile lookup failed, calling callback with basic user:",
          basicUser.name
        );
        callback(basicUser);
      }
    } else if (event === "SIGNED_OUT") {
      console.log("SIGNED_OUT, calling callback with null");
      callback(null);
    } else if (event === "TOKEN_REFRESHED" && session?.user) {
      // 기본 사용자 정보 먼저 생성
      const basicUser: User = {
        id: session.user.id,
        username: session.user.email!,
        email: session.user.email!,
        name: session.user.user_metadata?.name || "사용자",
        branch: session.user.user_metadata?.branch || null,
        team: session.user.user_metadata?.team || null,
        avatar: session.user.user_metadata?.avatar_url || null,
      };

      try {
        // 사용자 프로필 정보 가져오기 (선택적)
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (!profileError && profile) {
          const user: User = {
            id: profile.id,
            username: profile.email,
            email: profile.email,
            name: profile.name,
            branch: profile.branch,
            team: profile.team,
            avatar: profile.avatar,
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
            "Token refreshed, calling callback with user:",
            user.name
          );
          callback(user);
        } else {
          // 프로필이 없어도 기본 사용자 정보 반환
          console.log(
            "Token refreshed but no profile, calling callback with basic user:",
            basicUser.name
          );
          callback(basicUser);
        }
      } catch (profileError) {
        // 프로필 조회 실패 시에도 기본 사용자 정보 반환
        console.log(
          "Token refreshed but profile lookup failed, calling callback with basic user:",
          basicUser.name
        );
        callback(basicUser);
      }
    } else if (event === "USER_UPDATED" && session?.user) {
      // 비밀번호 변경 등의 USER_UPDATED 이벤트는 무시
      // 이는 무한 루프를 방지하기 위함
      console.log("User updated event ignored to prevent infinite loop");
      return;
    } else if (event === "INITIAL_SESSION" && session?.user) {
      // 초기 세션 로드 시
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        const user: User = {
          id: profile.id,
          username: profile.email,
          email: profile.email,
          name: profile.name,
          branch: profile.branch,
          team: profile.team,
          avatar: profile.avatar,
        };
        console.log(
          "Initial session with profile, calling callback with user:",
          user.name
        );
        callback(user);
      } else {
        // 프로필이 없어도 세션이 있으면 기본 사용자 정보 반환
        const user: User = {
          id: session.user.id,
          username: session.user.email!,
          email: session.user.email!,
          name: session.user.user_metadata?.name || "사용자",
          branch: session.user.user_metadata?.branch || null,
          team: session.user.user_metadata?.team || null,
          avatar: session.user.user_metadata?.avatar_url || null,
        };
        console.log(
          "Initial session without profile, calling callback with basic user:",
          user.name
        );
        callback(user);
      }
    } else {
      // 기타 이벤트의 경우 null 반환
      console.log("Other event, calling callback with null");
      callback(null);
    }
  });
};
