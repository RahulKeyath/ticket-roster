import React, { createContext, useContext, useState } from "react";

type TabsContextType = { value: string; setValue: (v: string) => void };
const TabsContext = createContext<TabsContextType | null>(null);

export function Tabs({ defaultValue, children, className = "" }: { defaultValue?: string; children?: React.ReactNode; className?: string }) {
  const [value, setValue] = useState(defaultValue ?? "0");
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}
export const TabsList: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = "" }) => {
  return <div role="tablist" className={className}>{children}</div>;
};

export function TabsTrigger({ value, children, className = "", ...props }: { value: string; children?: React.ReactNode; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = useContext(TabsContext)!;
  const active = ctx.value === value;
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={() => ctx.setValue(value)}
      className={`${className} ${active ? "font-semibold border-b-2" : ""}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className = "" }: { value: string; children?: React.ReactNode; className?: string }) {
  const ctx = useContext(TabsContext)!;
  return ctx.value === value ? <div className={className}>{children}</div> : null;
}
