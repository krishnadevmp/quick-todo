import { createContext, useContext, useEffect, useRef, useState } from 'react';
import Button, { type ButtonProps } from '@/components/ui/Button';

// ── Generic dropdown menu ────────────────────────────────────────────────
// Generalizes the outside-click dropdown pattern duplicated in FilterBar's
// TagFilter/SortControl, plus Escape-to-close (matching the overlay
// convention used by QuickAddOverlay/EditTaskOverlay/ExpenseFormOverlay).

const MenuContext = createContext<{ close: () => void } | null>(null);

interface MenuProps {
  trigger: (state: { open: boolean; toggle: () => void }) => React.ReactNode;
  /** Panel alignment relative to the trigger — default 'left' */
  align?: 'left' | 'right';
  /** Panel opens below (default) or above the trigger — 'up' for bottom-pinned triggers like the FAB */
  direction?: 'down' | 'up';
  /** Merged onto the position:relative wrapper — e.g. so FAB can make the wrapper itself position:fixed */
  wrapperStyle?: React.CSSProperties;
  children: React.ReactNode;
}

export default function Menu({ trigger, align = 'left', direction = 'down', wrapperStyle, children }: MenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Outside click — same pattern as FilterBar's TagFilter/SortControl
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', ...wrapperStyle }}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}

      {open && (
        <div style={{
          position: 'absolute',
          ...(direction === 'up' ? { bottom: 'calc(100% + 6px)' } : { top: 'calc(100% + 6px)' }),
          ...(align === 'right' ? { right: 0 } : { left: 0 }),
          zIndex: 20,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          minWidth: 160,
          padding: '6px 0',
        }}>
          <MenuContext.Provider value={{ close: () => setOpen(false) }}>
            {children}
          </MenuContext.Provider>
        </div>
      )}
    </div>
  );
}

// ── MenuItem ──────────────────────────────────────────────────────────────
// Matches the ghost-button row styling already duplicated in TagFilter/SortControl.

interface MenuItemProps extends ButtonProps {
  active?: boolean;
  /** Close the menu after this item is clicked — default true */
  closeOnClick?: boolean;
}

export function MenuItem({ active, closeOnClick = true, onClick, style, children, ...rest }: MenuItemProps) {
  const ctx = useContext(MenuContext);
  return (
    <Button
      variant="ghost"
      onClick={(e) => {
        onClick?.(e);
        if (closeOnClick) ctx?.close();
      }}
      style={{
        justifyContent: 'flex-start',
        gap: 8,
        width: '100%',
        padding: '6px 12px',
        borderRadius: 0,
        background: active ? 'var(--accent-soft)' : undefined,
        color: active ? 'var(--accent)' : 'var(--text-primary)',
        fontSize: 13,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Button>
  );
}
