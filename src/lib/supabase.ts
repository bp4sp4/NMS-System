import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
