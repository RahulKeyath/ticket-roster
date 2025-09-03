import React from "react";

export const Label: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = "" }) => {
  return <label className={`block text-sm font-medium ${className}`}>{children}</label>;
};
