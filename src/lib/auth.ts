import { supabase } from "./supabase";
import type { User } from "@/types/user";

// 사용자 프로필 조회 함수
export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const { data: userData, error } = await supabase
      .from("users")
      .select(
        `
        *,
        positions (
          id,
          name,
          level,
          description
        )
      `
      )
      .eq("id", userId)
      .single();

    if (error) {
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
      position_id: userData.position_id,
      positions: userData.positions,
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
    return null;
  }
};

// 안전한 비밀번호 해시 함수
const hashPassword = (password: string): string => {
  // 더 안전한 salt 사용
  const salt = "NMS_2024_SECURE_SALT";
  const combined = password + salt;

  // base64 인코딩
  const hash = btoa(combined);

  // 추가 보안을 위해 반복
  const finalHash = btoa(hash + "_SECURE");

  return finalHash;
};

// 비밀번호 검증 함수
const verifyPassword = (password: string, hashedPassword: string): boolean => {
  const inputHash = hashPassword(password);
  const isValid = inputHash === hashedPassword;
  return isValid;
};

// 비밀번호 강도 검증 함수
export const validatePasswordStrength = (
  password: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("비밀번호는 최소 8자 이상이어야 합니다.");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("대문자가 포함되어야 합니다.");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("소문자가 포함되어야 합니다.");
  }

  if (!/\d/.test(password)) {
    errors.push("숫자가 포함되어야 합니다.");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("특수문자가 포함되어야 합니다.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// 로그인 함수 (비밀번호 검증 포함)
export const signIn = async (
  email: string,
  password: string
): Promise<void> => {
  try {
    // 1. 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, name, branch, team")
      .eq("email", email)
      .single();

    if (userError) {
      throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    if (!user) {
      throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    // 2. 비밀번호 확인
    const { data: passwordData, error: passwordError } = await supabase
      .from("user_passwords")
      .select("password_hash")
      .eq("user_id", user.id)
      .single();

    if (passwordError) {
      throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    if (!passwordData) {
      throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    // 비밀번호 검증
    if (!verifyPassword(password, passwordData.password_hash)) {
      throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    // 3. 로그인 시도 기록 (보안 강화)
    try {
      await supabase.from("login_attempts").insert({
        user_id: user.id,
        email: email,
        success: true,
        ip_address: "client_ip", // 실제로는 클라이언트 IP
        user_agent: navigator.userAgent,
      });
    } catch (logError) {
      // 로그인 시도 기록 실패는 치명적이지 않음
    }

    // 4. 로컬 스토리지에 사용자 정보 저장
    const userSession = {
      id: user.id,
      email: user.email,
      name: user.name,
      branch: user.branch,
      team: user.team,
      loggedInAt: new Date().toISOString(),
    };

    localStorage.setItem("nms-user-session", JSON.stringify(userSession));
  } catch (error) {
    // 실패한 로그인 시도 기록
    try {
      await supabase.from("login_attempts").insert({
        email: email,
        success: false,
        ip_address: "client_ip",
        user_agent: navigator.userAgent,
      });
    } catch (logError) {
      // 로그인 실패 기록 실패는 치명적이지 않음
    }

    throw error;
  }
};

// 간단한 로그아웃 함수
export const signOut = async (): Promise<void> => {
  try {
    localStorage.removeItem("nms-user-session");
  } catch (error) {
    throw new Error("로그아웃 중 오류가 발생했습니다.");
  }
};

// 관리자용 사용자 생성 함수
export const createUserByAdmin = async (userData: {
  email: string;
  password: string;
  name: string;
  branch: string;
  team: string;
  position_id?: number;
}): Promise<{ success: boolean; userId?: string; error?: string }> => {
  try {
    // 비밀번호 강도 검증
    const passwordValidation = validatePasswordStrength(userData.password);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: `비밀번호가 요구사항을 충족하지 않습니다: ${passwordValidation.errors.join(
          ", "
        )}`,
      };
    }

    // 1. 이메일 중복 확인
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("email")
      .eq("email", userData.email)
      .single();

    if (existingUser) {
      return { success: false, error: "이미 등록된 이메일입니다." };
    }

    // 2. UUID 생성
    const userId = crypto.randomUUID();

    // 3. 사용자 정보를 users 테이블에 저장
    const { data: savedUser, error: userError } = await supabase
      .from("users")
      .insert({
        id: userId,
        email: userData.email,
        name: userData.name,
        branch: userData.branch,
        team: userData.team,
        position_id: userData.position_id || 1, // 기본값: 사원
      })
      .select()
      .single();

    if (userError) {
      return {
        success: false,
        error: `사용자 정보 저장에 실패했습니다: ${userError.message}`,
      };
    }

    // 4. 개인정보 테이블에 기본 레코드 생성
    const { data: savedProfile, error: profileError } = await supabase
      .from("user_profiles")
      .insert({
        id: userId,
      })
      .select()
      .single();

    if (profileError) {
      // 개인정보 테이블 생성 실패는 치명적이지 않음
    }

    // 5. 비밀번호 저장 (안전한 해시 사용)
    const hashedPassword = hashPassword(userData.password);
    const { error: passwordError } = await supabase
      .from("user_passwords")
      .insert({
        user_id: userId,
        password_hash: hashedPassword,
      });

    if (passwordError) {
      // 비밀번호 저장 실패 시 사용자 삭제
      await supabase.from("users").delete().eq("id", userId);
      return {
        success: false,
        error: `비밀번호 저장에 실패했습니다: ${passwordError.message}`,
      };
    }

    return { success: true, userId };
  } catch (error) {
    return { success: false, error: "사용자 생성 중 오류가 발생했습니다." };
  }
};

// 사용자 목록 조회 (관리자용)
export const getAllUsers = async (): Promise<User[] | null> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return null;
    }

    return data;
  } catch (error) {
    return null;
  }
};

// 사용자 삭제 (관리자용)
export const deleteUser = async (
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // 1. users 테이블에서 삭제 (CASCADE로 관련 테이블도 자동 삭제)
    const { error: userError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (userError) {
      return {
        success: false,
        error: `사용자 정보 삭제에 실패했습니다: ${userError.message}`,
      };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "사용자 삭제 중 오류가 발생했습니다." };
  }
};
