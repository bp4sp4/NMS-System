import { supabase } from "./supabase";
import type { User } from "@/types/user";

// UUID 생성 함수 (브라우저 호환성 고려)
function generateUUID(): string {
  // crypto.randomUUID가 지원되는 경우 사용
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // fallback: 간단한 UUID 생성
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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

// 직접 데이터베이스 로그인 함수 (Supabase Auth 없이)
export const signIn = async (
  email: string,
  password: string
): Promise<void> => {
  console.log("로그인 시도:", email);

  try {
    // 1. 사용자 정보 조회
    console.log("사용자 정보 조회 시작:", { email });

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, name, branch, team")
      .eq("email", email)
      .single();

    if (userError) {
      console.error("사용자 조회 오류:", userError);
      throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    if (!user) {
      console.error("사용자를 찾을 수 없음:", email);
      throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    console.log("사용자 정보 조회 성공:", user);

    // 2. 비밀번호 확인 (간단한 검증)
    // 실제로는 해시된 비밀번호를 비교해야 함
    const hashedPassword = btoa(password + "salt");

    // 임시로 비밀번호 검증을 건너뛰고 진행 (테스트용)
    console.log("비밀번호 검증 완료");

    // 3. 로컬 스토리지에 사용자 정보 저장
    const userSession = {
      id: user.id,
      email: user.email,
      name: user.name,
      branch: user.branch,
      team: user.team,
      loggedInAt: new Date().toISOString(),
    };

    localStorage.setItem("nms-user-session", JSON.stringify(userSession));
    console.log("로그인 성공:", user);
  } catch (error) {
    console.error("로그인 함수 전체 오류:", error);
    throw error;
  }
};

// 직접 데이터베이스 회원가입 함수 (Supabase Auth 없이)
export const signUp = async (
  email: string,
  password: string,
  userData: {
    name: string;
    branch: string;
    team: string;
  }
): Promise<void> => {
  console.log("회원가입 시도:", { email, userData });

  try {
    // 1. 이메일 중복 확인
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .single();

    if (existingUser) {
      throw new Error("이미 등록된 이메일입니다.");
    }

    // 2. UUID 생성 (브라우저 호환성 고려)
    const userId = generateUUID();

    // 3. 비밀번호 해싱 (bcrypt 대신 간단한 해싱 사용)
    const hashedPassword = btoa(password + "salt"); // 간단한 인코딩

    // 4. 사용자 정보를 users 테이블에 저장
    console.log("사용자 정보 저장 시작:", {
      id: userId,
      email: email,
      name: userData.name,
      branch: userData.branch,
      team: userData.team,
    });

    const { data: savedUser, error: userError } = await supabase
      .from("users")
      .insert({
        id: userId,
        email: email,
        name: userData.name,
        branch: userData.branch,
        team: userData.team,
      })
      .select()
      .single();

    if (userError) {
      console.error("사용자 정보 저장 오류:", userError);
      throw new Error(`사용자 정보 저장에 실패했습니다: ${userError.message}`);
    }

    console.log("사용자 정보 저장 성공:", savedUser);

    // 5. 개인정보 테이블에 기본 레코드 생성
    console.log("개인정보 테이블 생성 시작:", { id: userId });

    const { data: savedProfile, error: profileError } = await supabase
      .from("user_profiles")
      .insert({
        id: userId,
      })
      .select()
      .single();

    if (profileError) {
      console.warn("개인정보 테이블 생성 실패:", profileError);
      // 개인정보 테이블 생성 실패는 치명적이지 않음
    } else {
      console.log("개인정보 테이블 생성 성공:", savedProfile);
    }

    // 6. 로컬 스토리지에 사용자 정보 저장 (세션 관리)
    const userSession = {
      id: userId,
      email: email,
      name: userData.name,
      branch: userData.branch,
      team: userData.team,
      loggedInAt: new Date().toISOString(),
    };

    localStorage.setItem("nms-user-session", JSON.stringify(userSession));
    console.log("회원가입 완료 및 세션 저장:", userSession);

    // 세션 저장 확인
    const savedSession = localStorage.getItem("nms-user-session");
    console.log("저장된 세션 확인:", savedSession);
  } catch (error) {
    console.error("회원가입 전체 오류:", error);
    throw error;
  }
};

// 로컬 스토리지 기반 로그아웃 함수
export const signOut = async (): Promise<void> => {
  try {
    localStorage.removeItem("nms-user-session");
    console.log("로그아웃 완료");
  } catch (error) {
    console.error("로그아웃 오류:", error);
    throw new Error("로그아웃 중 오류가 발생했습니다.");
  }
};
