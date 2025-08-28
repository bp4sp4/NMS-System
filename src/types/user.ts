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
  created_at?: string;
  updated_at?: string;
}
