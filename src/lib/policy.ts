import { supabase } from "./supabase";
import { UserPolicy, CreateUserPolicy, UpdateUserPolicy } from "../types/user";

// 사용자 정책 목록 조회
export const getUserPolicies = async (
  userId: string
): Promise<UserPolicy[] | null> => {
  try {
    const { data, error } = await supabase
      .from("user_policies")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("사용자 정책 조회 오류:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("사용자 정책 조회 중 오류:", error);
    return null;
  }
};

// 활성 정책만 조회
export const getActiveUserPolicies = async (
  userId: string
): Promise<UserPolicy[] | null> => {
  try {
    const { data, error } = await supabase
      .from("user_policies")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("활성 정책 조회 오류:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("활성 정책 조회 중 오류:", error);
    return null;
  }
};

// 특정 정책 조회
export const getUserPolicy = async (
  policyId: string
): Promise<UserPolicy | null> => {
  try {
    const { data, error } = await supabase
      .from("user_policies")
      .select("*")
      .eq("id", policyId)
      .single();

    if (error) {
      console.error("정책 조회 오류:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("정책 조회 중 오류:", error);
    return null;
  }
};

// 정책 생성
export const createUserPolicy = async (
  policyData: CreateUserPolicy
): Promise<{ success: boolean; data?: UserPolicy; error?: any }> => {
  try {
    const { data, error } = await supabase
      .from("user_policies")
      .insert([policyData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("정책 생성 오류:", error);
    return { success: false, error };
  }
};

// 정책 수정
export const updateUserPolicy = async (
  policyId: string,
  policyData: UpdateUserPolicy
): Promise<{ success: boolean; data?: UserPolicy; error?: any }> => {
  try {
    const { data, error } = await supabase
      .from("user_policies")
      .update({ ...policyData, updated_at: new Date().toISOString() })
      .eq("id", policyId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("정책 수정 오류:", error);
    return { success: false, error };
  }
};

// 정책 삭제
export const deleteUserPolicy = async (
  policyId: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    const { error } = await supabase
      .from("user_policies")
      .delete()
      .eq("id", policyId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("정책 삭제 오류:", error);
    return { success: false, error };
  }
};

// 정책 활성화/비활성화
export const toggleUserPolicy = async (
  policyId: string,
  isActive: boolean
): Promise<{ success: boolean; data?: UserPolicy; error?: any }> => {
  try {
    const { data, error } = await supabase
      .from("user_policies")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", policyId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("정책 상태 변경 오류:", error);
    return { success: false, error };
  }
};

// 정책 타입별 조회
export const getUserPoliciesByType = async (
  userId: string,
  policyType: "attendance" | "leave" | "overtime" | "remote" | "other"
): Promise<UserPolicy[] | null> => {
  try {
    const { data, error } = await supabase
      .from("user_policies")
      .select("*")
      .eq("user_id", userId)
      .eq("policy_type", policyType)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("정책 타입별 조회 오류:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("정책 타입별 조회 중 오류:", error);
    return null;
  }
};
