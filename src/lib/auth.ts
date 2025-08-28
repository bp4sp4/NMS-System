import { supabase } from "./supabase";
import type { User } from "@/types/user";

// 사용자 프로필 조회 함수
export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const { data: userData, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }

    if (!userData) {
      return null;
    }

    const user: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      branch: userData.branch,
      team: userData.team,
      avatar: userData.avatar,
      hire_date: userData.hire_date,
      bank: userData.bank,
      bank_account: userData.bank_account,
      address: userData.address,
      resident_number: userData.resident_number,
      emergency_contact: userData.emergency_contact,
      created_at: userData.created_at,
      updated_at: userData.updated_at,
    };

    return user;
  } catch (error) {
    console.error("getUserProfile 오류:", error);
    return null;
  }
};

// Supabase Auth를 사용한 로그인 함수
export const signIn = async (
  email: string,
  password: string
): Promise<void> => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("로그인 오류:", error);
    throw new Error(error.message);
  }
};

// Supabase Auth를 사용한 회원가입 함수
export const signUp = async (
  email: string,
  password: string,
  userData: Partial<User>
): Promise<void> => {
  // 1. Supabase Auth로 사용자 생성
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: userData.name,
        branch: userData.branch,
        team: userData.team,
      },
    },
  });

  if (authError) {
    console.error("Auth 회원가입 오류:", authError);
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error("사용자 생성 실패");
  }

  // 2. 사용자 프로필 정보를 users 테이블에 저장
  const { error: profileError } = await supabase.from("users").insert({
    id: authData.user.id,
    email: email,
    name: userData.name || "새 사용자",
    branch: userData.branch || "",
    team: userData.team || "",
  });

  if (profileError) {
    console.error("프로필 저장 오류:", profileError);
    // 프로필 저장 실패 시에도 Auth 사용자는 생성되었으므로 오류를 던지지 않음
    // 대신 로그만 남기고 계속 진행
    console.warn(
      "프로필 저장 실패했지만 Auth 사용자는 생성됨:",
      profileError.message
    );
  }
};

// Supabase Auth를 사용한 로그아웃 함수
export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("로그아웃 오류:", error);
    throw new Error(error.message);
  }
};
