import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuthStore from "@/stores/useAuthStore";

export default function ProtectedRoute({ children }) {
  const [isChecking, setIsChecking] = useState(true);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  
  useEffect(() => {
    // Check auth on mount
    const authStatus = checkAuth();
    setIsChecking(false);
  }, [checkAuth]);

  // Show loading while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return children;
}