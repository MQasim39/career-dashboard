
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Process the OAuth or email confirmation callback
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Auth callback error:", error);
        navigate("/auth/login");
        return;
      }

      // If user exists and is verified, go to dashboard
      if (data.session?.user?.email_confirmed_at) {
        navigate("/dashboard");
      } 
      // If user exists but isn't verified, go to verification page
      else if (data.session?.user) {
        navigate("/auth/verify-email");
      } 
      // No session, go to login
      else {
        navigate("/auth/login");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Processing authentication...</p>
    </div>
  );
};

export default AuthCallback;
