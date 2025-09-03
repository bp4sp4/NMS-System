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
      avatar: null,
      id: userData.id,
      email: userData.email,
      name: userData.name,
      branch: userData.branch,
      team: userData.team,
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

// 사용자 아바타 URL 조회 함수
export const getUserAvatar = async (userId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("avatar")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching user avatar:", error);
      return null;
    }

    return data?.avatar || null;
  } catch (error) {
    console.error("getUserAvatar 오류:", error);
    return null;
  }
};

// 기본 사용자 정보 조회
export const getUserBasicInfo = async (userId: string) => {
  try {
    // 1단계: 기본 사용자 정보 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, name, branch, team")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("사용자 정보 조회 오류:", userError);
      return null;
    }

    // 2단계: 직급 정보 조회
    const { data: positionData, error: positionError } = await supabase
      .from("user_positions")
      .select("position_id")
      .eq("user_id", userId)
      .single();

    if (positionError && positionError.code !== "PGRST116") {
      // PGRST116은 데이터가 없는 경우
      console.error("직급 정보 조회 오류:", positionError);
    }

    // 3단계: 직급 마스터 정보 조회
    let positionName = null;
    if (positionData?.position_id) {
      const { data: masterData, error: masterError } = await supabase
        .from("positions")
        .select("name")
        .eq("id", positionData.position_id)
        .single();

      if (masterError) {
        console.error("직급 마스터 조회 오류:", masterError);
      } else {
        positionName = masterData?.name;
      }
    }

    // 4단계: 데이터 합치기
    return {
      ...userData,
      position: positionName,
      avatar: null, // User 타입에 필요한 avatar 속성 추가
    };
  } catch (error) {
    console.error("사용자 정보 조회 중 오류:", error);
    return null;
  }
};

// 기본 사용자 정보 업데이트
export const updateUserBasicInfo = async (
  userId: string,
  data: {
    name: string;
    branch: string;
    team: string;
  }
) => {
  try {
    const { error } = await supabase
      .from("users")
      .update(data)
      .eq("id", userId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("사용자 정보 업데이트 오류:", error);
    return { success: false, error };
  }
};

// 개인정보 업데이트
export const updateUserProfile = async (
  userId: string,
  data: {
    avatar?: string;
    hire_date?: string | null;
    bank?: string;
    bank_account?: string;
    address?: string;
    resident_number?: string;
    emergency_contact?: string;
  }
) => {
  try {
    const { error } = await supabase
      .from("user_profiles")
      .update(data)
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("개인정보 업데이트 오류:", error);
    return { success: false, error };
  }
};

// 전체 프로필 정보 조회 (기본 정보 + 개인정보)
export const getFullUserProfile = async (userId: string) => {
  try {
    // 기본 정보 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError) {
      throw userError;
    }

    // 개인정보 조회
    const { data: profileData, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileError) {
      throw profileError;
    }

    // 두 데이터 합치기
    return {
      ...userData,
      ...profileData,
    };
  } catch (error) {
    console.error("전체 프로필 조회 오류:", error);
    return null;
  }
};
