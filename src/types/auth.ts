export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  password?: string;
  branch?: string;
  team?: string;
  avatar?: string;
  hire_date?: string;
  position?: string;
  contact?: string;
  bank?: string;
  bank_account?: string;
  address?: string;
  resident_number?: string;
  emergency_contact_a?: string;
  emergency_contact_b?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginResponse {
  user: User;
  token: string;
}
