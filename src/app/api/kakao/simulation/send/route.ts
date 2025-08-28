import { NextRequest, NextResponse } from "next/server";

interface SendMessageRequest {
  phoneNumber: string;
  message: string;
  customerName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendMessageRequest = await request.json();
    const { phoneNumber, message, customerName } = body;

    // 시뮬레이션: 실제 발송 대신 성공 응답
    console.log("카카오톡 시뮬레이션 발송:", {
      phoneNumber,
      customerName,
      message: message.substring(0, 50) + "...",
      timestamp: new Date().toISOString(),
    });

    // 랜덤하게 성공/실패 시뮬레이션 (90% 성공률)
    const isSuccess = Math.random() > 0.1;

    if (isSuccess) {
      return NextResponse.json({
        success: true,
        message: "메시지가 성공적으로 발송되었습니다. (시뮬레이션)",
        data: {
          message_id: `sim_${Date.now()}`,
          status: "sent",
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "메시지 발송에 실패했습니다. (시뮬레이션)",
          error: "수신자가 메시지를 차단했습니다.",
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("카카오톡 시뮬레이션 발송 실패:", error);

    return NextResponse.json(
      {
        error: "메시지 발송에 실패했습니다.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
