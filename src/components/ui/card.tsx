import React from "react";

export const Card = ({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) => {
  return <div className={`bg-white rounded-2xl shadow-sm ${className}`}>{children}</div>;
};

export const CardContent = ({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) => {
  return <div className={className}>{children}</div>;
};
