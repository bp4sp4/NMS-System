import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 환경 변수 검증
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: "nms-auth-token",
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: "pkce",
    // 세션 만료 시 자동 정리
    storage: {
      getItem: (key) => {
        try {
          if (typeof window !== "undefined") {
            const item = localStorage.getItem(key);
            return item;
          }
          return null;
        } catch (error) {
          console.error(`Storage getItem error for ${key}:`, error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          if (typeof window !== "undefined") {
            localStorage.setItem(key, value);
          }
        } catch (error) {
          console.error(`Storage setItem error for ${key}:`, error);
        }
      },
      removeItem: (key) => {
        try {
          if (typeof window !== "undefined") {
            localStorage.removeItem(key);
          }
        } catch (error) {
          console.error(`Storage removeItem error for ${key}:`, error);
        }
      },
    },
  },
  global: {
    headers: {
      "X-Client-Info": "nms-system",
    },
  },
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
