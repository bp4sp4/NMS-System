import { supabase } from "./supabase";

interface KakaoUserData {
  id: string;
  email: string;
  name: string;
  branch: string;
  team: string;
  position?: string;
}

interface KakaoResponse {
  success: boolean;
  data?: KakaoUserData;
  error?: string;
}

// 카카오 사용자 정보 조회
export const getKakaoUser = async (userId: string): Promise<KakaoResponse> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, branch, team, position")
      .eq("id", userId)
      .single();

    if (error) {
      return { success: false, error: "사용자 정보를 찾을 수 없습니다." };
    }

    return { success: true, data };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류가 발생했습니다.";
    return { success: false, error: errorMessage };
  }
};

// 카카오 사용자 정보 업데이트
export const updateKakaoUser = async (
  userId: string,
  userData: Partial<KakaoUserData>
): Promise<KakaoResponse> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .update(userData)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      return { success: false, error: "사용자 정보 업데이트에 실패했습니다." };
    }

    return { success: true, data };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류가 발생했습니다.";
    return { success: false, error: errorMessage };
  }
};

// 카카오 사용자 삭제
export const deleteKakaoUser = async (
  userId: string
): Promise<KakaoResponse> => {
  try {
    const { error } = await supabase.from("users").delete().eq("id", userId);

    if (error) {
      return { success: false, error: "사용자 삭제에 실패했습니다." };
    }

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류가 발생했습니다.";
    return { success: false, error: errorMessage };
  }
};
