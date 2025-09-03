import React from "react";

export const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  return <textarea {...props} className={`border rounded p-2 text-sm w-full ${props.className ?? ""}`} />;
};
