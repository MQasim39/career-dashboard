
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, AlertCircle, CheckCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import VerificationCodeInput from "@/components/auth/VerificationCodeInput";

const EMAIL_CODE_LENGTH = 6;
const RESEND_COOLDOWN_SEC = 60;

const VerifyEmail = () => {
  const { user, verifyEmail, resendVerificationCode, loading, session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [verificationCode, setVerificationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  // If user is already verified, redirect to dashboard
  useEffect(() => {
    if (user?.email_confirmed_at) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // If no user exists at all, redirect to login
  useEffect(() => {
    if (!loading && !user && !session) {
      navigate("/auth/login");
    }
  }, [user, session, loading, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    let interval: number | undefined;
    
    if (resendCooldown > 0) {
      interval = window.setInterval(() => {
        setResendCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCooldown]);

  const handleVerify = async () => {
    if (verificationCode.length !== EMAIL_CODE_LENGTH) {
      setError("Please enter the complete verification code");
      return;
    }
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      await verifyEmail(verificationCode);
      toast({
        title: "Email verified",
        description: "Your email has been successfully verified.",
        variant: "default",
      });
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Verification error:", error);
      setError(error?.message || "Invalid verification code. Please try again.");
      setVerificationCode("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    
    setError(null);
    
    try {
      await resendVerificationCode();
      setResendCooldown(RESEND_COOLDOWN_SEC);
      toast({
        title: "Code resent",
        description: "A new verification code has been sent to your email.",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Resend error:", error);
      toast({
        title: "Failed to resend code",
        description: error?.message || "Please try again later.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6 p-8">
      <div className="text-center">
        <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground font-heading">
          Verify your email
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We've sent a verification code to{" "}
          <span className="font-medium text-foreground">{user?.email}</span>
        </p>
      </div>

      <div className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Enter verification code</label>
          <VerificationCodeInput
            value={verificationCode}
            onChange={setVerificationCode}
            maxLength={EMAIL_CODE_LENGTH}
            disabled={isSubmitting}
          />
        </div>

        <Button
          onClick={handleVerify}
          disabled={verificationCode.length !== EMAIL_CODE_LENGTH || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Verify Email
            </>
          )}
        </Button>

        <div className="flex flex-col items-center space-y-4 text-sm">
          <p className="text-center text-muted-foreground">
            Didn't receive the code?{" "}
            <button
              onClick={handleResendCode}
              disabled={resendCooldown > 0}
              className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
            >
              {resendCooldown > 0
                ? `Resend (${resendCooldown}s)`
                : "Resend code"}
            </button>
          </p>
          <Link
            to="/auth/login"
            className="text-primary hover:underline text-sm"
          >
            Return to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
