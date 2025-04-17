
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, checkAdminStatus } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Enhanced debug log to help troubleshoot auth issues
    console.log("ProtectedRoute: Auth state", { 
      user, 
      loading, 
      path: location.pathname,
      hasUser: !!user,
      isVerified: user?.email_confirmed_at ? true : false,
      metadata: user?.user_metadata
    });

    // Check admin status whenever the user or location changes
    if (user) {
      checkAdminStatus();
    }
  }, [user, loading, location, checkAdminStatus]);

  // Show loading indicator while auth state is being determined
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }
  
  // Redirect to email verification if not verified
  if (!user.email_confirmed_at) {
    return <Navigate to="/auth/verify-email" state={{ from: location }} replace />;
  }

  // Render children if authenticated and verified
  return <>{children}</>;
};

export default ProtectedRoute;
