import axios from "axios";

export interface KakaoChannelSettings {
  channelId: string;
  accessToken: string;
  templateId?: string;
  isActive: boolean;
}

export interface KakaoChannelMessage {
  channelId: string;
  phoneNumber: string;
  message: string;
  templateId?: string;
  customerName?: string;
  buttons?: Array<{
    type: string;
    name: string;
    url?: string;
  }>;
}

export interface KakaoChannelSendResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * 카카오톡 채널 메시지 발송
 */
export const sendKakaoChannelMessage = async (
  messageData: KakaoChannelMessage
): Promise<KakaoChannelSendResult> => {
  try {
    const response = await axios.post("/api/kakao/channel/send", messageData);
    
    return {
      success: true,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error("카카오톡 채널 발송 실패:", error);
    
    return {
      success: false,
      message: "메시지 발송에 실패했습니다.",
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * 카카오톡 채널 템플릿 메시지 발송
 */
export const sendKakaoChannelTemplate = async (
  channelId: string,
  phoneNumber: string,
  templateId: string,
  variables: Record<string, string> = {}
): Promise<KakaoChannelSendResult> => {
  try {
    const response = await axios.post("/api/kakao/channel/template", {
      channelId,
      phoneNumber,
      templateId,
      variables,
    });
    
    return {
      success: true,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error("카카오톡 채널 템플릿 발송 실패:", error);
    
    return {
      success: false,
      message: "템플릿 메시지 발송에 실패했습니다.",
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * 카카오톡 채널 대량 메시지 발송
 */
export const sendKakaoChannelBulkMessage = async (
  messages: KakaoChannelMessage[],
  delayMs: number = 1000
): Promise<KakaoChannelSendResult[]> => {
  const results: KakaoChannelSendResult[] = [];

  for (let i = 0; i < messages.length; i++) {
    const result = await sendKakaoChannelMessage(messages[i]);
    results.push(result);

    // 발송 속도 조절 (API 제한 방지)
    if (i < messages.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
};

/**
 * 발송 방식 선택 (개인 API vs 채널 API)
 */
export const selectKakaoSendMethod = async (
  userSettings: any,
  channelSettings: any,
  messageData: any
): Promise<KakaoChannelSendResult> => {
  // 1. 채널 API 우선 시도 (검수 완료된 경우)
  if (channelSettings && channelSettings.isActive) {
    try {
      const channelResult = await sendKakaoChannelMessage({
        channelId: channelSettings.channelId,
        ...messageData,
      });
      
      if (channelResult.success) {
        return channelResult;
      }
    } catch (error) {
      console.log("채널 API 실패, 개인 API로 대체");
    }
  }

  // 2. 개인 API로 대체
  if (userSettings && userSettings.isActive) {
    try {
      const response = await axios.post("/api/kakao/user-send", {
        userId: userSettings.userId,
        ...messageData,
      });
      
      return {
        success: true,
        message: response.data.message,
        data: response.data.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: "개인 API 발송에 실패했습니다.",
        error: error.message,
      };
    }
  }

  // 3. 모든 방법 실패
  return {
    success: false,
    message: "카카오톡 발송에 실패했습니다. SMS로 대체합니다.",
  };
};
