import { createClient } from "@supabase/supabase-js";

// Supabase 클라이언트 초기화
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false, // 세션을 자동으로 저장하지 않음
      autoRefreshToken: false, // 토큰 자동 갱신 비활성화
    },
    db: {
      schema: "public",
    },
    global: {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  }
);
