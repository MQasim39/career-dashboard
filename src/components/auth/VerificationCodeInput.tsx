
import React from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

interface VerificationCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
}

const VerificationCodeInput = ({
  value,
  onChange,
  maxLength = 6,
  disabled = false,
  className,
}: VerificationCodeInputProps) => {
  return (
    <InputOTP
      maxLength={maxLength}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={cn("justify-center", className)}
      render={({ slots }) => (
        <InputOTPGroup className="gap-2">
          {slots.map((slot, index) => (
            <InputOTPSlot
              key={index}
              {...slot}
              index={index}
              className="w-10 h-12 text-lg border-border"
              aria-label={`Digit ${index + 1}`}
            />
          ))}
        </InputOTPGroup>
      )}
    />
  );
};

export default VerificationCodeInput;
