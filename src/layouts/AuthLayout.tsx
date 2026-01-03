import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { tokenUtils } from '@/lib/token-utils';

export default function AuthLayout() {
  const navigate = useNavigate();

  // Redirect authenticated users away from auth pages
  useEffect(() => {
    if (tokenUtils.isAuthenticated()) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  // Don't render auth pages if already authenticated
  if (tokenUtils.isAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen w-screen">
      <Outlet />
    </div>
  );
}
