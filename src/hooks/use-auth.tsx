
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, requestAdmin?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateUserProfile: (metadata: { [key: string]: any }) => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  resendVerificationCode: () => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
  checkAdminStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [initialAuthCheckDone, setInitialAuthCheckDone] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkAdminStatus = async () => {
    if (!user) return false;
    
    try {
      console.log('Checking admin status for user:', user.id);
      const { data, error } = await supabase.rpc('is_admin', { uid: user.id });
      
      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      
      console.log('Admin status check result:', data);
      setIsAdmin(!!data);
      return !!data;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  // Only redirect on sign-in or when email verification is required
  const handleRedirection = async (userObj: User | null, forceRedirect = false) => {
    if (!userObj) return;
    
    console.log('Handling redirection for user:', userObj.email, 'Force redirect:', forceRedirect);
    
    // If email not confirmed, always redirect to verification
    if (!userObj.email_confirmed_at) {
      navigate("/auth/verify-email");
      return;
    }
    
    // Only continue with redirection if we're forcing it (e.g., after sign-in)
    if (!forceRedirect) {
      console.log('Skipping redirection as not forced');
      return;
    }
    
    const adminStatus = await checkAdminStatus();
    console.log('User admin status:', adminStatus);
    
    if (adminStatus) {
      console.log('Redirecting to admin dashboard');
      navigate("/admin");
    } else {
      console.log('Redirecting to user dashboard');
      navigate("/dashboard");
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          // Don't redirect immediately, defer to handle properly
          if (session?.user) {
            setTimeout(() => {
              // Only force redirect on fresh sign-in
              handleRedirection(session.user, event === "SIGNED_IN");
            }, 0);
          }
        } else if (event === "SIGNED_OUT") {
          setIsAdmin(false);
          navigate("/");
        }
        
        if (!initialAuthCheckDone) {
          setInitialAuthCheckDone(true);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkAdminStatus().then(() => {
          // Don't force redirect on initial load - user might be on a specific page already
          setInitialAuthCheckDone(true);
          setLoading(false);
        });
      } else {
        setInitialAuthCheckDone(true);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, requestAdmin: boolean = false) => {
    try {
      setLoading(true);
      console.log('Signing up with admin request:', requestAdmin);
      
      const { error, data } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: name,
            requestAdmin
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      
      console.log('Signup successful, metadata:', data?.user?.user_metadata);
      
      toast({
        title: "Verification required",
        description: "Please check your email for a verification code.",
      });
      navigate("/auth/verify-email");
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "Please check your information and try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (code: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.verifyOtp({
        email: user?.email!,
        token: code,
        type: 'email',
      });
      
      if (error) {
        throw error;
      }
      
      if (user) {
        setUser({
          ...user,
          email_confirmed_at: new Date().toISOString(),
        });
      }
      
      toast({
        title: "Email verified",
        description: "Your email has been successfully verified.",
      });
      
      // Check admin status after verification and redirect appropriately
      const isUserAdmin = await checkAdminStatus();
      if (isUserAdmin) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired verification code.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationCode = async () => {
    try {
      setLoading(true);
      
      if (!user?.email) {
        throw new Error("No email address found");
      }
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Verification code sent",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to resend code",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      
      localStorage.removeItem("supabase.auth.token");
      
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
      
      navigate("/auth/login");
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message || "An error occurred while signing out.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Reset link sent",
        description: "Check your email for a password reset link.",
      });
      
      navigate("/auth/login");
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message || "Please check your email and try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      });
      
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Password update failed",
        description: error.message || "An error occurred while updating your password.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (metadata: { [key: string]: any }) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        data: metadata
      });
      
      if (error) {
        throw error;
      }
      
      if (user) {
        setUser({
          ...user,
          user_metadata: {
            ...user.user_metadata,
            ...metadata
          }
        });
      }
      
      return;
    } catch (error: any) {
      toast({
        title: "Profile update failed",
        description: error.message || "An error occurred while updating your profile.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        updateUserProfile,
        verifyEmail,
        resendVerificationCode,
        loading,
        isAdmin,
        checkAdminStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
