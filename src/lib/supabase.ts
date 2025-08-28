import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 환경 변수 확인
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase 환경 변수가 설정되지 않았습니다:");
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL:",
    supabaseUrl ? "설정됨" : "설정되지 않음"
  );
  console.error(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY:",
    supabaseAnonKey ? "설정됨" : "설정되지 않음"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: "nms-auth-token",
  },
});

// Supabase 연결 테스트
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error("Supabase 연결 오류:", error);
  } else {
    console.log("Supabase 연결 성공");
  }
});

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          branch?: string;
          team?: string;
          avatar?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          branch?: string;
          team?: string;
          avatar?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          branch?: string;
          team?: string;
          avatar?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_auth: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      individual_rankings: {
        Row: {
          id: string;
          rank: number;
          branch: string;
          team: string;
          manager: string;
          credits_other: number;
          credits_new: number;
          credits_existing: number;
          total_sales: number;
          period: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          rank: number;
          branch: string;
          team: string;
          manager: string;
          credits_other: number;
          credits_new: number;
          credits_existing: number;
          total_sales: number;
          period: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          rank?: number;
          branch?: string;
          team?: string;
          manager?: string;
          credits_other?: number;
          credits_new?: number;
          credits_existing?: number;
          total_sales?: number;
          period?: string;
          created_at?: string;
        };
      };
      branch_rankings: {
        Row: {
          id: string;
          rank: number;
          branch: string;
          branch_manager: string;
          total_sales: number;
          period: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          rank: number;
          branch: string;
          branch_manager: string;
          total_sales: number;
          period: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          rank?: number;
          branch?: string;
          branch_manager?: string;
          total_sales?: number;
          period?: string;
          created_at?: string;
        };
      };
    };
  };
}
