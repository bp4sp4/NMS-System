// src/app/api/send-sms/route.js
import { sendSMS } from "@/lib/sms";

export async function POST(request) {
  try {
    const { phoneNumber, message } = await request.json();

    if (!phoneNumber || !message) {
      return Response.json(
        { error: "전화번호와 메시지가 필요합니다" },
        { status: 400 }
      );
    }

    const result = await sendSMS(phoneNumber, message);

    if (result.success) {
      return Response.json({ success: true, message: "SMS가 전송되었습니다" });
    } else {
      return Response.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    return Response.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
