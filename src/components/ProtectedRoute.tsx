interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Authentication is temporarily disabled - allow all access
  // TODO: Re-enable authentication when Google OAuth is implemented
  return <>{children}</>;
}


