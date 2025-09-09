import { createClient } from "@supabase/supabase-js";

// Supabase 클라이언트 초기화
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true, // 세션을 자동으로 저장
      autoRefreshToken: true, // 토큰 자동 갱신 활성화
    },
    db: {
      schema: "public",
    },
    global: {
      headers: {
        Accept: "application/json",
        // Content-Type은 제거 - 파일 업로드 시 자동으로 설정되도록 함
      },
    },
  }
);
