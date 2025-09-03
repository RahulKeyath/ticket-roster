import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "secondary" | "outline" | "default" };

export const Button: React.FC<Props> = ({ variant, className = "", children, ...props }) => {
  const base = "inline-flex items-center gap-2 px-3 py-1 rounded-2xl border text-sm";
  const vclass =
    variant === "secondary"
      ? "bg-slate-100 border-slate-200"
      : variant === "outline"
      ? "bg-transparent border-slate-300"
      : "bg-blue-600 text-white border-blue-600";

  return (
    <button {...props} className={`${base} ${vclass} ${className}`}>
      {children}
    </button>
  );
};

export default Button;
