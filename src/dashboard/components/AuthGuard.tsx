import { Navigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';

export function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
