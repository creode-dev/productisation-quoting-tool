import { createContext, useContext, ReactNode } from 'react';
import { User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for now - authentication is temporarily disabled
const MOCK_USER: User = {
  email: 'user@creode.co.uk',
  name: 'Demo User',
  picture: undefined,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // Authentication is temporarily disabled
  // TODO: Re-enable authentication when Google OAuth is implemented
  // For now, return a mock authenticated user
  const user = MOCK_USER;
  const loading = false;
  const isAuthenticated = true;

  const refreshUser = async () => {
    // No-op for now
  };

  const logout = async () => {
    // No-op for now - could navigate to login page if needed
    console.log('Logout called (authentication disabled)');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


