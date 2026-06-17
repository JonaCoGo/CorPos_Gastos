import { ReactNode } from 'react';

interface LabelProps {
  children: ReactNode;
}

export function Label({ children }: LabelProps) {
  return <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 6 }}>{children}</div>;
}
