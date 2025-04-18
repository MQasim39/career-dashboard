
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Process the OAuth or email confirmation callback
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Auth callback error:", error);
        navigate("/auth/login");
        return;
      }

      // Check admin status
      if (data.session?.user) {
        try {
          const { data: isAdminData, error: isAdminError } = await supabase.rpc('is_admin', { 
            uid: data.session.user.id 
          });
          
          console.log("Admin check result:", isAdminData);
          
          // If user exists and is verified
          if (data.session?.user?.email_confirmed_at) {
            // Get the intended destination from state if available
            const from = location.state?.from?.pathname;
            
            // Redirect based on admin status or intended destination
            if (from && from !== "/auth/login" && from !== "/auth/callback") {
              console.log("Redirecting to intended destination:", from);
              navigate(from);
            } else if (isAdminData) {
              navigate("/admin");
            } else {
              navigate("/dashboard");
            }
          } 
          // If user exists but isn't verified
          else {
            navigate("/auth/verify-email");
          }
        } catch (error) {
          console.error("Admin check error:", error);
          
          if (data.session?.user?.email_confirmed_at) {
            const from = location.state?.from?.pathname;
            if (from && from !== "/auth/login" && from !== "/auth/callback") {
              navigate(from);
            } else {
              navigate("/dashboard");
            }
          } else {
            navigate("/auth/verify-email");
          }
        }
      } 
      // No session, go to login
      else {
        navigate("/auth/login");
      }
    };

    handleAuthCallback();
  }, [navigate, location]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Processing authentication...</p>
    </div>
  );
};

export default AuthCallback;
