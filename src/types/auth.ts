export interface User {
  email: string;
  name?: string;
  picture?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}





