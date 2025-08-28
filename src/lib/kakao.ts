import axios from "axios";

export interface KakaoMessage {
  phoneNumber: string;
  message: string;
  customerName?: string;
  templateId?: string;
}

export interface KakaoSendResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * 카카오톡 메시지 발송
 */
export const sendKakaoMessage = async (
  messageData: KakaoMessage
): Promise<KakaoSendResult> => {
  try {
    // 시뮬레이션 모드 사용 (실제 API 대신)
    const response = await axios.post(
      "/api/kakao/simulation/send",
      messageData
    );

    return {
      success: true,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error("카카오톡 발송 실패:", error);

    return {
      success: false,
      message: "메시지 발송에 실패했습니다.",
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * 카카오톡 테스트 메시지 발송
 */
export const sendKakaoTestMessage = async (
  message: string,
  isPolite: boolean = true
): Promise<KakaoSendResult> => {
  const testPhoneNumber =
    process.env.NEXT_PUBLIC_TEST_PHONE_NUMBER || "010-0000-0000";

  return sendKakaoMessage({
    phoneNumber: testPhoneNumber,
    message,
    customerName: "테스트 사용자",
  });
};

/**
 * 카카오톡 대량 메시지 발송
 */
export const sendKakaoBulkMessage = async (
  messages: KakaoMessage[],
  delayMs: number = 1000
): Promise<KakaoSendResult[]> => {
  const results: KakaoSendResult[] = [];

  for (let i = 0; i < messages.length; i++) {
    const result = await sendKakaoMessage(messages[i]);
    results.push(result);

    // 발송 속도 조절 (API 제한 방지)
    if (i < messages.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
};

/**
 * 메시지 템플릿 생성
 */
export const createMessageTemplate = (
  baseMessage: string,
  customerName?: string,
  addTitle: boolean = false
): string => {
  let message = baseMessage;

  if (addTitle && customerName) {
    message = `${customerName}님,\n\n${message}`;
  }

  return message;
};

/**
 * 발송 속도에 따른 딜레이 계산
 */
export const getDelayBySpeed = (speed: string): number => {
  switch (speed) {
    case "느림":
      return 3000; // 3초
    case "보통":
      return 1000; // 1초
    case "빠름":
      return 500; // 0.5초
    case "매우 빠름":
      return 200; // 0.2초
    default:
      return 1000;
  }
};
