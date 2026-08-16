import type { ReactNode } from 'react';
import { fieldLabel } from './formStyles';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={fieldLabel}>{label}</div>
      {children}
    </div>
  );
}
