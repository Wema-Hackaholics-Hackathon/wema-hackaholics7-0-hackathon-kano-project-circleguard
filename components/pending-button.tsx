"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

export function PendingButton({ children, pendingLabel = "Please wait…", disabled, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return <button {...props} type={props.type ?? "submit"} disabled={disabled || pending} aria-busy={pending} className={`${className} disabled:cursor-wait disabled:opacity-60`}>
    {pending && <LoaderCircle size={15} className="shrink-0 animate-spin" />}
    {pending ? pendingLabel : children}
  </button>;
}
