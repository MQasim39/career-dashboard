
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateUserProfile: (metadata: { [key: string]: any }) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (event === "SIGNED_IN") {
          navigate("/");
        } else if (event === "SIGNED_OUT") {
          navigate("/auth/login");
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
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

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      // NOTE: Temporarily disabled email verification for development
      // In production, set emailRedirectTo and remove skipConfirmation
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: name,
          },
          // Skip email verification temporarily for development
          emailRedirectTo: undefined,
        },
      });
      
      if (error) {
        throw error;
      }
      
      // Now immediately sign in the user after successful signup
      // This bypasses the email verification step
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInError) {
        throw signInError;
      }
      
      toast({
        title: "Account created!",
        description: "Your account has been created and you're now signed in.",
      });
      
      // Navigate to dashboard after successful signup and auto-login
      navigate("/");
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

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      
      // Clear any stored data if needed
      localStorage.removeItem("supabase.auth.token");
      
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
      
      // Navigate to login page
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
      
      // Navigate to login page after sending reset email
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
      
      // Navigate to dashboard after updating password
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
      
      // Update the local user state with the new metadata
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
        loading,
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
