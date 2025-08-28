export interface User {
  id: string;
  email: string;
  name: string;
  branch: string;
  team: string;
  avatar?: string | null;
  hire_date?: string | null;
  bank?: string | null;
  bank_account?: string | null;
  address?: string | null;
  resident_number?: string | null;
  emergency_contact?: string | null;
  is_admin?: boolean;
  is_super_admin?: boolean;
  created_at?: string;
  updated_at?: string;
}

// 사용자 정책 타입
export interface UserPolicy {
  id: string;
  user_id: string;
  policy_type: "attendance" | "leave" | "overtime" | "remote" | "other";
  policy_name: string;
  policy_description?: string;
  is_active: boolean;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

// 정책 생성/수정용 타입
export interface CreateUserPolicy {
  user_id: string;
  policy_type: "attendance" | "leave" | "overtime" | "remote" | "other";
  policy_name: string;
  policy_description?: string;
  is_active: boolean;
  start_date: string;
  end_date?: string;
}

export interface UpdateUserPolicy {
  policy_type?: "attendance" | "leave" | "overtime" | "remote" | "other";
  policy_name?: string;
  policy_description?: string;
  is_active?: boolean;
  start_date?: string;
  end_date?: string;
}
