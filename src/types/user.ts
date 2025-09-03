export interface User {
  avatar: null;
  id: string;
  email: string;
  name: string;
  branch: string;
  team: string;
  position?: string | null;
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
