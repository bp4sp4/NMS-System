import axios from "axios";

export interface SMSMessage {
  phoneNumber: string;
  message: string;
  customerName?: string;
  senderId?: string; // 발송자 ID (사용자별 구분)
}

export interface SMSSendResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * 네이버 클라우드 플랫폼 SMS 발송
 */
export const sendSMSMessage = async (
  messageData: SMSMessage
): Promise<SMSSendResult> => {
  try {
    // 네이버 클라우드 플랫폼 SMS API 호출
    const response = await axios.post("/api/sms/send", messageData);

    return {
      success: true,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error("SMS 발송 실패:", error);

    return {
      success: false,
      message: "메시지 발송에 실패했습니다.",
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * 사용자별 SMS 발송 (발송자 정보 포함)
 */
export const sendSMSByUser = async (
  messageData: SMSMessage,
  userId: string,
  userName: string
): Promise<SMSSendResult> => {
  try {
    // 발송자 정보 추가
    const messageWithSender = {
      ...messageData,
      senderId: userId,
      senderName: userName,
    };

    const response = await axios.post("/api/sms/send", messageWithSender);

    // 발송 로그 저장 (사용자별 구분)
    await saveSMSLog(messageWithSender, response.data.success);

    return {
      success: true,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error("사용자별 SMS 발송 실패:", error);

    return {
      success: false,
      message: "메시지 발송에 실패했습니다.",
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * SMS 발송 로그 저장
 */
const saveSMSLog = async (
  messageData: SMSMessage & { senderName: string },
  success: boolean
) => {
  try {
    await axios.post("/api/sms/log", {
      senderId: messageData.senderId,
      senderName: messageData.senderName,
      phoneNumber: messageData.phoneNumber,
      customerName: messageData.customerName,
      message: messageData.message.substring(0, 100) + "...",
      success,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("SMS 로그 저장 실패:", error);
  }
};

/**
 * 사용자별 SMS 발송 통계 조회
 */
export const getUserSMSStats = async (userId: string) => {
  try {
    const response = await axios.get(`/api/sms/stats/${userId}`);
    return response.data;
  } catch (error) {
    console.error("SMS 통계 조회 실패:", error);
    return null;
  }
};

/**
 * 사용자별 SMS 발송 내역 조회
 */
export const getUserSMSHistory = async (userId: string, page: number = 1) => {
  try {
    const response = await axios.get(`/api/sms/history/${userId}?page=${page}`);
    return response.data;
  } catch (error) {
    console.error("SMS 내역 조회 실패:", error);
    return null;
  }
};
