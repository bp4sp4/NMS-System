import axios from "axios";

export interface UserKakaoSettings {
  id?: string;
  userId: string;
  kakaoAccessToken: string;
  kakaoBusinessId?: string;
  kakaoTemplateId?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserKakaoMessage {
  userId: string;
  phoneNumber: string;
  message: string;
  customerName?: string;
}

export interface UserKakaoSendResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * 사용자별 카카오톡 설정 조회
 */
export const getUserKakaoSettings = async (
  userId: string
): Promise<UserKakaoSettings | null> => {
  try {
    const response = await axios.get(
      `/api/user/kakao-settings?userId=${userId}`
    );

    if (response.data.success) {
      return response.data.data;
    }

    return null;
  } catch (error) {
    console.error("사용자 카카오톡 설정 조회 실패:", error);
    return null;
  }
};

/**
 * 사용자별 카카오톡 설정 저장/수정
 */
export const saveUserKakaoSettings = async (
  settings: Omit<UserKakaoSettings, "id" | "createdAt" | "updatedAt">
): Promise<{ success: boolean; message: string; data?: UserKakaoSettings }> => {
  try {
    const response = await axios.post("/api/user/kakao-settings", settings);

    return {
      success: response.data.success,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error("사용자 카카오톡 설정 저장 실패:", error);

    return {
      success: false,
      message: error.response?.data?.error || "설정 저장에 실패했습니다.",
    };
  }
};

/**
 * 사용자별 카카오톡 설정 삭제
 */
export const deleteUserKakaoSettings = async (
  userId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.delete(
      `/api/user/kakao-settings?userId=${userId}`
    );

    return {
      success: response.data.success,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("사용자 카카오톡 설정 삭제 실패:", error);

    return {
      success: false,
      message: error.response?.data?.error || "설정 삭제에 실패했습니다.",
    };
  }
};

/**
 * 사용자별 카카오톡 메시지 발송
 */
export const sendUserKakaoMessage = async (
  messageData: UserKakaoMessage
): Promise<UserKakaoSendResult> => {
  try {
    const response = await axios.post("/api/kakao/user-send", messageData);

    return {
      success: true,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error("사용자별 카카오톡 발송 실패:", error);

    return {
      success: false,
      message: "메시지 발송에 실패했습니다.",
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * 사용자별 카카오톡 대량 메시지 발송
 */
export const sendUserKakaoBulkMessage = async (
  messages: UserKakaoMessage[],
  delayMs: number = 1000
): Promise<UserKakaoSendResult[]> => {
  const results: UserKakaoSendResult[] = [];

  for (let i = 0; i < messages.length; i++) {
    const result = await sendUserKakaoMessage(messages[i]);
    results.push(result);

    // 발송 속도 조절 (API 제한 방지)
    if (i < messages.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
};

/**
 * 사용자별 카카오톡 테스트 메시지 발송
 */
export const sendUserKakaoTestMessage = async (
  userId: string,
  message: string
): Promise<UserKakaoSendResult> => {
  const testPhoneNumber =
    process.env.NEXT_PUBLIC_TEST_PHONE_NUMBER || "010-0000-0000";

  return sendUserKakaoMessage({
    userId,
    phoneNumber: testPhoneNumber,
    message,
    customerName: "테스트 사용자",
  });
};
